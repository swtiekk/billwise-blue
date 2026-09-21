import React, { useState } from "react";
import { View, Pressable, Alert, StyleSheet } from "react-native";
import { Plus, Trash2, Users } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
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
      navigation.reset({ index: 0, routes: [{ name: "Analysis" }] }); // Save changes -> Loading -> Home
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
      title={edit ? "Edit household" : "Who's in your household?"}
      subtitle={edit ? "Update your family details and earners." : "Tell us about your family so we can plan your budget."}
      onBack={edit ? () => navigation.goBack() : undefined}
      onNext={next}
      nextLabel={edit ? (saving ? "Saving…" : "Save changes") : "Next"}
      error={error}
    >
      <Field
        label="Total family members"
        value={draft.totalMembers}
        onChange={(v) => patch({ totalMembers: digits(v) })}
        placeholder="e.g. 4"
        keyboardType="numeric"
      />
      <Field
        label="Number of dependents"
        value={draft.dependents}
        onChange={(v) => patch({ dependents: digits(v) })}
        placeholder="e.g. 2"
        keyboardType="numeric"
      />
      <View style={{ marginBottom: 20 }}>
        <Sel
          label="Housing type"
          value={draft.housing || "Select housing type"}
          onChange={(v) => patch({ housing: v })}
          options={HOUSING_TYPES}
        />
      </View>

      <FL>Earners</FL>
      <View style={{ gap: 10, marginBottom: 12 }}>
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
              <Trash2 size={18} color={C.muted} strokeWidth={1.8} />
            </Pressable>
          </View>
        ))}
        {draft.earners.length === 0 ? (
          <View style={styles.empty}>
            <Users size={22} color="#9DB0D6" strokeWidth={1.6} />
            <Text style={styles.emptyText}>No earners yet</Text>
          </View>
        ) : null}
      </View>

      <Pressable onPress={() => setModal(true)} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}>
        <Plus size={18} color={C.primary} strokeWidth={2.5} />
        <Text style={styles.addBtnText}>Add earner</Text>
      </Pressable>
      {edit ? <Text style={styles.note}>New earners start with ₱0 income. Set it in Edit income.</Text> : null}

      <Sheet visible={modal} onClose={() => setModal(false)} title="Add earner">
        <Field label="First name" value={first} onChange={setFirst} placeholder="Juan" />
        <Field label="Last name" value={last} onChange={setLast} placeholder="dela Cruz" />
        {modalError ? <Text style={styles.modalError}>{modalError}</Text> : null}
        <Btn onPress={saveEarner}>Save</Btn>
      </Sheet>
    </SetupLayout>
  );
}

const styles = StyleSheet.create({
  earnerRow: { backgroundColor: C.surface, borderRadius: 22, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 13, fontWeight: "700", color: C.primary },
  earnerName: { flex: 1, fontSize: 15, fontWeight: "600", color: C.text },
  empty: { alignItems: "center", paddingVertical: 20, gap: 6, backgroundColor: "#E8F0FE", borderRadius: 22 },
  emptyText: { fontSize: 13, color: C.muted },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 25, backgroundColor: C.primaryLt },
  addBtnText: { fontSize: 14, fontWeight: "700", color: C.primary },
  note: { fontSize: 12, color: C.muted, marginTop: 10 },
  modalError: { color: C.red, fontSize: 13, marginBottom: 10 },
});
