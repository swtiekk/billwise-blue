import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AlertTriangle, FileText } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, fmt } from "../../theme";
import { TabBar } from "../../components/TabBar";
import { BillDetailCard } from "../../components/BillDetailCard";
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

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Non-deferrable", label: "Non-deferrable" },
  { key: "Deferrable", label: "Deferrable" },
];

const HALVES: { key: Half; label: string }[] = [
  { key: "1st Half", label: "1st – 15th" },
  { key: "2nd Half", label: "16th – 30th" },
];

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

  const totals = sumBills(bills);
  const remainingMin = risk ? Number(risk.remaining_budget_min) : null;
  const periodISO = risk?.next_payday ?? bills.find((b) => b.dueDate)?.dueDate ?? toISO(new Date());

  const showDeferral = !!risk && risk.label !== "STABLE";
  const deferrable = ranked.filter(({ bill }) => bill.classification === "Deferrable").reverse(); // lowest priority first
  const freed = sumBills(deferrable.map((d) => d.bill));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bill Priority Breakdown</Text>
        <View style={styles.periodChip}>
          <Text style={styles.periodText}>{monthYear(periodISO)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} />}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Filter tabs */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterChip, on ? { backgroundColor: C.primary } : { backgroundColor: "#F1F5F9" }, on && sh.btn]}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: on ? "#FFF" : C.sub }}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Income period split: tap a column to show only that half */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          {HALVES.map((h) => {
            const list = bills.filter((b) => halfOf(b) === h.key);
            const t = sumBills(list);
            const on = half === h.key;
            return (
              <Pressable
                key={h.key}
                onPress={() => setHalf(on ? null : h.key)}
                style={[styles.splitCard, sh.sm, on && styles.splitCardOn]}
              >
                <Text style={styles.splitLabel}>{h.label.toUpperCase()}</Text>
                <Text style={styles.splitValue}>{t.count === 0 ? "—" : rangeText(t.min, t.max)}</Text>
                <Text style={styles.splitSub}>{t.count} bill{t.count === 1 ? "" : "s"}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Deferrable bills suggestion (only when At Risk / Critical) */}
        {showDeferral ? (
          <View style={styles.deferCard}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <AlertTriangle size={18} color={C.amber} strokeWidth={2} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.deferTitle}>Deferrable Bills Suggestion</Text>
                <Text style={styles.deferBody}>
                  {deferrable.length > 0
                    ? "Your budget is tight. These bills can be postponed to free up cash:"
                    : "Your budget is tight and none of your bills can be deferred. Consider reducing daily expenses."}
                </Text>
              </View>
            </View>
            {deferrable.map(({ bill }) => (
              <View key={bill.id} style={styles.deferRow}>
                <Text style={styles.deferName} numberOfLines={1}>{bill.name}</Text>
                <Text style={styles.deferAmount}>{amountLabel(bill)}</Text>
                <Text style={styles.deferDue}>{formatShort(bill.dueDate)}</Text>
              </View>
            ))}
            {deferrable.length > 0 ? (
              <Text style={styles.deferFreed}>Could free up {rangeText(freed.min, freed.max)}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Full bill list */}
        <View style={{ gap: 10 }}>
          {visible.map(({ bill, rank }) => (
            <BillDetailCard key={bill.id} bill={bill} rank={rank} />
          ))}
          {visible.length === 0 && !loading ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <FileText size={36} color="#CBD5E1" strokeWidth={1.25} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.muted, marginTop: 8 }}>
                {bills.length === 0 ? "No bills yet" : "No bills match this filter"}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, sh.md]}>
        <View>
          <Text style={styles.barLabel}>Total Allocated</Text>
          <Text style={styles.barValue}>{bills.length ? fmt(totals.max) : "—"}</Text>
          <Text style={styles.barSub}>up to</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.barLabel}>Estimated Remaining</Text>
          <Text style={[styles.barValue, remainingMin != null && remainingMin < 0 && { color: C.red }]}>
            {remainingMin == null ? "—" : fmt(remainingMin)}
          </Text>
          <Text style={styles.barSub}>at least</Text>
        </View>
      </View>

      <TabBar active="budget" onChange={goTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: C.surface, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 20, fontWeight: "700", color: C.text },
  periodChip: { alignSelf: "flex-start", backgroundColor: C.primaryLt, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  periodText: { fontSize: 11, fontWeight: "600", color: C.primary },
  errorText: { color: C.red, fontSize: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99 },
  splitCard: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: "transparent" },
  splitCardOn: { borderColor: C.primary, backgroundColor: C.primaryLt },
  splitLabel: { fontSize: 10, fontWeight: "600", color: C.muted, letterSpacing: 0.5 },
  splitValue: { fontSize: 14, fontWeight: "700", color: C.text, marginTop: 4 },
  splitSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  deferCard: { backgroundColor: C.amberBg, borderColor: "#FDE68A", borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  deferTitle: { fontSize: 13, fontWeight: "700", color: C.amber },
  deferBody: { fontSize: 11, color: C.sub, marginTop: 2, lineHeight: 16 },
  deferRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  deferName: { flex: 1, fontSize: 12, fontWeight: "600", color: C.text },
  deferAmount: { fontSize: 12, fontWeight: "700", color: C.text },
  deferDue: { fontSize: 10, color: C.muted, width: 44, textAlign: "right" },
  deferFreed: { fontSize: 12, fontWeight: "700", color: C.amber },
  bottomBar: { backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 20, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between" },
  barLabel: { fontSize: 11, color: C.muted, fontWeight: "500" },
  barValue: { fontSize: 16, fontWeight: "700", color: C.text, marginTop: 1 },
  barSub: { fontSize: 10, color: C.muted },
});
