import React from "react";
import { View, StyleSheet } from "react-native";
import { C, fmt } from "../theme";
import { Text } from "../ui/Text";
import { STATUS } from "../utils/statusStyle";
import { formatShort } from "../utils/dates";
import type { RiskAssessment, RiskLabel } from "../api/types";

/** Solid color for the status pill and the filled part of the runway bar. */
const SOLID: Record<RiskLabel, string> = { STABLE: C.green, "AT RISK": C.amber, CRITICAL: C.red };

const SENTENCE: Record<RiskLabel, string> = {
  STABLE: "You're okay until payday.",
  "AT RISK": "Money may get tight before payday.",
  CRITICAL: "You may run short before payday.",
};

const money = (n: number) => (n < 0 ? `-${fmt(-n)}` : fmt(n));

/**
 * How many of the days until payday the money left after bills can cover.
 * Uses the same numbers as the risk label (remaining budget vs the lowest daily cost), so the bar and the label always agree.
 */
export function runway(risk: RiskAssessment): { total: number; covered: number } {
  const total = Math.max(0, risk.days_until_next_payday);
  const remaining = Number(risk.remaining_budget_min);
  const daily = Number(risk.total_daily_expense_min);
  if (total === 0 || daily <= 0) return { total, covered: total };
  return { total, covered: Math.max(0, Math.min(total, Math.floor(remaining / daily))) };
}

/** The Home headline: one color, one sentence, one bar. The numbers behind it sit underneath. */
export function RiskHero({ risk }: { risk: RiskAssessment | null }) {
  if (!risk) {
    return (
      <View style={[styles.hero, { backgroundColor: C.primaryLt }]}>
        <Text style={[styles.sentence, { color: C.muted }]}>Checking your budget…</Text>
      </View>
    );
  }

  const label = risk.label;
  const s = STATUS[label];
  const solid = SOLID[label];
  const { total, covered } = runway(risk);
  const remMin = Number(risk.remaining_budget_min);
  const remMax = Number(risk.remaining_budget_max);
  const perDay = total > 0 ? Math.max(0, Math.floor(remMin / total)) : null;

  const sub =
    label === "STABLE"
      ? total === 0
        ? "Payday is today."
        : `Your money lasts all ${total} days.`
      : `Lasts about ${covered} of ${total} days.`;

  return (
    <View style={[styles.hero, { backgroundColor: s.bg }]}>
      <View style={styles.topRow}>
        <View style={[styles.pill, { backgroundColor: solid }]}>
          <Text style={styles.pillText}>{s.label}</Text>
        </View>
        <Text style={[styles.small, { color: s.fg }]}>
          {total === 0 ? "Payday today" : `Payday in ${total} day${total === 1 ? "" : "s"}`}
        </Text>
      </View>

      <Text style={[styles.sentence, { color: s.fg }]}>{SENTENCE[label]}</Text>
      <Text style={[styles.sub, { color: s.fg }]}>{sub}</Text>

      <View style={[styles.track, { backgroundColor: `${s.fg}2E` }]}>
        <View style={[styles.fill, { backgroundColor: solid, width: `${total === 0 ? 100 : Math.round((covered / total) * 100)}%` }]} />
      </View>
      <View style={styles.topRow}>
        <Text style={[styles.small, { color: s.fg }]}>Today</Text>
        <Text style={[styles.small, { color: s.fg }]}>Payday{risk.next_payday ? `, ${formatShort(risk.next_payday)}` : ""}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Left after bills</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {Math.abs(remMax - remMin) > 0.5 ? `${money(remMin)} – ${money(remMax)}` : money(remMin)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Available per day</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {perDay == null ? "—" : `about ${fmt(perDay)}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 28, padding: 18 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
  pillText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  small: { fontSize: 12 },
  sentence: { fontSize: 21, fontWeight: "800", marginTop: 12, lineHeight: 27 },
  sub: { fontSize: 14, marginTop: 4 },
  track: { height: 10, borderRadius: 99, marginTop: 14, marginBottom: 6, overflow: "hidden" },
  fill: { height: 10, borderRadius: 99 },
  stats: { flexDirection: "row", gap: 10, marginTop: 14 },
  stat: { flex: 1, backgroundColor: "#FFFFFFBF", borderRadius: 16, padding: 10 },
  statLabel: { fontSize: 11, color: C.muted },
  statValue: { fontSize: 15, fontWeight: "700", color: C.text, marginTop: 2 },
});
