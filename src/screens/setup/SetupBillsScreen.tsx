import React, { useEffect, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text } from "../../ui/Text";
import { ScanLine, PenLine, Trash2, FileText } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { FL } from "../../components/Atoms";
import { CategoryIcon } from "../../components/CategoryIcon";
import { SetupLayout } from "../../components/SetupLayout";
import { useSetup } from "../../context/SetupContext";
import { subscribeBill } from "../../navigation/billBus";
import { categoryFromText } from "../../api/bills";
import { QUICK_ADD_CATEGORIES } from "../../constants/options";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "SetupBills">;

export default function SetupBillsScreen({ navigation }: Props) {
  const { draft, addBill, removeBill } = useSetup();
  const [error, setError] = useState<string | null>(null);

  // Bills confirmed in the Scan / Add Bill screens arrive here.
  useEffect(() => subscribeBill(addBill), [addBill]);

  const next = () => {
    if (draft.bills.length === 0) {
      setError("Add at least one bill to continue.");
      return;
    }
    setError(null);
    navigation.navigate("SetupRanges");
  };

  return (
    <SetupLayout
      step={3}
      title="Bill Setup"
      subtitle="Add the bills you pay every month."
      onBack={() => navigation.goBack()}
      onNext={next}
      error={error}
    >
      <View style={styles.actions}>
        <Pressable onPress={() => navigation.navigate("ScanBill")} style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}>
          <View style={styles.actionIcon}>
            <ScanLine size={20} color={C.primary} strokeWidth={1.75} />
          </View>
          <Text style={styles.actionLabel}>Scan Bill</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("BillForm")} style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}>
          <View style={styles.actionIcon}>
            <PenLine size={20} color={C.primary} strokeWidth={1.75} />
          </View>
          <Text style={styles.actionLabel}>Add Manually</Text>
        </Pressable>
      </View>

      <FL>Quick Add</FL>
      <View style={styles.chipWrap}>
        {QUICK_ADD_CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => navigation.navigate("BillForm", { initial: { name: c, category: c } })}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.chipText}>+ {c}</Text>
          </Pressable>
        ))}
      </View>

      <FL>{`Added Bills (${draft.bills.length})`}</FL>
      <View style={{ gap: 8, marginBottom: 12 }}>
        {draft.bills.map((b) => (
          <View key={b.id} style={[styles.billRow, sh.sm]}>
            <View style={styles.billIcon}>
              <CategoryIcon category={categoryFromText(b.category)} size={18} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.billName} numberOfLines={1}>{b.name}</Text>
              <Text style={styles.billSub} numberOfLines={1}>
                {b.category} · Due day {b.dueDay} · Grace {b.graceDays}d{b.hasPenalty ? " · Penalty" : ""}
              </Text>
            </View>
            <Pressable onPress={() => removeBill(b.id)} hitSlop={8}>
              <Trash2 size={16} color={C.muted} strokeWidth={1.75} />
            </Pressable>
          </View>
        ))}
        {draft.bills.length === 0 ? (
          <View style={styles.empty}>
            <FileText size={22} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyText}>No bills added yet</Text>
          </View>
        ) : null}
      </View>
    </SetupLayout>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: 12, marginBottom: 20 },
  action: { flex: 1, backgroundColor: C.primaryLt, borderRadius: 16, paddingVertical: 16, alignItems: "center", gap: 8 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontWeight: "700", color: C.primary },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: { backgroundColor: "#F1F5F9", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 12, fontWeight: "600", color: C.sub },
  billRow: { backgroundColor: C.surface, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: C.border },
  billIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  billName: { fontSize: 13, fontWeight: "600", color: C.text },
  billSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: 20, gap: 6, backgroundColor: "#F8FAFC", borderRadius: 16 },
  emptyText: { fontSize: 12, color: C.muted },
});
