import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { BodyPoly } from '../logic';
import { COLORS, FONT } from '../theme';

// volume bands: untouched, 1-3 sets, 4-8, 9+
const BAND = ['', 'rgba(56,189,248,0.3)', 'rgba(56,189,248,0.62)', COLORS.accent];

const fillOf = (level: BodyPoly['level']): string =>
  level === -1 ? COLORS.bodyScenery : level === 0 ? COLORS.bodyOff : BAND[level];

export function BodyMap({
  front,
  back,
  viewBoxFront = '-2 -2 104 204',
  viewBoxBack = '-2 -2 104 224',
}: {
  front: BodyPoly[];
  back: BodyPoly[];
  viewBoxFront?: string;
  viewBoxBack?: string;
}) {
  return (
    <View style={styles.row}>
      <Side label="FRONT" polys={front} viewBox={viewBoxFront} />
      <Side label="BACK" polys={back} viewBox={viewBoxBack} />
    </View>
  );
}

function Side({ label, polys, viewBox }: { label: string; polys: BodyPoly[]; viewBox: string }) {
  return (
    <View style={styles.side}>
      <Svg viewBox={viewBox} width="100%" height={200}>
        {polys.map((p, i) => (
          <Polygon key={i} points={p.pts} fill={fillOf(p.level)} stroke={COLORS.card} strokeWidth={0.6} strokeLinejoin="round" />
        ))}
      </Svg>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function BodyLegend() {
  const items: [string, string][] = [
    [COLORS.bodyOff, 'NONE'],
    [BAND[1], '1–3 SETS'],
    [BAND[2], '4–8'],
    [BAND[3], '9+'],
  ];
  return (
    <View style={styles.legend}>
      {items.map(([c, t]) => (
        <View key={t} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: c }]} />
          <Text style={styles.legendText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 16 },
  side: { flex: 1, minWidth: 0, alignItems: 'center', gap: 10 },
  label: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.8, color: COLORS.paperFaint },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: FONT.condensed700, fontSize: 10, letterSpacing: 1, color: COLORS.paperDim },
});
