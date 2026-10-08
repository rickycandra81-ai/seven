import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DAYS } from '../data';
import { countDone } from '../logic';
import { COLORS, FONT } from '../theme';
import { AppState } from '../types';

export function DayPips({
  state,
  currentDay,
  onPick,
}: {
  state: AppState;
  currentDay: number;
  onPick: (day: number) => void;
}) {
  return (
    <View style={styles.row}>
      {DAYS.map((d, i) => {
        const n = i + 1;
        const cur = n === currentDay;
        const full = countDone(state, n) === d.exs.length;
        return (
          <Pressable
            key={n}
            onPress={() => onPick(n)}
            style={[
              styles.pip,
              {
                backgroundColor: cur ? COLORS.accent : full ? 'rgba(56,189,248,0.14)' : COLORS.card,
                borderColor: cur ? COLORS.accent : full ? 'rgba(56,189,248,0.35)' : COLORS.hairline,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: cur ? COLORS.accentInk : full ? COLORS.accent : 'rgba(242,244,247,0.55)' },
              ]}
            >
              {n}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5 },
  pip: { flex: 1, height: 40, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: FONT.condensed700, fontSize: 16 },
});
