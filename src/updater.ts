// In-app updates from GitHub Releases.
//
// Every CI build publishes its APK as a release tagged `build-<run number>` and
// stamps that number into the app (expo.extra.build / android.versionCode). The
// app asks GitHub for the latest release, and if its number is higher, downloads
// the APK and hands it to Android's package installer. Android always shows its
// own "Update" confirmation for a sideloaded app; that tap cannot be skipped.
// Builds share the template's signing key, so the update installs over the top
// and keeps all data.

import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as { build?: number | string; updateRepo?: string };

// 0 = a dev / Expo Go run: never offered an update
export const CURRENT_BUILD = Number(extra.build) || 0;
export const UPDATE_REPO = extra.updateRepo || '';

export type UpdateInfo = { build: number; url: string; notes: string; size: number };

export type UpdateState =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'latest'; checkedAt: number }
  | { phase: 'available'; info: UpdateInfo }
  | { phase: 'downloading'; info: UpdateInfo; progress: number }
  | { phase: 'ready'; info: UpdateInfo; file: string }
  | { phase: 'error'; message: string };

let state: UpdateState = { phase: 'idle' };
const listeners = new Set<() => void>();
const set = (s: UpdateState) => {
  state = s;
  listeners.forEach((l) => l());
};

export function useUpdateState(): UpdateState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );
}

export const canUpdate = (): boolean => Platform.OS === 'android' && CURRENT_BUILD > 0 && !!UPDATE_REPO;

// GitHub release → what we need. Tag must be build-<n>; the first .apk asset wins.
export function parseRelease(rel: any): UpdateInfo | null {
  const m = /^build-(\d+)$/.exec(String(rel && rel.tag_name));
  const apk = ((rel && rel.assets) || []).find((a: any) => /\.apk$/i.test(String(a && a.name)));
  if (!m || !apk) return null;
  return { build: Number(m[1]), url: apk.browser_download_url, notes: String(rel.body || '').trim(), size: Number(apk.size) || 0 };
}

export async function checkForUpdate(): Promise<UpdateState> {
  if (!canUpdate()) return state;
  if (state.phase === 'downloading' || state.phase === 'checking') return state;
  set({ phase: 'checking' });
  try {
    const res = await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (res.status === 404) throw new Error('No public release found. Is the repo private?');
    // 403/429 = API rate limit (60 an hour per IP, often shared on wifi / mobile
    // networks); the release web pages are not limited that way
    const limited = res.status === 403 || res.status === 429;
    if (!res.ok && !limited) throw new Error('GitHub answered ' + res.status);
    const info = limited ? await latestFromWeb() : parseRelease(await res.json());
    if (!info) throw new Error('Latest release has no APK');
    set(info.build > CURRENT_BUILD ? { phase: 'available', info } : { phase: 'latest', checkedAt: Date.now() });
  } catch (e: any) {
    set({ phase: 'error', message: e && e.message ? e.message : 'No connection' });
  }
  return state;
}

// Same answer without the API: /releases/latest redirects to the latest tag, and
// the tag's asset list is a small HTML fragment with the download links.
async function latestFromWeb(): Promise<UpdateInfo | null> {
  const page = await fetch(`https://github.com/${UPDATE_REPO}/releases/latest`);
  const tag = /\/releases\/tag\/(build-(\d+))$/.exec(page.url);
  if (!tag) return null;
  const res = await fetch(`https://github.com/${UPDATE_REPO}/releases/expanded_assets/${tag[1]}`);
  if (!res.ok) throw new Error('GitHub answered ' + res.status);
  const href = /href="([^"]+\/releases\/download\/[^"]+\.apk)"/i.exec(await res.text());
  if (!href) return null;
  return { build: Number(tag[2]), url: href[1].startsWith('/') ? 'https://github.com' + href[1] : href[1], notes: '', size: 0 };
}

// Installing never clears the cache, so every downloaded APK (~70 MB) would stay
// behind. Once a build is installed, its APK and any older one are useless.
export async function pruneDownloads(): Promise<void> {
  const dir = FileSystem.cacheDirectory;
  if (!dir) return;
  try {
    const names = await FileSystem.readDirectoryAsync(dir);
    await Promise.all(
      names
        .filter((n) => {
          const m = /^seven-build(\d+)\.apk$/.exec(n);
          return !!m && Number(m[1]) <= CURRENT_BUILD;
        })
        .map((n) => FileSystem.deleteAsync(dir + n, { idempotent: true }))
    );
  } catch {
    // a leftover file is harmless; never block the launch over it
  }
}

export async function downloadAndInstall(): Promise<void> {
  const cur = state;
  if (cur.phase === 'ready') return openInstaller(cur.file);
  if (cur.phase !== 'available') return;
  const info = cur.info;
  const file = FileSystem.cacheDirectory + `seven-build${info.build}.apk`;
  set({ phase: 'downloading', info, progress: 0 });
  try {
    const dl = FileSystem.createDownloadResumable(info.url, file, {}, (p) => {
      const total = p.totalBytesExpectedToWrite > 0 ? p.totalBytesExpectedToWrite : info.size;
      if (total > 0) set({ phase: 'downloading', info, progress: Math.min(1, p.totalBytesWritten / total) });
    });
    const out = await dl.downloadAsync();
    if (!out || out.status !== 200) throw new Error('Download failed');
    set({ phase: 'ready', info, file: out.uri });
    await openInstaller(out.uri);
  } catch (e: any) {
    set({ phase: 'error', message: e && e.message ? e.message : 'Download failed' });
  }
}

async function openInstaller(file: string): Promise<void> {
  // the installer reads the file through our FileProvider, so it needs a
  // content:// uri plus a read grant (FLAG_GRANT_READ_URI_PERMISSION = 1)
  const uri = await FileSystem.getContentUriAsync(file);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: uri,
    type: 'application/vnd.android.package-archive',
    flags: 1,
  });
}
