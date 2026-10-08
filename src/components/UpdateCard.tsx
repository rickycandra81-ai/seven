import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT } from '../theme';
import { CURRENT_BUILD, canUpdate, checkForUpdate, downloadAndInstall, useUpdateState } from '../updater';

// Progress tab card: current build, and a single button that walks
// check → download → install.
export function UpdateCard() {
  const u = useUpdateState();
  if (!canUpdate()) return null;

  let line = 'Tap to look for a newer build.';
  let btn = 'CHECK FOR UPDATE';
  let onPress: (() => void) | null = () => void checkForUpdate();
  let progress = -1;

  if (u.phase === 'checking') {
    line = 'Checking GitHub…';
    btn = 'CHECKING…';
    onPress = null;
  } else if (u.phase === 'latest') {
    line = 'You are on the newest build.';
  } else if (u.phase === 'available') {
    line = `Build ${u.info.build} is available${u.info.size ? ` · ${(u.info.size / 1048576).toFixed(0)} MB` : ''}.`;
    btn = 'UPDATE NOW';
    onPress = () => void downloadAndInstall();
  } else if (u.phase === 'downloading') {
    line = `Downloading build ${u.info.build}… ${Math.round(u.progress * 100)}%`;
    btn = 'DOWNLOADING…';
    onPress = null;
    progress = u.progress;
  } else if (u.phase === 'ready') {
    line = `Build ${u.info.build} downloaded. Confirm “Update” in the Android dialog.`;
    btn = 'INSTALL';
    onPress = () => void downloadAndInstall();
  } else if (u.phase === 'error') {
    line = u.message;
    btn = 'TRY AGAIN';
  }

  const notes = (u.phase === 'available' || u.phase === 'ready' || u.phase === 'downloading') && u.info.notes;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.label}>APP UPDATE</Text>
        <Text style={styles.build}>BUILD {CURRENT_BUILD}</Text>
      </View>
      <Text style={[styles.line, u.phase === 'error' && { color: COLORS.danger }]}>{line}</Text>
      {!!notes && <Text style={styles.notes} numberOfLines={4}>{notes}</Text>}
      {progress >= 0 && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      )}
      <Pressable
        onPress={onPress || undefined}
        disabled={!onPress}
        style={[styles.btn, u.phase === 'available' || u.phase === 'ready' ? styles.btnHot : styles.btnQuiet, !onPress && { opacity: 0.5 }]}
      >
        <Text style={[styles.btnText, { color: u.phase === 'available' || u.phase === 'ready' ? COLORS.accentInk : COLORS.paper }]}>{btn}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.hairline, borderRadius: 18, padding: 16 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.8, color: COLORS.paperFaint },
  build: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.4, color: COLORS.paperFaint },
  line: { fontFamily: FONT.body400, fontSize: 14, lineHeight: 21, color: COLORS.paperDim, marginTop: 8 },
  notes: { fontFamily: FONT.body400, fontSize: 13, lineHeight: 19, color: COLORS.paperFaint, marginTop: 6 },
  track: { height: 6, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', marginTop: 12, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 100, backgroundColor: COLORS.accent },
  btn: { height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  btnHot: { backgroundColor: COLORS.accent },
  btnQuiet: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  btnText: { fontFamily: FONT.condensed700, fontSize: 13, letterSpacing: 1.8 },
});
