import React, { useCallback, useMemo, useState } from "react";
import { View, Pressable, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { TabBar } from "../../components/TabBar";
import { PriorityBillRow } from "../../components/PriorityBillRow";
import { PRIORITY_STYLE } from "../../components/PriorityChip";
import { Piso } from "../../components/Piso";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { useBills } from "../../hooks/useBills";
import { useRisk } from "../../hooks/useRisk";
import { useTabNav } from "../../navigation/useTabNav";
import { rangeText, sumBills } from "../../utils/billInsights";
import { amountLabel, type BudgetBill } from "../../api/bills";
import { formatShort, monthYear, toISO } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Budget">;
type Period = "until" | "later" | "all";

const GROUPS = ["High", "Medium", "Low"] as const;

const byDue = (a: BudgetBill, b: BudgetBill) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");

export default function BudgetScreen({ navigation }: Props) {
  const open = (b: BudgetBill) => navigation.navigate("BillDetail", { id: b.id });
  const goTab = useTabNav();
  const { bills, loading, error, refresh: refreshBills } = useBills();
  const { risk, refresh: refreshRisk } = useRisk();
  const [period, setPeriod] = useState<Period>("until");

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

  const payday = risk?.next_payday ?? null;
  const monthly = useMemo(() => bills.filter((b) => !b.isDaily), [bills]);
  const daily = useMemo(() => bills.filter((b) => b.isDaily), [bills]);

  // "Until payday" = due on or before the next payday; "Later" = after it. Daily costs only show under All.
  const inPeriod = (b: BudgetBill) =>
    period === "all" || !payday || !b.dueDate ? true : period === "until" ? b.dueDate <= payday : b.dueDate > payday;
  const visible = monthly.filter(inPeriod);
  const unpaid = visible.filter((b) => b.status !== "paid" && !b.isDeferred);
  const movedList = visible.filter((b) => b.status !== "paid" && b.isDeferred);
  const paidList = visible.filter((b) => b.status === "paid");

  const stillToPay = sumBills(unpaid);

  // stacked bar: how the money still to pay splits across High / Medium / Low
  const split = GROUPS.map((g) => {
    const list = unpaid.filter((b) => (b.priority ?? "Low") === g);
    return { g, count: list.length, value: list.reduce((sum, b) => sum + b.amountMax, 0) };
  });

  const periodISO = payday ?? bills.find((b) => b.dueDate)?.dueDate ?? toISO(new Date());
  const PERIODS: { key: Period; label: string }[] = [
    { key: "until", label: payday ? `Until ${formatShort(payday)}` : "This period" },
    { key: "later", label: "Later" },
    { key: "all", label: "All" },
  ];

  const showDeferral = !!risk && risk.label !== "STABLE";
  const deferrable = monthly.filter((b) => b.classification === "Deferrable" && b.status !== "paid" && !b.isDeferred).sort((a, b) => byDue(b, a)); // latest due first
  const freed = sumBills(deferrable);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} />}
      >
        <View style={styles.top}>
          <Text style={styles.title}>Bills</Text>
          <View style={styles.monthChip}>
            <Text style={styles.monthText}>{monthYear(periodISO)}</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* payday period */}
        <View style={styles.periods}>
          {PERIODS.map((p) => {
            const on = period === p.key;
            return (
              <Pressable key={p.key} onPress={() => setPeriod(p.key)} style={[styles.periodChip, on && styles.periodChipOn]}>
                <Text style={[styles.periodText, on && { color: "#FFF" }]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* still to pay + how it splits by priority */}
        <View style={[styles.card, sh.sm]}>
          <Text style={styles.cardLabel}>Still to pay{period === "until" && payday ? ` before ${formatShort(payday)}` : ""}</Text>
          <Text style={styles.cardValue}>{unpaid.length ? rangeText(stillToPay.min, stillToPay.max) : "Nothing left"}</Text>
          {unpaid.length > 0 ? (
            <>
              <View style={styles.bar}>
                {split.filter((x) => x.value > 0).map((x) => (
                  <View key={x.g} style={{ flex: x.value, backgroundColor: PRIORITY_STYLE[x.g].bar }} />
                ))}
              </View>
              <View style={styles.legend}>
                {split.filter((x) => x.count > 0).map((x) => (
                  <View key={x.g} style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: PRIORITY_STYLE[x.g].bar }]} />
                    <Text style={styles.legendText}>{x.g} {x.count}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
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
            {deferrable.map((bill) => (
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

        {/* bills, grouped by priority */}
        {GROUPS.map((g) => {
          const list = unpaid.filter((b) => (b.priority ?? "Low") === g).sort(byDue);
          if (list.length === 0) return null;
          const st = PRIORITY_STYLE[g];
          return (
            <View key={g} style={{ gap: 10 }}>
              <Text style={[styles.groupTitle, { color: st.fg }]}>{st.group}</Text>
              {list.map((b) => (
                <PriorityBillRow key={b.id} bill={b} onPress={() => open(b)} />
              ))}
            </View>
          );
        })}

        {movedList.length > 0 ? (
          <View style={{ gap: 10 }}>
            <Text style={[styles.groupTitle, { color: C.sub }]}>Moved to next period</Text>
            {movedList.map((b) => (
              <PriorityBillRow key={b.id} bill={b} onPress={() => open(b)} />
            ))}
          </View>
        ) : null}

        {paidList.length > 0 ? (
          <View style={{ gap: 10 }}>
            <Text style={[styles.groupTitle, { color: C.muted }]}>Paid</Text>
            {paidList.map((b) => (
              <PriorityBillRow key={b.id} bill={b} onPress={() => open(b)} />
            ))}
          </View>
        ) : null}

        {period === "all" && daily.length > 0 ? (
          <View style={{ gap: 10 }}>
            <Text style={[styles.groupTitle, { color: C.muted }]}>Daily costs</Text>
            {daily.map((b) => (
              <PriorityBillRow key={b.id} bill={b} onPress={() => open(b)} />
            ))}
          </View>
        ) : null}

        {visible.length === 0 && movedList.length === 0 && !(period === "all" && daily.length > 0) && !loading ? (
          <View style={styles.empty}>
            <Piso size={64} mood="happy" />
            <Text style={styles.emptyTitle}>{bills.length === 0 ? "No bills yet. Tap + to add one." : "No bills in this period"}</Text>
          </View>
        ) : null}
      </ScrollView>

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
  cardLabel: { fontSize: 12, color: C.muted },
  cardValue: { fontSize: 22, fontWeight: "800", color: C.text, marginTop: 2, marginBottom: 12 },
  bar: { flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden", gap: 2 },
  legend: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 6, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 12, color: C.sub },
  periods: { flexDirection: "row", gap: 8 },
  periodChip: { backgroundColor: C.surface, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: "#D3E1FA" },
  periodChipOn: { backgroundColor: C.primary, borderColor: C.primary },
  periodText: { fontSize: 13, fontWeight: "600", color: C.sub },
  groupTitle: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  deferCard: { backgroundColor: C.amberBg, borderRadius: 24, padding: 14, gap: 8 },
  deferTitle: { flex: 1, fontSize: 13, fontWeight: "600", color: "#7A3606", lineHeight: 19 },
  deferRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  deferName: { flex: 1, fontSize: 13, fontWeight: "600", color: C.text },
  deferDue: { fontSize: 11, color: C.muted },
  deferAmount: { fontSize: 13, fontWeight: "700", color: C.text },
  deferFreed: { fontSize: 12, fontWeight: "600", color: "#7A3606" },
  empty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: "600", color: C.sub },
});
