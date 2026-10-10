import React, { useEffect, useState } from "react";
import { View, Pressable, Alert, StyleSheet } from "react-native";
import { Plus, Trash2, Users, ChevronRight } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { Field, Sel, Btn, FL } from "../../components/Atoms";
import { Sheet } from "../../components/Sheet";
import { SetupLayout } from "../../components/SetupLayout";
import { ScreenLoading } from "../../components/ScreenLoading";
import { useSetup } from "../../context/SetupContext";
import { useSession } from "../../context/SessionContext";
import { useLoadDraft } from "../../hooks/useLoadDraft";
import { saveHouseholdEdit } from "../../api/edit";
import { errorMessage } from "../../api/client";
import { HOUSING_TYPES, DEPENDENT_RELATIONSHIPS } from "../../constants/options";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "SetupHousehold" | "EditHousehold">;

export default function SetupHouseholdScreen({ navigation, route }: Props) {
  const edit = route.name === "EditHousehold";
  const { draft, patch, addEarner, removeEarner, addDependent, removeDependent } = useSetup();
  const { user } = useSession();
  const { loading, error: loadError, reload } = useLoadDraft(edit);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Add Earner modal
  const [modal, setModal] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  // Add Dependent sheet: the only input is the relationship
  const [depModal, setDepModal] = useState(false);

  // The person who registered is automatically the first earner (setup only; edit loads saved earners).
  useEffect(() => {
    if (!edit && user && draft.earners.length === 0) addEarner(user.firstName, user.lastName);
  }, [edit, user, draft.earners.length, addEarner]);

  const householdSize = draft.earners.length + draft.dependents.length;

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
    if (!draft.housing) return "Tell us if you are renting or not.";
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
      <FL>Earners</FL>
      <Text style={styles.help}>People who bring in income. You are added automatically.</Text>
      <View style={{ gap: 10, marginBottom: 12 }}>
        {draft.earners.map((e, i) => (
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
            {i === 0 ? (
              <Text style={styles.youTag}>You</Text>
            ) : (
              <Pressable onPress={() => askRemove(e.id, e.serverId, `${e.firstName} ${e.lastName}`)} hitSlop={8}>
                <Trash2 size={18} color={C.muted} strokeWidth={1.8} />
              </Pressable>
            )}
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

      <View style={{ height: 24 }} />
      <FL>Dependents</FL>
      <Text style={styles.help}>Family members who rely on your income. Just pick their relationship to you.</Text>
      <View style={{ gap: 10, marginBottom: 12 }}>
        {draft.dependents.map((d) => (
          <View key={d.id} style={[styles.earnerRow, sh.sm]}>
            <View style={styles.avatar}>
              <Users size={18} color={C.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.earnerName} numberOfLines={1}>
              {d.relationship}
            </Text>
            <Pressable onPress={() => removeDependent(d.id)} hitSlop={8}>
              <Trash2 size={18} color={C.muted} strokeWidth={1.8} />
            </Pressable>
          </View>
        ))}
      </View>
      <Pressable onPress={() => setDepModal(true)} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}>
        <Plus size={18} color={C.primary} strokeWidth={2.5} />
        <Text style={styles.addBtnText}>Add dependent</Text>
      </Pressable>
      <Text style={styles.size}>
        Household size: {householdSize} ({draft.earners.length} earner{draft.earners.length === 1 ? "" : "s"} + {draft.dependents.length} dependent
        {draft.dependents.length === 1 ? "" : "s"})
      </Text>

      <View style={{ marginTop: 20 }}>
        <Sel
          label="Are you renting?"
          value={draft.housing || "Select one"}
          onChange={(v) => patch({ housing: v })}
          options={HOUSING_TYPES}
        />
        <Text style={styles.help}>
          Choose Not renting if you own the house or live in a relative's house. A housing loan is not rent: add it as a Loan bill instead.
        </Text>
      </View>

      <Sheet visible={depModal} onClose={() => setDepModal(false)} title="Add dependent">
        <Text style={styles.help}>Who is this to you? They are counted under all your earners.</Text>
        {DEPENDENT_RELATIONSHIPS.map((r) => (
          <Pressable
            key={r}
            onPress={() => {
              addDependent(r);
              setDepModal(false);
            }}
            style={({ pressed }) => [styles.relRow, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.relText}>{r}</Text>
            <ChevronRight size={18} color={C.muted} strokeWidth={2} />
          </Pressable>
        ))}
      </Sheet>

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
  help: { fontSize: 12, color: C.muted, marginBottom: 10 },
  youTag: { fontSize: 12, fontWeight: "700", color: C.primary },
  size: { fontSize: 13, fontWeight: "600", color: C.text, marginTop: 4 },
  note: { fontSize: 12, color: C.muted, marginTop: 10 },
  relRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 52, borderRadius: 16, paddingHorizontal: 16, backgroundColor: C.primaryLt, marginBottom: 10 },
  relText: { fontSize: 15, fontWeight: "600", color: C.primary },
  modalError: { color: C.red, fontSize: 13, marginBottom: 10 },
});
