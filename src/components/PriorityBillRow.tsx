import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { C, sh, fmt } from "../theme";
import { Text } from "../ui/Text";
import { CategoryIcon } from "./CategoryIcon";
import { PRIORITY_STYLE } from "./PriorityChip";
import { dueText } from "./BillPill";
import { BudgetBill, amountLabel } from "../api/bills";

const perDay = (monthly: number) => Math.round(monthly / 30); // a daily cost is stored as its monthly equivalent (x30)

/** A bill in the Bills list. The colored edge says its priority, so the row itself stays quiet. */
export function PriorityBillRow({ bill, onPress }: { bill: BudgetBill; onPress?: () => void }) {
  const paid = bill.status === "paid";
  const due = dueText(bill.dueDate);
  const edge = (bill.priority ? PRIORITY_STYLE[bill.priority] : PRIORITY_STYLE.Low).bar;

  const amount = bill.isDaily
    ? `${fmt(perDay(bill.amountMin))}${bill.amountMin === bill.amountMax ? "" : ` – ${fmt(perDay(bill.amountMax))}`} a day`
    : amountLabel(bill);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, sh.sm, paid && { opacity: 0.65 }, pressed && { transform: [{ scale: 0.985 }] }]}>
      <View style={[styles.edge, { backgroundColor: paid ? "#B9CDEE" : edge }]} />
      <View style={styles.icon}>
        <CategoryIcon category={bill.category} size={20} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>{bill.name}</Text>
        <Text style={[styles.due, { color: paid || bill.isDaily || bill.isDeferred ? C.muted : due.color }]} numberOfLines={1}>
          {paid ? "Paid" : bill.isDeferred ? "Moved to after payday" : bill.isDaily ? "Daily cost" : due.text}
        </Text>
      </View>
      <Text style={styles.amount}>{amount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: C.surface, borderRadius: 22, paddingVertical: 12, paddingRight: 14, flexDirection: "row", alignItems: "center", gap: 12, overflow: "hidden" },
  edge: { alignSelf: "stretch", width: 5, marginVertical: -12 },
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "600", color: C.text },
  due: { fontSize: 12, marginTop: 3 },
  amount: { fontSize: 13, fontWeight: "700", color: C.text },
});
