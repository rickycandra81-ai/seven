import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { pace } from '../logic';
import { restDone, restRemaining, useStore } from '../store';
import { COLORS, FONT, fmtTime } from '../theme';

export function Header({ onReset }: { onReset: () => void }) {
  const { state, actions } = useStore();
  const resting = !!state.restId;
  const done = resting && restDone(state);
  const sess = pace(state, state.day);
  const paceColor = sess.state === 'over' ? COLORS.danger : sess.state === 'behind' ? COLORS.warn : COLORS.paperDim;

  return (
    <View style={styles.row}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <View style={styles.brand}>
          <View style={styles.dot} />
          <Text style={styles.title}>SEVEN</Text>
        </View>
        {sess.show && (
          <View style={styles.sessChip}>
            <Text style={styles.sessClock}>{sess.clock}</Text>
            <Text style={[styles.sessShort, { color: paceColor }]}>{sess.short}</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {resting && (
          <Pressable
            onPress={actions.jumpToRest}
            style={[
              styles.restPill,
              {
                backgroundColor: done ? 'rgba(255,70,70,0.18)' : COLORS.fillMed,
                borderColor: done ? 'rgba(255,70,70,0.6)' : COLORS.hairlineStrong,
              },
            ]}
          >
            <Text style={[styles.restLabel, { color: done ? COLORS.danger : COLORS.paperDim }]}>
              {state.restBetween ? 'NEXT' : 'REST'}
            </Text>
            <Text style={[styles.restValue, { color: done ? COLORS.danger : COLORS.paperDim }]}>
              {done ? 'GO' : fmtTime(restRemaining(state))}
            </Text>
          </Pressable>
        )}
        <Pressable onPress={onReset} style={styles.resetBtn}>
          <Text style={styles.resetLabel}>RESET</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 18, paddingTop: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 10, height: 10, borderRadius: 3, backgroundColor: COLORS.accent },
  title: { fontFamily: FONT.condensed800, fontSize: 17, letterSpacing: 3.4, color: COLORS.paper },
  sessChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 100,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  sessClock: { fontFamily: FONT.condensed700, fontSize: 13, color: COLORS.paper },
  sessShort: { fontFamily: FONT.condensed700, fontSize: 10, letterSpacing: 1 },
  restPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1 },
  restLabel: { fontFamily: FONT.condensed700, fontSize: 10, letterSpacing: 1 },
  restValue: { fontFamily: FONT.condensed700, fontSize: 13 },
  resetBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  resetLabel: { fontFamily: FONT.condensed700, fontSize: 10, letterSpacing: 1.4, color: COLORS.paperFaint },
});
