import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { C, sh } from "../theme";
import { Text } from "../ui/Text";
import { CategoryIcon } from "./CategoryIcon";
import { dueText } from "./BillPill";
import { BudgetBill, amountLabel } from "../api/bills";
import { STATUS_CONFIG } from "../data";

/** A bill on Home: who, when it's due, a plain status chip, and the rough amount. No scores or rules. */
export function ComingUpRow({ bill, onPress }: { bill: BudgetBill; onPress?: () => void }) {
  const due = dueText(bill.dueDate);
  const st = STATUS_CONFIG[bill.status];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, sh.sm, pressed && { transform: [{ scale: 0.985 }] }]}>
      <View style={styles.icon}>
        <CategoryIcon category={bill.category} size={20} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>{bill.name}</Text>
        <Text style={[styles.due, { color: bill.status === "paid" ? C.muted : due.color }]}>
          {bill.status === "paid" ? "Done for this period" : due.text}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={styles.amount}>{amountLabel(bill)}</Text>
        <View style={[styles.chip, { backgroundColor: st.bg }]}>
          <Text style={[styles.chipText, { color: st.text }]}>{st.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: C.surface, borderRadius: 22, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "600", color: C.text },
  due: { fontSize: 12, marginTop: 3 },
  amount: { fontSize: 13, fontWeight: "700", color: C.text },
  chip: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  chipText: { fontSize: 11, fontWeight: "600" },
});
