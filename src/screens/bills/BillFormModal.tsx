import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Field, Sel, Btn, FL, Toggle } from "../../components/Atoms";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { BILL_CATEGORIES } from "../../constants/options";
import { publishBill } from "../../navigation/billBus";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "BillForm">;

export default function BillFormModal({ navigation, route }: Props) {
  const initial = route.params?.initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Electricity");
  const [dueDay, setDueDay] = useState("");
  const [grace, setGrace] = useState("0");
  const [penalty, setPenalty] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const day = Number(dueDay);
    const graceN = Number(grace || "0");
    if (!name.trim()) return setError("Enter the item name.");
    if (!Number.isInteger(day) || day < 1 || day > 31) return setError("Due day must be a number from 1 to 31.");
    if (!Number.isInteger(graceN) || graceN < 0) return setError("Grace period must be 0 or more days.");

    publishBill({ name: name.trim(), category, dueDay: day, graceDays: graceN, hasPenalty: penalty });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={18} color={C.primaryDk} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Bill</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 4 }} keyboardShouldPersistTaps="handled">
        <Field label="Item Name" value={name} onChange={setName} placeholder="e.g. Meralco Electric Bill" />

        <View style={{ marginBottom: 16 }}>
          <Sel label="Category" value={category} onChange={setCategory} options={BILL_CATEGORIES} />
        </View>

        <Field
          label="Due Day (1 - 31)"
          value={dueDay}
          onChange={(v) => setDueDay(v.replace(/\D/g, ""))}
          placeholder="e.g. 15"
          keyboardType="numeric"
        />
        <Field
          label="Grace Period (days)"
          value={grace}
          onChange={(v) => setGrace(v.replace(/\D/g, ""))}
          placeholder="0"
          keyboardType="numeric"
        />

        <View style={[styles.toggleCard, sh.sm]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Has Penalty</Text>
            <Text style={styles.toggleSub}>A fee applies if paid late</Text>
          </View>
          <Toggle on={penalty} onToggle={() => setPenalty((v) => !v)} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ marginTop: 16, gap: 10 }}>
          <Btn onPress={save}>Save</Btn>
          <Btn variant="outline" onPress={() => navigation.goBack()}>Cancel</Btn>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: C.surface, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  toggleCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { fontSize: 13, fontWeight: "600", color: C.sub },
  toggleSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  error: { color: C.red, fontSize: 12, marginTop: 12 },
});
