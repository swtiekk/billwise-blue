import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { C, sh } from "../theme";
import { Text } from "../ui/Text";
import { CategoryIcon } from "./CategoryIcon";
import { BudgetBill, amountLabel } from "../api/bills";
import { daysUntil } from "../utils/dates";

/** "in 3 days", "due today", "overdue by 2 days" and the colour that goes with it. */
export function dueText(iso: string | null): { text: string; color: string } {
  if (!iso) return { text: "No due date", color: C.muted };
  const d = daysUntil(iso);
  if (d < 0) return { text: `overdue by ${-d} day${d === -1 ? "" : "s"}`, color: C.red };
  if (d === 0) return { text: "due today", color: C.amber };
  if (d === 1) return { text: "due tomorrow", color: C.amber };
  if (d <= 3) return { text: `in ${d} days`, color: C.amber };
  return { text: `in ${d} days`, color: C.muted };
}

const PRIORITY_STYLE = {
  High: { bg: C.redBg, text: C.red },
  Medium: { bg: C.amberBg, text: C.amber },
  Low: { bg: "#F1F5F9", text: C.muted },
} as const;

/** A bill as a soft pill row: category icon, name, when it's due, amount. */
export function BillPill({ bill, onPress }: { bill: BudgetBill; onPress?: () => void }) {
  const due = dueText(bill.dueDate);
  const mustPay = bill.classification === "Non-deferrable";
  const canWait = bill.classification === "Deferrable";
  const pr = bill.priority ? PRIORITY_STYLE[bill.priority] : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, sh.sm, pressed && { transform: [{ scale: 0.985 }] }]}
    >
      <View style={styles.icon}>
        <CategoryIcon category={bill.category} size={20} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>{bill.name}</Text>
        <View style={styles.subRow}>
          <Text style={[styles.due, { color: due.color }]}>{due.text}</Text>
          {pr ? (
            <View style={[styles.chip, { backgroundColor: pr.bg }]}>
              <Text style={[styles.chipText, { color: pr.text }]}>{bill.priority}</Text>
            </View>
          ) : null}
          {mustPay ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>Must pay</Text>
            </View>
          ) : null}
          {canWait ? (
            <View style={[styles.chip, { backgroundColor: C.greenBg }]}>
              <Text style={[styles.chipText, { color: C.green }]}>Can wait</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={styles.amount}>{amountLabel(bill)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: C.surface, borderRadius: 22, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "600", color: C.text },
  subRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  due: { fontSize: 12 },
  chip: { backgroundColor: C.text, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1 },
  chipText: { color: "#FFF", fontSize: 11, fontWeight: "500" },
  amount: { fontSize: 14, fontWeight: "700", color: C.text },
});
