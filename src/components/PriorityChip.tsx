import React from "react";
import { View, StyleSheet } from "react-native";
import { C } from "../theme";
import { Text } from "../ui/Text";
import type { BudgetBill } from "../api/bills";

/** High / Medium / Low, colored the same way everywhere (Home, Bills, Bill detail). */
export const PRIORITY_STYLE = {
  High: { bg: C.redBg, fg: C.red, bar: C.red, group: "Pay first" },
  Medium: { bg: C.amberBg, fg: C.amber, bar: "#E8873A", group: "Pay next" },
  Low: { bg: "#F1F5F9", fg: C.muted, bar: "#B9CDEE", group: "Can wait" },
} as const;

export function PriorityChip({ priority }: { priority: BudgetBill["priority"] }) {
  if (!priority) return null;
  const s = PRIORITY_STYLE[priority];
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.fg }]}>{priority}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { alignSelf: "flex-start", borderRadius: 99, paddingHorizontal: 9, paddingVertical: 2 },
  text: { fontSize: 11, fontWeight: "600" },
});
