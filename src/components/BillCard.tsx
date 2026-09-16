import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { C, sh, fmt } from "../theme";
import { STATUS_CONFIG, Bill } from "../data";
import { CategoryIcon } from "./CategoryIcon";

export function StatusChip({ status }: { status: Bill["status"] }) {
  const c = STATUS_CONFIG[status];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <View style={[styles.chipDot, { backgroundColor: c.dot }]} />
      <Text style={[styles.chipText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

export function BillCard({ bill, onPress }: { bill: Bill; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, sh.sm, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={styles.iconWrap}>
        <CategoryIcon category={bill.category} size={20} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <Text style={styles.billName} numberOfLines={1}>{bill.name}</Text>
          {bill.isPriority && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>Priority</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <StatusChip status={bill.status} />
          <Text style={{ fontSize: 11, color: C.muted }}>{bill.dueDate}</Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.amount}>{fmt(bill.amount)}</Text>
        {bill.isRecurring && <Text style={{ fontSize: 11, color: C.muted }}>Monthly</Text>}
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
  amount: { fontSize: 15, fontWeight: "700", color: C.text },
});