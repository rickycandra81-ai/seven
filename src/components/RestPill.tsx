import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { COLORS, FONT } from '../theme';

export function RestPill({ kind, expired, label }: { kind: string; expired: boolean; label: string }) {
  // the canvas blinks the pill once the rest is over
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!expired) {
      blink.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.25, duration: 400, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [expired, blink]);

  return (
    <Animated.View
      style={[
        styles.pill,
        {
          opacity: expired ? blink : 1,
          backgroundColor: expired ? 'rgba(255,70,70,0.18)' : COLORS.fillSoft,
          borderColor: expired ? 'rgba(255,70,70,0.6)' : COLORS.hairlineStrong,
        },
      ]}
    >
      <Text style={[styles.kind, { color: expired ? COLORS.danger : COLORS.paperDim }]}>{kind}</Text>
      <Text style={[styles.value, { color: expired ? COLORS.danger : COLORS.paperDim }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 46, borderRadius: 13, borderWidth: 1 },
  kind: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.5 },
  value: { fontFamily: FONT.condensed700, fontSize: 22 },
});
