import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { C, sh } from "../theme";
import { Text } from "../ui/Text";
import { CategoryIcon } from "./CategoryIcon";
import { PriorityChip } from "./PriorityChip";
import { dueText } from "./BillPill";
import { BudgetBill, amountLabel } from "../api/bills";

/** A bill with its place in the "pay first" order: 1, 2, 3. */
export function RankedBillCard({ bill, rank, onPress }: { bill: BudgetBill; rank: number; onPress?: () => void }) {
  const due = dueText(bill.dueDate);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, sh.sm, pressed && { transform: [{ scale: 0.985 }] }]}>
      <View style={styles.rank}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      <View style={styles.icon}>
        <CategoryIcon category={bill.category} size={20} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>{bill.name}</Text>
        <Text style={[styles.due, { color: due.color }]}>{due.text}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 5 }}>
        <Text style={styles.amount}>{amountLabel(bill)}</Text>
        <PriorityChip priority={bill.priority} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: C.surface, borderRadius: 22, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  rank: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.text, alignItems: "center", justifyContent: "center" },
  rankText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "600", color: C.text },
  due: { fontSize: 12, marginTop: 3 },
  amount: { fontSize: 13, fontWeight: "700", color: C.text },
});
