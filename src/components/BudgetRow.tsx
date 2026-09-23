import React, { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { C, sh } from "../theme";
import { Text } from "../ui/Text";
import { CategoryIcon } from "./CategoryIcon";
import { dueText } from "./BillPill";
import { BudgetBill, amountLabel } from "../api/bills";
import { formatShort } from "../utils/dates";
import { explainBill } from "../utils/billInsights";

const CHIP = {
  "Non-deferrable": { label: "Must pay", bg: C.text, fg: "#FFF" },
  Deferrable: { label: "Can wait", bg: C.primaryLt, fg: C.primary },
} as const;

const PRIORITY_CHIP = {
  High: { bg: C.redBg, fg: C.red },
  Medium: { bg: C.amberBg, fg: C.amber },
  Low: { bg: "#EAF0FB", fg: C.muted },
} as const;

/**
 * One bill on the Budget tab. Collapsed: rank, name, "Must pay" / "Can wait", when it's due, amount.
 * Tap to open the details from your flow (grace period, penalty, priority, type, and why).
 */
export function BudgetRow({ bill, rank }: { bill: BudgetBill; rank: number }) {
  const [open, setOpen] = useState(false);
  const due = dueText(bill.dueDate);
  const chip = bill.classification ? CHIP[bill.classification] : { label: "Not ranked yet", bg: "#EAF0FB", fg: C.muted };

  const details: [string, string][] = [
    ["Category", bill.categoryDesc],
    ["Due date", formatShort(bill.dueDate)],
    ["Grace period", `${bill.graceDays} day${bill.graceDays === 1 ? "" : "s"}`],
    ["Penalty", bill.hasPenalty ? "Yes" : "No"],
    ["Priority", bill.priority ?? "Not set"],
    ["Type", bill.classification ?? "Not set"],
  ];

  return (
    <Pressable onPress={() => setOpen((o) => !o)} style={[styles.card, sh.sm]}>
      <View style={styles.row}>
        <View>
          <View style={styles.icon}>
            <CategoryIcon category={bill.category} size={20} />
          </View>
          <View style={styles.rank}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{bill.name}</Text>
          <View style={styles.subRow}>
            {bill.priority ? (
              <View style={[styles.chip, { backgroundColor: PRIORITY_CHIP[bill.priority].bg }]}>
                <Text style={[styles.chipText, { color: PRIORITY_CHIP[bill.priority].fg }]}>{bill.priority}</Text>
              </View>
            ) : null}
            <View style={[styles.chip, { backgroundColor: chip.bg }]}>
              <Text style={[styles.chipText, { color: chip.fg }]}>{chip.label}</Text>
            </View>
            <Text style={[styles.due, { color: due.color }]}>{due.text}</Text>
          </View>
        </View>

        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text style={styles.amount}>{amountLabel(bill)}</Text>
          <ChevronDown size={16} color={C.muted} style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }} />
        </View>
      </View>

      {open ? (
        <View style={styles.details}>
          {details.map(([label, value]) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
          <Text style={styles.explain}>{explainBill(bill)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 22, padding: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  rank: { position: "absolute", top: -4, left: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.text, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  rankText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  name: { fontSize: 14, fontWeight: "600", color: C.text },
  subRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" },
  chip: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1 },
  chipText: { fontSize: 11, fontWeight: "500" },
  due: { fontSize: 12 },
  amount: { fontSize: 14, fontWeight: "700", color: C.text },
  details: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E6EEFB", gap: 6 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  detailLabel: { fontSize: 12, color: C.muted },
  detailValue: { fontSize: 12, fontWeight: "600", color: C.text },
  explain: { fontSize: 12, color: C.sub, lineHeight: 18, marginTop: 6 },
});
