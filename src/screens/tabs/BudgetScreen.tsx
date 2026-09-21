import React, { useCallback, useMemo, useState } from "react";
import { View, Pressable, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, fmt } from "../../theme";
import { Text } from "../../ui/Text";
import { TabBar } from "../../components/TabBar";
import { BudgetRow } from "../../components/BudgetRow";
import { Piso } from "../../components/Piso";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { useBills } from "../../hooks/useBills";
import { useRisk } from "../../hooks/useRisk";
import { useTabNav } from "../../navigation/useTabNav";
import { Half, halfOf, rangeText, sortByPriority, sumBills } from "../../utils/billInsights";
import { amountLabel } from "../../api/bills";
import { formatShort, monthYear, toISO } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Budget">;
type Filter = "all" | "Non-deferrable" | "Deferrable";

// Plain words on the tabs; the row details still show your flow's terms (Non-deferrable / Deferrable).
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All bills" },
  { key: "Non-deferrable", label: "Must pay" },
  { key: "Deferrable", label: "Can wait" },
];

const HALVES: { key: Half | null; label: string }[] = [
  { key: null, label: "Whole month" },
  { key: "1st Half", label: "1st – 15th" },
  { key: "2nd Half", label: "16th – 30th" },
];

const SEGMENT_COLORS = ["#1F6FFF", "#5B9BFF", "#B9D6FF", "#DCEBFF"];

export default function BudgetScreen(_props: Props) {
  const goTab = useTabNav();
  const { bills, loading, error, refresh: refreshBills } = useBills();
  const { risk, refresh: refreshRisk } = useRisk();
  const [filter, setFilter] = useState<Filter>("all");
  const [half, setHalf] = useState<Half | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshBills();
      refreshRisk();
    }, [refreshBills, refreshRisk])
  );

  const refreshAll = useCallback(() => {
    refreshBills();
    refreshRisk();
  }, [refreshBills, refreshRisk]);

  // rank is fixed by priority across ALL bills, so it doesn't change when filtering
  const ranked = useMemo(() => sortByPriority(bills).map((bill, i) => ({ bill, rank: i + 1 })), [bills]);
  const visible = ranked.filter(
    ({ bill }) => (filter === "all" || bill.classification === filter) && (!half || halfOf(bill) === half)
  );

  // "Where it goes": the biggest categories, the rest grouped as Other
  const goes = useMemo(() => {
    const totals = new Map<string, number>();
    for (const b of bills) totals.set(b.categoryDesc, (totals.get(b.categoryDesc) ?? 0) + b.amountMax);
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const rest = sorted.slice(3).reduce((sum, [, v]) => sum + v, 0);
    const parts: [string, number][] = rest > 0 ? [...sorted.slice(0, 3), ["Other", rest]] : sorted.slice(0, 3);
    const total = parts.reduce((sum, [, v]) => sum + v, 0);
    return parts.map(([name, value], i) => ({
      name,
      value,
      pct: total ? Math.round((value / total) * 100) : 0,
      color: SEGMENT_COLORS[i],
    }));
  }, [bills]);

  const totals = sumBills(bills);
  const remaining = risk ? Number(risk.remaining_budget_min) : null;
  const periodISO = risk?.next_payday ?? bills.find((b) => b.dueDate)?.dueDate ?? toISO(new Date());

  const showDeferral = !!risk && risk.label !== "STABLE";
  const deferrable = ranked.filter(({ bill }) => bill.classification === "Deferrable").reverse(); // lowest priority first
  const freed = sumBills(deferrable.map((d) => d.bill));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} />}
      >
        <View style={styles.top}>
          <Text style={styles.title}>Budget</Text>
          <View style={styles.monthChip}>
            <Text style={styles.monthText}>{monthYear(periodISO)}</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* where the money goes */}
        {goes.length > 0 ? (
          <View style={[styles.card, sh.sm]}>
            <Text style={styles.cardTitle}>Where it goes</Text>
            <View style={styles.bar}>
              {goes.map((g) => (
                <View key={g.name} style={{ flex: Math.max(g.value, 1), backgroundColor: g.color }} />
              ))}
            </View>
            <View style={styles.legend}>
              {goes.map((g) => (
                <View key={g.name} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: g.color }]} />
                  <Text style={styles.legendText} numberOfLines={1}>{g.name} {g.pct}%</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* income period split */}
        <View style={styles.segment}>
          {HALVES.map((h) => {
            const list = h.key ? bills.filter((b) => halfOf(b) === h.key) : bills;
            const t = sumBills(list);
            const on = half === h.key;
            return (
              <Pressable key={h.label} onPress={() => setHalf(h.key)} style={[styles.segBtn, on && styles.segBtnOn]}>
                <Text style={[styles.segLabel, on && { color: "#FFF" }]}>{h.label}</Text>
                <Text style={[styles.segAmount, on && { color: "#D3E4FF" }]}>{t.count ? fmt(t.max) : "—"}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* filter */}
        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.filterChip, on && styles.filterChipOn]}>
                <Text style={[styles.filterText, on && { color: "#FFF" }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* deferral suggestion (only when at risk / critical) */}
        {showDeferral ? (
          <View style={styles.deferCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Piso size={40} mood="worried" />
              <Text style={styles.deferTitle}>
                {deferrable.length > 0 ? "Your budget is tight. These can wait:" : "Your budget is tight, and no bill can wait."}
              </Text>
            </View>
            {deferrable.map(({ bill }) => (
              <View key={bill.id} style={styles.deferRow}>
                <Text style={styles.deferName} numberOfLines={1}>{bill.name}</Text>
                <Text style={styles.deferDue}>{formatShort(bill.dueDate)}</Text>
                <Text style={styles.deferAmount}>{amountLabel(bill)}</Text>
              </View>
            ))}
            {deferrable.length > 0 ? (
              <Text style={styles.deferFreed}>Moving them could free up {rangeText(freed.min, freed.max)}.</Text>
            ) : (
              <Text style={styles.deferFreed}>Try lowering your daily food or transport costs.</Text>
            )}
          </View>
        ) : null}

        {/* bills */}
        <View style={{ gap: 10 }}>
          {visible.map(({ bill, rank }) => (
            <BudgetRow key={bill.id} bill={bill} rank={rank} />
          ))}
          {visible.length === 0 && !loading ? (
            <View style={styles.empty}>
              <Piso size={64} mood="happy" />
              <Text style={styles.emptyTitle}>{bills.length === 0 ? "No bills yet" : "No bills match this filter"}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.summaryWrap}>
        <View style={styles.summary}>
          <View>
            <Text style={styles.sumLabel}>Bills, up to</Text>
            <Text style={styles.sumValue}>{bills.length ? fmt(totals.max) : "—"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.sumLabel}>Left, at least</Text>
            <Text style={[styles.sumValue, remaining != null && remaining < 0 && { color: "#FFD3DA" }]}>
              {remaining == null ? "—" : fmt(remaining)}
            </Text>
          </View>
        </View>
      </View>

      <TabBar active="budget" onChange={goTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, gap: 14 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "800", color: C.text },
  monthChip: { backgroundColor: C.primaryLt, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
  monthText: { fontSize: 12, fontWeight: "600", color: C.primary },
  errorText: { color: C.red, fontSize: 12 },
  card: { backgroundColor: C.surface, borderRadius: 24, padding: 16 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 12 },
  bar: { flexDirection: "row", height: 16, borderRadius: 8, overflow: "hidden", gap: 2 },
  legend: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 6, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "100%" },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 12, color: C.sub, flexShrink: 1 },
  segment: { flexDirection: "row", backgroundColor: C.primaryLt, borderRadius: 20, padding: 4, gap: 4 },
  segBtn: { flex: 1, borderRadius: 16, paddingVertical: 8, alignItems: "center" },
  segBtnOn: { backgroundColor: C.primary },
  segLabel: { fontSize: 12, fontWeight: "600", color: C.sub },
  segAmount: { fontSize: 12, color: C.muted, marginTop: 1 },
  filters: { flexDirection: "row", gap: 8 },
  filterChip: { backgroundColor: C.surface, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1.5, borderColor: "#D3E1FA" },
  filterChipOn: { backgroundColor: C.text, borderColor: C.text },
  filterText: { fontSize: 12, fontWeight: "600", color: C.sub },
  deferCard: { backgroundColor: C.amberBg, borderRadius: 24, padding: 14, gap: 8 },
  deferTitle: { flex: 1, fontSize: 13, fontWeight: "600", color: "#7A3606", lineHeight: 19 },
  deferRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  deferName: { flex: 1, fontSize: 13, fontWeight: "600", color: C.text },
  deferDue: { fontSize: 11, color: C.muted },
  deferAmount: { fontSize: 13, fontWeight: "700", color: C.text },
  deferFreed: { fontSize: 12, fontWeight: "600", color: "#7A3606" },
  empty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: "600", color: C.sub },
  summaryWrap: { paddingHorizontal: 16, paddingTop: 4, backgroundColor: C.bg },
  summary: { backgroundColor: C.text, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between" },
  sumLabel: { fontSize: 11, color: "#A9C0EE" },
  sumValue: { fontSize: 20, fontWeight: "800", color: "#FFF", marginTop: 1 },
});
