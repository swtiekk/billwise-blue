import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CalendarClock } from "lucide-react-native";
import { C, sh } from "../theme";
import { STATUS_CONFIG } from "../data";
import { CategoryIcon } from "./CategoryIcon";
import { BudgetBill, amountLabel } from "../api/bills";
import { formatShort } from "../utils/dates";
import { explainBill } from "../utils/billInsights";

const PRIORITY_STYLE = {
  High: { bg: C.redBg, text: C.red },
  Medium: { bg: C.amberBg, text: C.amber },
  Low: { bg: "#F1F5F9", text: C.sub },
} as const;

/** Full bill card for the Budget tab. */
export function BillDetailCard({ bill, rank }: { bill: BudgetBill; rank: number }) {
  const st = STATUS_CONFIG[bill.status];
  const pr = bill.priority ? PRIORITY_STYLE[bill.priority] : null;

  return (
    <View style={[styles.card, sh.sm]}>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <CategoryIcon category={bill.category} size={20} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.nameRow}>
            <View style={styles.rank}>
              <Text style={styles.rankText}>#{rank}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>{bill.name}</Text>
          </View>
          <View style={styles.catTag}>
            <Text style={styles.catText}>{bill.categoryDesc}</Text>
          </View>
        </View>
        <Text style={styles.amount}>{amountLabel(bill)}</Text>
      </View>

      <View style={styles.chips}>
        <View style={[styles.chip, { backgroundColor: st.bg }]}>
          <CalendarClock size={11} color={st.text} strokeWidth={2} />
          <Text style={[styles.chipText, { color: st.text }]}>{formatShort(bill.dueDate)}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: C.primaryLt }]}>
          <Text style={[styles.chipText, { color: C.primary }]}>Grace {bill.graceDays}d</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: bill.hasPenalty ? C.redBg : "#F1F5F9" }]}>
          <Text style={[styles.chipText, { color: bill.hasPenalty ? C.red : C.muted }]}>
            {bill.hasPenalty ? "Penalty" : "No penalty"}
          </Text>
        </View>
        {pr && bill.priority ? (
          <View style={[styles.chip, { backgroundColor: pr.bg }]}>
            <Text style={[styles.chipText, { color: pr.text }]}>{bill.priority}</Text>
          </View>
        ) : null}
        {bill.classification ? (
          <View style={[styles.chip, { backgroundColor: bill.classification === "Non-deferrable" ? C.indigoBg : C.greenBg }]}>
            <Text style={[styles.chipText, { color: bill.classification === "Non-deferrable" ? C.indigo : C.green }]}>
              {bill.classification}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.explain}>{explainBill(bill)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 14, gap: 10 },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rank: { backgroundColor: C.primary, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1 },
  rankText: { fontSize: 10, fontWeight: "700", color: "#FFF" },
  name: { fontSize: 13, fontWeight: "600", color: C.text, flexShrink: 1 },
  catTag: { alignSelf: "flex-start", backgroundColor: C.primaryLt, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1, marginTop: 4 },
  catText: { fontSize: 10, fontWeight: "600", color: C.primary },
  amount: { fontSize: 13, fontWeight: "700", color: C.text, maxWidth: 120, textAlign: "right" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 10, fontWeight: "600" },
  explain: { fontSize: 11, color: C.muted, lineHeight: 16 },
});
