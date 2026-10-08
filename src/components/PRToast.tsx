import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT } from '../theme';
import { Toast } from '../types';

export function PRToast({ toast }: { toast: Toast }) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.badge}>NEW PR</Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>
          {toast.name}
        </Text>
        <Text style={styles.line} numberOfLines={1}>
          {toast.line}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 6,
    zIndex: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  badge: {
    fontFamily: FONT.condensed800,
    fontSize: 10,
    letterSpacing: 1.8,
    color: COLORS.accent,
    backgroundColor: COLORS.accentInk,
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  name: { fontFamily: FONT.body500, fontSize: 14, color: COLORS.accentInk },
  line: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1, color: 'rgba(4,19,28,0.7)', marginTop: 4 },
});
