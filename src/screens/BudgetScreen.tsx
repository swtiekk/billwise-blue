import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { AlertTriangle, Landmark, Zap, ShieldCheck, PiggyBank, CreditCard } from "lucide-react-native";
import { C, sh, fmt } from "../theme";
import { TabBar, Tab } from "../components/TabBar";
import { BUDGET_DATA } from "../data";

const BUDGET_ICONS: Record<string, any> = {
  Loans: Landmark, Utilities: Zap, Insurance: ShieldCheck, Savings: PiggyBank, Food: CreditCard,
};

function DonutChart({ data, total }: { data: typeof BUDGET_DATA; total: number }) {
  const R = 68, CX = 90, CY = 90, stroke = 22;
  const circumference = 2 * Math.PI * R;
  let offset = 0;
  return (
    <Svg width={180} height={180} viewBox="0 0 180 180">
      <Circle cx={CX} cy={CY} r={R} fill="none" stroke={C.border} strokeWidth={stroke} />
      {data.map((d, i) => {
        const dash = (d.value / total) * circumference;
        const el = (
          <Circle
            key={i}
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            rotation={-90}
            origin={`${CX}, ${CY}`}
          />
        );
        offset += dash;
        return el;
      })}
    </Svg>
  );
}

export default function BudgetScreen({ onNavTab }: { onNavTab: (t: Tab) => void }) {
  const [income, setIncome] = useState("28000");
  const incomeNum = Number(income) || 0;
  const total = BUDGET_DATA.reduce((s, d) => s + d.value, 0);
  const leftover = incomeNum - total;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budget Allocation</Text>
        <Text style={styles.headerSub}>September 2026</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View style={[styles.card, sh.md]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            <View>
              <Text style={styles.mutedSmall}>Monthly Income</Text>
              <Text style={styles.incomeValue}>{fmt(incomeNum)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.mutedSmall}>Remaining</Text>
              <Text style={[styles.remainingValue, { color: leftover < 0 ? C.red : C.green }]}>
                {leftover < 0 ? "-" : ""}{fmt(Math.abs(leftover))}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: "center", marginVertical: 8 }}>
            <View>
              <DonutChart data={BUDGET_DATA} total={total} />
              <View style={styles.donutCenter} pointerEvents="none">
                <Text style={styles.mutedSmall}>Total Bills</Text>
                <Text style={styles.donutTotal}>{fmt(total)}</Text>
                <Text style={styles.mutedSmall}>{Math.round((total / incomeNum) * 100)}% of income</Text>
              </View>
            </View>
          </View>

          <View style={styles.legendGrid}>
            {BUDGET_DATA.map((d) => (
              <View key={d.name} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                <Text style={styles.legendLabel}>{d.name}</Text>
                <Text style={styles.legendPct}>{d.allocated}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, sh.md]}>
          <Text style={styles.label}>ADJUST MONTHLY INCOME</Text>
          <View style={styles.incomeInputWrap}>
            <Text style={styles.pesoSign}>₱</Text>
            <TextInput
              value={income}
              onChangeText={setIncome}
              keyboardType="numeric"
              style={styles.incomeInput}
            />
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <View style={{ gap: 10, marginTop: 12 }}>
            {BUDGET_DATA.map((d) => {
              const Icon = BUDGET_ICONS[d.name] ?? Landmark;
              return (
                <View key={d.name} style={[styles.card, sh.sm]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Icon size={16} color={d.color} strokeWidth={1.75} />
                      <Text style={styles.breakdownName}>{d.name}</Text>
                    </View>
                    <Text style={styles.breakdownValue}>{fmt(d.value)}</Text>
                  </View>
                  <View style={styles.breakdownTrack}>
                    <View style={[styles.breakdownFill, { width: `${d.allocated}%`, backgroundColor: d.color }]} />
                  </View>
                  <Text style={styles.breakdownPct}>{d.allocated}% of income</Text>
                </View>
              );
            })}
          </View>
        </View>

        {leftover < 0 && (
          <View style={styles.warnBanner}>
            <AlertTriangle size={18} color={C.red} strokeWidth={2} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warnTitle}>Over Budget</Text>
              <Text style={styles.warnBody}>
                Expenses exceed income by {fmt(Math.abs(leftover))}. Consider reducing non-essential spending.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <TabBar active="budget" onChange={onNavTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: C.surface, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 20, fontWeight: "700", color: C.text },
  headerSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 18 },
  mutedSmall: { fontSize: 11, color: C.muted, fontWeight: "500" },
  incomeValue: { fontSize: 22, fontWeight: "700", color: C.text, marginTop: 2 },
  remainingValue: { fontSize: 16, fontWeight: "700", marginTop: 2 },
  donutCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  donutTotal: { fontSize: 18, fontWeight: "700", color: C.text },
  legendGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  legendRow: { width: "50%", flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, color: C.sub, flex: 1 },
  legendPct: { fontSize: 12, fontWeight: "700", color: C.text },
  label: { fontSize: 11, fontWeight: "600", color: C.sub, letterSpacing: 0.5, marginBottom: 10 },
  incomeInputWrap: { position: "relative", justifyContent: "center" },
  pesoSign: { position: "absolute", left: 16, fontSize: 14, fontWeight: "700", color: C.muted, zIndex: 1 },
  incomeInput: { backgroundColor: C.primaryLt, borderRadius: 12, borderWidth: 1, borderColor: "#DBEAFE", paddingLeft: 30, paddingRight: 16, height: 48, fontSize: 14, fontWeight: "700", color: C.text },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  breakdownName: { fontSize: 13, fontWeight: "600", color: C.sub },
  breakdownValue: { fontSize: 13, fontWeight: "700", color: C.text },
  breakdownTrack: { height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden" },
  breakdownFill: { height: "100%", borderRadius: 4 },
  breakdownPct: { fontSize: 11, color: C.muted, marginTop: 4 },
  warnBanner: { backgroundColor: C.redBg, borderColor: "#FECDD3", borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", gap: 10 },
  warnTitle: { fontSize: 13, fontWeight: "700", color: C.red },
  warnBody: { fontSize: 11, color: "#F43F5E", marginTop: 2, lineHeight: 16 },
});