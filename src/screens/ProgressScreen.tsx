import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { BodyLegend, BodyMap } from '../components/BodyMap';
import { DAYS } from '../data';
import {
  CHART_H,
  CHART_W,
  bodyView,
  countDone,
  holdStats,
  kgChart,
  kgKeys,
  setsTotal,
  substitutions,
  volBars,
} from '../logic';
import { useStore } from '../store';
import { COLORS, FONT } from '../theme';

export function ProgressScreen() {
  const { state, actions } = useStore();
  const bars = volBars(state);
  const keys = kgKeys(state);
  const sel = keys.indexOf(state.chartEx || '') !== -1 ? (state.chartEx as string) : keys[0];
  const chart = sel ? kgChart(state, sel) : null;
  const subs = substitutions(state);
  const holds = holdStats(state);
  const body = bodyView(state);
  const is1rm = state.chartMode === '1rm';

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingTop: 20, paddingBottom: 30, gap: 12 }}>
      <Text style={styles.h1}>Progress</Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat label="DAY STREAK" value={String(state.streak)} />
        <Stat label="SETS THIS CYCLE" value={String(setsTotal(state))} />
      </View>

      <Card label="VOLUME PER SESSION · KG × REPS">
        {bars.length > 0 ? (
          <>
            <View style={styles.barRow}>
              {bars.map((b, i) => (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barVal}>{b.val}</Text>
                  <View
                    style={{
                      width: '100%',
                      height: `${Math.round(b.frac * 100)}%`,
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6,
                      borderBottomLeftRadius: 2,
                      borderBottomRightRadius: 2,
                      backgroundColor: b.current ? COLORS.paper : 'rgba(242,244,247,0.28)',
                    }}
                  />
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 7 }}>
              {bars.map((b, i) => (
                <Text key={i} style={styles.barLabel}>
                  {b.label}
                </Text>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.empty}>Finish a day to start the chart.</Text>
        )}
      </Card>

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text style={styles.cardLabel}>WEIGHT TREND</Text>
          <View style={styles.toggle}>
            <Pressable
              onPress={() => actions.setChartMode('kg')}
              style={[styles.toggleBtn, { backgroundColor: is1rm ? 'transparent' : COLORS.paper }]}
            >
              <Text style={[styles.toggleText, { color: is1rm ? COLORS.paperDim : COLORS.ink }]}>TOP SET</Text>
            </Pressable>
            <Pressable
              onPress={() => actions.setChartMode('1rm')}
              style={[styles.toggleBtn, { backgroundColor: is1rm ? COLORS.paper : 'transparent' }]}
            >
              <Text style={[styles.toggleText, { color: is1rm ? COLORS.ink : COLORS.paperDim }]}>EST. 1RM</Text>
            </Pressable>
          </View>
        </View>

        {keys.length === 0 ? (
          <Text style={styles.empty}>Each exercise gets a line once you finish a day with its weight logged.</Text>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', gap: 6, paddingBottom: 2 }}>
                {keys.map((k) => {
                  const on = k === sel;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => actions.setChartEx(k)}
                      style={[
                        styles.chip,
                        { backgroundColor: on ? COLORS.paper : 'transparent', borderColor: on ? COLORS.paper : COLORS.hairlineStrong },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: on ? COLORS.ink : COLORS.paperDim }]}>
                        {state.kgHist[k].n}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {!chart ? (
              <Text style={styles.empty}>1RM estimates start from your next finished session with reps logged.</Text>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 16 }}>
                  <Text style={styles.kgLast}>{chart.last}</Text>
                  <Text
                    style={[
                      styles.kgDelta,
                      { color: chart.rising > 0 ? COLORS.up : chart.rising < 0 ? COLORS.down : 'rgba(242,244,247,0.5)' },
                    ]}
                  >
                    {chart.delta}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.kgSessions}>{chart.sessions}</Text>
                </View>
                <View style={styles.chartBox}>
                  <Svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height={110}>
                    <Line x1={0} y1={12} x2={CHART_W} y2={12} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 4" />
                    <Line x1={0} y1={88} x2={CHART_W} y2={88} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 4" />
                    <Polyline
                      points={chart.xy.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}
                      fill="none"
                      stroke={COLORS.accent}
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {chart.xy.map((p, i) => (
                      <Circle key={i} cx={p[0]} cy={p[1]} r={i === chart.xy.length - 1 ? 4 : 2.5} fill={COLORS.accent} />
                    ))}
                  </Svg>
                  <Text style={styles.axisTop}>{chart.max}</Text>
                  <Text style={styles.axisBottom}>{chart.min}</Text>
                </View>
              </>
            )}
          </>
        )}
      </View>

      <Card label="MUSCLES · LAST 7 DAYS">
        <BodyMap front={body.front} back={body.back} />
        <BodyLegend />
        <View style={{ gap: 8, marginTop: 16 }}>
          {body.top.map((m) => (
            <View key={m.name} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.topName}>{m.name}</Text>
              <Text style={styles.topValue}>{m.value}</Text>
            </View>
          ))}
        </View>
        {body.missing.length > 0 && (
          <View style={styles.missBox}>
            <Text style={styles.missLabel}>NOT TRAINED THIS WEEK</Text>
            <Text style={styles.missList}>{body.missing.join(' · ').toUpperCase()}</Text>
          </View>
        )}
      </Card>

      <Card label="CYCLE COMPLETION">
        <View style={{ flexDirection: 'row', gap: 5, marginTop: 12 }}>
          {DAYS.map((d, i) => {
            const n = i + 1;
            const c = countDone(state, n);
            const full = c === d.exs.length;
            const cur = n === state.day;
            return (
              <View key={n} style={{ flex: 1, alignItems: 'center', gap: 7 }}>
                <View
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 9,
                    borderWidth: 1,
                    borderColor: cur ? 'rgba(255,255,255,0.2)' : COLORS.borderSoft,
                    backgroundColor: full ? COLORS.paper : c ? 'rgba(255,255,255,0.14)' : COLORS.fillSoft,
                  }}
                />
                <Text style={styles.cycleNum}>{n}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Card label="SKILL LADDERS">
        <View style={{ gap: 16, marginTop: 14 }}>
          {holds.map((h) => (
            <View key={h.name}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <Text style={styles.holdName}>{h.name}</Text>
                <Text style={styles.holdBest}>{h.best}</Text>
              </View>
              <View style={styles.holdTrack}>
                <View style={[styles.holdFill, { width: `${Math.round(h.frac * 100)}%` }]} />
              </View>
              <Text style={styles.holdGoal}>{h.goal}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card label="SUBSTITUTIONS THIS CYCLE">
        <View style={{ gap: 10, marginTop: 14 }}>
          {subs.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={styles.subDay}>D{s.day}</Text>
              <Text style={styles.subLine}>{s.line}</Text>
              <Text style={[styles.subDelta, { color: s.better ? COLORS.paperDim : 'rgba(242,244,247,0.35)' }]}>
                {s.delta}
              </Text>
            </View>
          ))}
          {subs.length === 0 && (
            <Text style={styles.empty}>None yet. Swap an exercise when a machine is taken and it shows up here.</Text>
          )}
        </View>
      </Card>

      <View style={styles.card}>
        <Text style={styles.privacyText}>
          Everything is stored on this device only. Save a backup file now and then so reinstalling does not wipe your
          history.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <Pressable onPress={actions.exportBackup} style={styles.backupBtn}>
            <Text style={styles.backupBtnText}>SAVE BACKUP</Text>
          </Pressable>
          <Pressable onPress={actions.restoreBackup} style={styles.restoreBtn}>
            <Text style={styles.restoreBtnText}>RESTORE</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.card, { flex: 1 }]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: FONT.condensed800, fontSize: 40, lineHeight: 36, color: COLORS.paper, marginBottom: 6 },
  card: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.hairline, borderRadius: 18, padding: 16 },
  cardLabel: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.8, color: COLORS.paperFaint },
  statValue: { fontFamily: FONT.condensed800, fontSize: 40, lineHeight: 36, color: COLORS.paper, marginTop: 10 },
  barRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 120, marginTop: 14 },
  barCol: { flex: 1, minWidth: 0, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 6 },
  barVal: { fontFamily: FONT.condensed700, fontSize: 11, color: COLORS.paperDim },
  barLabel: { flex: 1, textAlign: 'center', fontFamily: FONT.condensed700, fontSize: 11, color: COLORS.paperFaint },
  empty: { fontFamily: FONT.body400, fontSize: 14, lineHeight: 21, color: COLORS.paperFaint, marginTop: 10 },
  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.hairlineStrong, borderRadius: 100, overflow: 'hidden' },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  toggleText: { fontFamily: FONT.condensed700, fontSize: 10, letterSpacing: 1 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: 100, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: FONT.body500, fontSize: 13 },
  kgLast: { fontFamily: FONT.condensed800, fontSize: 34, lineHeight: 31, color: COLORS.paper },
  kgDelta: { fontFamily: FONT.condensed700, fontSize: 15 },
  kgSessions: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.8, color: COLORS.paperFaint },
  chartBox: { position: 'relative', marginTop: 12, borderRadius: 12, backgroundColor: COLORS.inner, paddingVertical: 10, paddingHorizontal: 8 },
  axisTop: { position: 'absolute', right: 10, top: 6, fontFamily: FONT.condensed700, fontSize: 10, color: COLORS.paperFaint },
  axisBottom: { position: 'absolute', right: 10, bottom: 6, fontFamily: FONT.condensed700, fontSize: 10, color: COLORS.paperFaint },
  topName: { fontFamily: FONT.condensed700, fontSize: 12, letterSpacing: 1.1, color: COLORS.paper },
  topValue: { fontFamily: FONT.condensed700, fontSize: 12, letterSpacing: 1.1, color: COLORS.paperDim },
  missBox: { marginTop: 14, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, backgroundColor: COLORS.inner },
  missLabel: { fontFamily: FONT.condensed700, fontSize: 10, letterSpacing: 1.4, color: COLORS.warn },
  missList: { fontFamily: FONT.condensed600, fontSize: 12, lineHeight: 18, letterSpacing: 0.7, color: COLORS.paperDim, marginTop: 6 },
  cycleNum: { fontFamily: FONT.condensed700, fontSize: 12, color: COLORS.paperDim },
  holdName: { fontFamily: FONT.body500, fontSize: 16, color: COLORS.paper },
  holdBest: { fontFamily: FONT.condensed800, fontSize: 22, color: COLORS.accent },
  holdTrack: { height: 6, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', marginTop: 9, overflow: 'hidden' },
  holdFill: { height: '100%', borderRadius: 100, backgroundColor: COLORS.accent },
  holdGoal: { fontFamily: FONT.condensed700, fontSize: 11, lineHeight: 14, letterSpacing: 0.9, color: COLORS.paperFaint, marginTop: 7 },
  subDay: { width: 30, fontFamily: FONT.condensed700, fontSize: 12, color: COLORS.paperFaint },
  subLine: { flex: 1, fontFamily: FONT.body400, fontSize: 14, lineHeight: 20, color: COLORS.paperDim },
  subDelta: { fontFamily: FONT.condensed700, fontSize: 14 },
  privacyText: { fontFamily: FONT.body400, fontSize: 14, lineHeight: 21, color: COLORS.paperDim },
  backupBtn: { flex: 1, height: 46, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  backupBtnText: { fontFamily: FONT.condensed700, fontSize: 13, letterSpacing: 1.8, color: COLORS.accentInk },
  restoreBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  restoreBtnText: { fontFamily: FONT.condensed700, fontSize: 13, letterSpacing: 1.8, color: COLORS.paper },
});
