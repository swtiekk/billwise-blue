import React, { useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { Text } from "../../ui/Text";
import { ArrowLeft } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Field, Sel, Btn, Toggle } from "../../components/Atoms";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { BILL_CATEGORIES } from "../../constants/options";
import { publishBill } from "../../navigation/billBus";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "BillForm">;

const money = (v: string) => v.replace(/[^0-9.]/g, "");

export default function BillFormModal({ navigation, route }: Props) {
  const editing = route.params?.edit;
  const initial = route.params?.initial;
  // Setup 3 collects amounts later (Setup 4); Edit Budget Items has no later step, so ask here.
  const needsRange = !!route.params?.needsRange || !!editing;

  const [name, setName] = useState(editing?.name ?? initial?.name ?? "");
  const [category, setCategory] = useState(editing?.category ?? initial?.category ?? "Electricity");
  const [dueDay, setDueDay] = useState(editing ? String(editing.dueDay) : "");
  const [grace, setGrace] = useState(editing ? String(editing.graceDays) : "0");
  const [penalty, setPenalty] = useState(editing?.hasPenalty ?? true);
  const [min, setMin] = useState(editing && editing.min > 0 ? String(editing.min) : "");
  const [max, setMax] = useState(editing && editing.max > 0 ? String(editing.max) : "");
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const day = Number(dueDay);
    const graceN = Number(grace || "0");
    if (!name.trim()) return setError("Enter the item name.");
    if (!Number.isInteger(day) || day < 1 || day > 31) return setError("Due day must be a number from 1 to 31.");
    if (!Number.isInteger(graceN) || graceN < 0) return setError("Grace period must be 0 or more days.");

    let lo: number | undefined;
    let hi: number | undefined;
    if (needsRange) {
      lo = Number(min);
      hi = Number(max);
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo <= 0 || hi <= 0) return setError("Enter a minimum and maximum amount.");
      if (lo > hi) return setError("The minimum can't be higher than the maximum.");
    }

    publishBill({
      id: editing?.id,
      name: name.trim(),
      category,
      dueDay: day,
      graceDays: graceN,
      hasPenalty: penalty,
      min: lo,
      max: hi,
    });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={18} color={C.primaryDk} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>{editing ? "Edit Bill" : "Add Bill"}</Text>
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

        {needsRange ? (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Min Amount (₱)" value={min} onChange={(v) => setMin(money(v))} placeholder="0" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Max Amount (₱)" value={max} onChange={(v) => setMax(money(v))} placeholder="0" keyboardType="numeric" />
            </View>
          </View>
        ) : null}

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
