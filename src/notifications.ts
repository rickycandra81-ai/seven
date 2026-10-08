// The web canvas hands its rest alarm to a service worker so it still fires with
// the screen off. The native equivalent is an OS-scheduled local notification:
// the system owns the alarm, so a backgrounded or frozen app no longer swallows it.

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REST_TAG = 'seven-rest';
const HYDRATE_TAG = 'seven-hydrate';
const PR_TAG = 'seven-pr';

let restAlarmId: string | null = null;

export async function requestNotificationPermission(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') await Notifications.requestPermissionsAsync();
  } catch (e) {
    // notifications are a nicety — never block the app on them
  }
}

export function restAlarmArmed(): boolean {
  return !!restAlarmId;
}

// hand the alarm to the OS the moment a rest starts
export async function armRest(endAt: number, between: boolean): Promise<void> {
  await disarmRest();
  const seconds = Math.round((endAt - Date.now()) / 1000);
  if (seconds <= 0) return;
  try {
    restAlarmId = await Notifications.scheduleNotificationAsync({
      content: {
        title: between ? 'Next exercise' : 'Rest over',
        body: between ? 'Rest is done — start the next exercise.' : 'Time for the next set.',
        data: { tag: REST_TAG },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
      },
    });
  } catch (e) {
    restAlarmId = null;
  }
}

// cancel it if the rest is cut short
export async function disarmRest(): Promise<void> {
  const current = restAlarmId;
  restAlarmId = null;
  if (!current) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(current);
    await Notifications.dismissNotificationAsync(current);
  } catch (e) {
    // already fired or gone
  }
}

// catch-up ping for an app that was foregrounded past the deadline; skipped when
// the OS alarm already fired on time.
export async function notifyRestDone(): Promise<void> {
  if (restAlarmArmed()) return;
  await show(REST_TAG, 'Rest over', 'Time for the next set.');
}

export async function notifyHydrate(doneCount: number): Promise<void> {
  await show(
    HYDRATE_TAG,
    'Drink water',
    'You’ve finished ' + doneCount + ' exercises today. Take a water break.'
  );
}

export async function notifyPR(name: string, line: string): Promise<void> {
  await show(PR_TAG, 'New PR', name + ' · ' + line);
}

// same tag replaces any still-showing notification of that kind instead of stacking
const shown: Record<string, string> = {};
async function show(tag: string, title: string, body: string): Promise<void> {
  try {
    const prev = shown[tag];
    if (prev) await Notifications.dismissNotificationAsync(prev).catch(() => {});
    shown[tag] = await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { tag } },
      trigger: null,
    });
  } catch (e) {
    // ignore
  }
}

// tapping a notification brings the app back to the relevant screen
export function onNotificationTap(handler: (tag: string) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((res) => {
    const tag = (res.notification.request.content.data || {}).tag;
    if (typeof tag === 'string') handler(tag);
  });
  return () => sub.remove();
}
