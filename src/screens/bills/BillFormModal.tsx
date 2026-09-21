import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { Field, Sel, Btn, Toggle } from "../../components/Atoms";
import { ScreenHeader } from "../../components/ScreenHeader";
import { BottomAction } from "../../components/BottomAction";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { BILL_CATEGORIES } from "../../constants/options";
import { publishBill } from "../../navigation/billBus";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "BillForm">;

const money = (v: string) => v.replace(/[^0-9.]/g, "");

export default function BillFormModal({ navigation, route }: Props) {
  const editing = route.params?.edit;
  const initial = route.params?.initial;
  // Setup 3 collects amounts later (Setup 4); Edit budget items has no later step, so ask here.
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
      <ScreenHeader title={editing ? "Edit bill" : "Add a bill"} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Field label="Item name" value={name} onChange={setName} placeholder="e.g. Meralco electric bill" />

        <View style={{ marginBottom: 16 }}>
          <Sel label="Category" value={category} onChange={setCategory} options={BILL_CATEGORIES} />
        </View>

        <Field
          label="Due day (1 to 31)"
          value={dueDay}
          onChange={(v) => setDueDay(v.replace(/\D/g, ""))}
          placeholder="e.g. 15"
          keyboardType="numeric"
        />
        <Field
          label="Grace period (days)"
          value={grace}
          onChange={(v) => setGrace(v.replace(/\D/g, ""))}
          placeholder="0"
          keyboardType="numeric"
        />

        {needsRange ? (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Min (₱)" value={min} onChange={(v) => setMin(money(v))} placeholder="0" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Max (₱)" value={max} onChange={(v) => setMax(money(v))} placeholder="0" keyboardType="numeric" />
            </View>
          </View>
        ) : null}

        <View style={[styles.toggleCard, sh.sm]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Has a penalty</Text>
            <Text style={styles.toggleSub}>A fee applies if it's paid late</Text>
          </View>
          <Toggle on={penalty} onToggle={() => setPenalty((v) => !v)} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <BottomAction>
        <View style={{ flex: 1 }}>
          <Btn variant="outline" onPress={() => navigation.goBack()}>Cancel</Btn>
        </View>
        <View style={{ flex: 1 }}>
          <Btn onPress={save}>Save</Btn>
        </View>
      </BottomAction>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleCard: { backgroundColor: C.surface, borderRadius: 22, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: C.text },
  toggleSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  error: { color: C.red, fontSize: 13, marginTop: 12 },
});
