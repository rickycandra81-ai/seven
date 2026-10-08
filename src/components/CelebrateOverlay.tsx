import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DAYS } from '../data';
import { COLORS, FONT } from '../theme';

export function CelebrateOverlay({
  day,
  total,
  onDismiss,
}: {
  day: number;
  total: number;
  onDismiss: () => void;
}) {
  const nextDay = (day % 7) + 1;
  return (
    <Pressable onPress={onDismiss} style={styles.wrap}>
      <View style={styles.disc} />
      <Text style={styles.big}>{`DAY ${day}\nLOGGED`}</Text>
      <Text style={styles.focus}>{`${DAYS[day - 1].focus} · ${total} OF ${total}`}</Text>
      <Text style={styles.note}>
        {`Every item ticked, holds included. Day ${nextDay} is ${DAYS[nextDay - 1].focus.toLowerCase()}.`}
      </Text>
      <Text style={styles.hint}>TAP ANYWHERE TO CONTINUE</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,13,16,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    zIndex: 80,
  },
  disc: { width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.accent },
  big: { fontFamily: FONT.condensed800, fontSize: 52, lineHeight: 47, color: COLORS.paper, marginTop: 30, textAlign: 'center' },
  focus: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 2.4, color: COLORS.paperDim, marginTop: 16 },
  note: { fontFamily: FONT.body400, fontSize: 14, lineHeight: 21, color: COLORS.paperFaint, marginTop: 26, textAlign: 'center', maxWidth: 230 },
  hint: { fontFamily: FONT.condensed600, fontSize: 9, letterSpacing: 1.8, color: COLORS.paperFaint, marginTop: 46 },
});
