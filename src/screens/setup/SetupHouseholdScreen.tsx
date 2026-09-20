import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Plus, Trash2, Users } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Field, Sel, Btn, FL } from "../../components/Atoms";
import { Sheet } from "../../components/Sheet";
import { SetupLayout } from "../../components/SetupLayout";
import { useSetup } from "../../context/SetupContext";
import { HOUSING_TYPES } from "../../constants/options";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "SetupHousehold">;

const digits = (v: string) => v.replace(/\D/g, "");

export default function SetupHouseholdScreen({ navigation }: Props) {
  const { draft, patch, addEarner, removeEarner } = useSetup();
  const [error, setError] = useState<string | null>(null);

  // Add Earner modal
  const [modal, setModal] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const saveEarner = () => {
    if (!first.trim() || !last.trim()) {
      setModalError("Enter the earner's first and last name.");
      return;
    }
    addEarner(first.trim(), last.trim());
    setFirst("");
    setLast("");
    setModalError(null);
    setModal(false);
  };

  const next = () => {
    const total = Number(draft.totalMembers);
    const deps = Number(draft.dependents || "0");
    if (!Number.isInteger(total) || total < 1) return setError("Enter the total number of family members.");
    if (deps >= total) return setError("Dependents must be fewer than the total family members.");
    if (!draft.housing) return setError("Choose a housing type.");
    if (draft.earners.length === 0) return setError("Add at least one earner.");
    setError(null);
    navigation.navigate("SetupIncome");
  };

  return (
    <SetupLayout
      step={1}
      title="Household Profile"
      subtitle="Tell us about your family so we can plan your budget."
      onNext={next}
      error={error}
    >
      <Field
        label="Total Family Members"
        value={draft.totalMembers}
        onChange={(v) => patch({ totalMembers: digits(v) })}
        placeholder="e.g. 4"
        keyboardType="numeric"
      />
      <Field
        label="Number of Dependents"
        value={draft.dependents}
        onChange={(v) => patch({ dependents: digits(v) })}
        placeholder="e.g. 2"
        keyboardType="numeric"
      />
      <View style={{ marginBottom: 16 }}>
        <Sel
          label="Housing Type"
          value={draft.housing || "Select housing type"}
          onChange={(v) => patch({ housing: v })}
          options={HOUSING_TYPES}
        />
      </View>

      <FL>Earners</FL>
      <View style={{ gap: 8, marginBottom: 10 }}>
        {draft.earners.map((e) => (
          <View key={e.id} style={[styles.earnerRow, sh.sm]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(e.firstName[0] ?? "").toUpperCase()}
                {(e.lastName[0] ?? "").toUpperCase()}
              </Text>
            </View>
            <Text style={styles.earnerName} numberOfLines={1}>
              {e.firstName} {e.lastName}
            </Text>
            <Pressable onPress={() => removeEarner(e.id)} hitSlop={8}>
              <Trash2 size={16} color={C.muted} strokeWidth={1.75} />
            </Pressable>
          </View>
        ))}
        {draft.earners.length === 0 ? (
          <View style={styles.empty}>
            <Users size={20} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyText}>No earners yet</Text>
          </View>
        ) : null}
      </View>

      <Pressable onPress={() => setModal(true)} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}>
        <Plus size={15} color={C.primary} strokeWidth={2.5} />
        <Text style={styles.addBtnText}>Add Earner</Text>
      </Pressable>

      <Sheet visible={modal} onClose={() => setModal(false)} title="Add Earner">
        <Field label="First Name" value={first} onChange={setFirst} placeholder="Juan" />
        <Field label="Last Name" value={last} onChange={setLast} placeholder="dela Cruz" />
        {modalError ? <Text style={styles.modalError}>{modalError}</Text> : null}
        <Btn onPress={saveEarner}>Save</Btn>
      </Sheet>
    </SetupLayout>
  );
}

const styles = StyleSheet.create({
  earnerRow: { backgroundColor: C.surface, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: C.border },
  avatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 12, fontWeight: "700", color: C.primary },
  earnerName: { flex: 1, fontSize: 13, fontWeight: "600", color: C.text },
  empty: { alignItems: "center", paddingVertical: 16, gap: 4, backgroundColor: "#F8FAFC", borderRadius: 16 },
  emptyText: { fontSize: 12, color: C.muted },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 44, borderRadius: 12, backgroundColor: C.primaryLt, marginBottom: 12 },
  addBtnText: { fontSize: 13, fontWeight: "700", color: C.primary },
  modalError: { color: C.red, fontSize: 12, marginBottom: 10 },
});
