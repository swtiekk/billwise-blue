import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text } from "../ui/Text";
import { C, sh } from "../theme";
import { STATUS_CONFIG, BillStatus } from "../data";
import { CategoryIcon } from "./CategoryIcon";
import { BudgetBill, amountLabel } from "../api/bills";
import { formatShort } from "../utils/dates";

export function StatusChip({ status }: { status: BillStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <View style={[styles.chipDot, { backgroundColor: c.dot }]} />
      <Text style={[styles.chipText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

export function BillCard({ bill, onPress }: { bill: BudgetBill; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, sh.sm, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={styles.iconWrap}>
        <CategoryIcon category={bill.category} size={20} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Text style={styles.billName} numberOfLines={1}>{bill.name}</Text>
          {bill.priority ? (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>{bill.priority} Priority</Text>
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <StatusChip status={bill.status} />
          <Text style={{ fontSize: 11, color: C.muted }}>{formatShort(bill.dueDate)}</Text>
          {bill.classification === "Non-deferrable" ? (
            <View style={styles.nonDeferrable}>
              <Text style={styles.nonDeferrableText}>Non-deferrable</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.amount}>{amountLabel(bill)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, alignSelf: "flex-start" },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 11, fontWeight: "600" },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  billName: { fontSize: 13, fontWeight: "600", color: C.text, flexShrink: 1 },
  priorityBadge: { backgroundColor: C.primaryLt, borderRadius: 99, paddingHorizontal: 6 },
  priorityText: { fontSize: 10, fontWeight: "600", color: C.primary },
  nonDeferrable: { backgroundColor: C.redBg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  nonDeferrableText: { fontSize: 10, fontWeight: "600", color: C.red },
  amount: { fontSize: 14, fontWeight: "700", color: C.text },
});
