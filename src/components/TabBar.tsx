import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT } from '../theme';
import { Tab } from '../types';

// the canvas ships two tabs: a square mark for TODAY, a round one for PROGRESS
const TABS: { key: Tab; label: string; radius: number }[] = [
  { key: 'today', label: 'TODAY', radius: 2 },
  { key: 'progress', label: 'PROGRESS', radius: 6 },
];

export function TabBar({ tab, onPick }: { tab: Tab; onPick: (t: Tab) => void }) {
  return (
    <View style={styles.bar}>
      {TABS.map((t) => {
        const active = tab === t.key;
        return (
          <Pressable key={t.key} onPress={() => onPick(t.key)} style={styles.item}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: t.radius,
                backgroundColor: active ? COLORS.accent : 'rgba(242,244,247,0.3)',
              }}
            />
            <Text style={[styles.label, { color: active ? COLORS.accent : 'rgba(242,244,247,0.45)' }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
    backgroundColor: COLORS.ink,
  },
  item: { flex: 1, alignItems: 'center', gap: 7, paddingVertical: 9 },
  label: { fontFamily: FONT.condensed700, fontSize: 9, letterSpacing: 1.5 },
});
