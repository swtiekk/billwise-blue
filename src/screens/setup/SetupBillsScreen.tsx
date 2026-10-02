import React, { useEffect, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ScanLine, Plus, Trash2, FileText } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, fmt } from "../../theme";
import { Text } from "../../ui/Text";
import { FL } from "../../components/Atoms";
import { CategoryIcon } from "../../components/CategoryIcon";
import { SetupLayout } from "../../components/SetupLayout";
import { useSetup } from "../../context/SetupContext";
import { subscribeBill } from "../../navigation/billBus";
import { categoryFromText } from "../../api/bills";
import { dayLabel } from "../../constants/options";
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
      title="What bills do you pay?"
      subtitle="Enroll each biller you pay, like Cepalco or your water district. Scan a bill or pick the biller."
      onBack={() => navigation.goBack()}
      onNext={next}
      error={error}
    >
      <View style={styles.actions}>
        <Pressable onPress={() => navigation.navigate("ScanBill")} style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}>
          <View style={styles.actionIcon}>
            <ScanLine size={22} color={C.primary} strokeWidth={1.9} />
          </View>
          <Text style={styles.actionLabel}>Scan a bill</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("AddBiller")} style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}>
          <View style={styles.actionIcon}>
            <Plus size={22} color={C.primary} strokeWidth={1.9} />
          </View>
          <Text style={styles.actionLabel}>Add a biller</Text>
        </Pressable>
      </View>

      <FL>{`Your bills (${draft.bills.length})`}</FL>
      <View style={{ gap: 10, marginBottom: 12 }}>
        {draft.bills.map((b) => (
          <View key={b.id} style={[styles.billRow, sh.sm]}>
            <View style={styles.billIcon}>
              <CategoryIcon category={categoryFromText(b.category)} size={20} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.billName} numberOfLines={1}>{b.name}</Text>
              <Text style={styles.billSub} numberOfLines={1}>
                {b.category}
                {b.isDaily ? ", daily cost" : b.reminderDay ? `, remind me on the ${dayLabel(b.reminderDay)}` : ""}
              </Text>
              <Text style={styles.billSub2} numberOfLines={1}>
                {Number(b.min) === Number(b.max) ? fmt(Number(b.min)) : `${fmt(Number(b.min))} – ${fmt(Number(b.max))}`}
                {b.isDaily ? " a day" : " a month"}
              </Text>
            </View>
            <Pressable onPress={() => removeBill(b.id)} hitSlop={8}>
              <Trash2 size={18} color={C.muted} strokeWidth={1.8} />
            </Pressable>
          </View>
        ))}
        {draft.bills.length === 0 ? (
          <View style={styles.empty}>
            <FileText size={24} color="#9DB0D6" strokeWidth={1.6} />
            <Text style={styles.emptyText}>No bills yet</Text>
          </View>
        ) : null}
      </View>
    </SetupLayout>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: 12, marginBottom: 22 },
  action: { flex: 1, backgroundColor: C.primaryLt, borderRadius: 24, paddingVertical: 18, alignItems: "center", gap: 10 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 14, fontWeight: "700", color: C.primary },
  billRow: { backgroundColor: C.surface, borderRadius: 22, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  billIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  billName: { fontSize: 15, fontWeight: "600", color: C.text },
  billSub: { fontSize: 12, color: C.sub, marginTop: 2 },
  billSub2: { fontSize: 12, color: C.muted, marginTop: 1 },
  empty: { alignItems: "center", paddingVertical: 24, gap: 6, backgroundColor: "#E8F0FE", borderRadius: 22 },
  emptyText: { fontSize: 13, color: C.muted },
});
