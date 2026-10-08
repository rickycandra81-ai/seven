import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT } from '../theme';

const LONG_PRESS_MS = 2000;

// While a logged set is being held down: says what will happen, and how to back
// out. The bar fills over the same 2s the press needs.
export function PressBanner({ label }: { label: string }) {
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fill.setValue(0);
    Animated.timing(fill, { toValue: 1, duration: LONG_PRESS_MS, useNativeDriver: false }).start();
  }, [label, fill]);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>RELEASE TO CANCEL</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 6,
    zIndex: 60,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.inner,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.5)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 14, paddingHorizontal: 16 },
  label: { fontFamily: FONT.condensed700, fontSize: 15, letterSpacing: 1.8, color: COLORS.paper },
  hint: { fontFamily: FONT.condensed700, fontSize: 12, letterSpacing: 1.4, color: COLORS.paperDim },
  track: { height: 5, backgroundColor: COLORS.borderSoft },
  fill: { height: '100%', backgroundColor: '#F87171' },
});
