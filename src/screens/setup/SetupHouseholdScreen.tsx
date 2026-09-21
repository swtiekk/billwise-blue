import React, { useState } from "react";
import { View, Pressable, Alert, StyleSheet } from "react-native";
import { Text } from "../../ui/Text";
import { Plus, Trash2, Users } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Field, Sel, Btn, FL } from "../../components/Atoms";
import { Sheet } from "../../components/Sheet";
import { SetupLayout } from "../../components/SetupLayout";
import { ScreenLoading } from "../../components/ScreenLoading";
import { useSetup } from "../../context/SetupContext";
import { useLoadDraft } from "../../hooks/useLoadDraft";
import { saveHouseholdEdit } from "../../api/edit";
import { errorMessage } from "../../api/client";
import { HOUSING_TYPES } from "../../constants/options";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "SetupHousehold" | "EditHousehold">;

const digits = (v: string) => v.replace(/\D/g, "");

export default function SetupHouseholdScreen({ navigation, route }: Props) {
  const edit = route.name === "EditHousehold";
  const { draft, patch, addEarner, removeEarner } = useSetup();
  const { loading, error: loadError, reload } = useLoadDraft(edit);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const askRemove = (id: string, serverId: number | undefined, name: string) => {
    if (!edit || serverId == null) return removeEarner(id);
    Alert.alert(
      `Remove ${name}?`,
      "Their income details are removed. Your bills are kept and moved to another earner.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeEarner(id) },
      ]
    );
  };

  const validate = (): string | null => {
    const total = Number(draft.totalMembers);
    const deps = Number(draft.dependents || "0");
    if (!Number.isInteger(total) || total < 1) return "Enter the total number of family members.";
    if (deps >= total) return "Dependents must be fewer than the total family members.";
    if (!draft.housing) return "Choose a housing type.";
    if (draft.earners.length === 0) return "Add at least one earner.";
    return null;
  };

  const next = async () => {
    if (saving) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);

    if (!edit) {
      navigation.navigate("SetupIncome");
      return;
    }

    setSaving(true);
    try {
      await saveHouseholdEdit(draft);
      navigation.reset({ index: 0, routes: [{ name: "Analysis" }] }); // Save Changes -> Loading -> Home
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  if (edit && (loading || loadError)) {
    return <ScreenLoading error={loadError} onRetry={reload} onBack={() => navigation.goBack()} />;
  }

  return (
    <SetupLayout
      step={edit ? undefined : 1}
      title={edit ? "Edit Household Profile" : "Household Profile"}
      subtitle={edit ? "Update your family details and earners." : "Tell us about your family so we can plan your budget."}
      onBack={edit ? () => navigation.goBack() : undefined}
      onNext={next}
      nextLabel={edit ? (saving ? "Saving…" : "Save Changes") : "Next"}
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
            <Pressable onPress={() => askRemove(e.id, e.serverId, `${e.firstName} ${e.lastName}`)} hitSlop={8}>
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
      {edit ? (
        <Text style={styles.note}>New earners start with ₱0 income. Set it in Edit Income Details.</Text>
      ) : null}

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
  note: { fontSize: 11, color: C.muted, marginBottom: 12, marginTop: -4 },
  modalError: { color: C.red, fontSize: 12, marginBottom: 10 },
});
