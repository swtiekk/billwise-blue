import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, fmt } from "../../theme";
import { Sel } from "../../components/Atoms";
import { DateField } from "../../components/DateField";
import { SetupLayout } from "../../components/SetupLayout";
import { ScreenLoading } from "../../components/ScreenLoading";
import { useSetup, combinedIncome } from "../../context/SetupContext";
import { useLoadDraft } from "../../hooks/useLoadDraft";
import { saveIncomeEdit } from "../../api/edit";
import { errorMessage } from "../../api/client";
import { FREQUENCIES, INCOME_BANDS, bandFor } from "../../constants/options";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "SetupIncome" | "EditIncome">;

export default function SetupIncomeScreen({ navigation, route }: Props) {
  const edit = route.name === "EditIncome";
  const { draft, updateEarner } = useSetup();
  const { loading, error: loadError, reload } = useLoadDraft(edit);
  const [activeId, setActiveId] = useState<string | undefined>(draft.earners[0]?.id);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const earner = draft.earners.find((e) => e.id === activeId) ?? draft.earners[0];
  const combined = combinedIncome(draft.earners, bandFor);

  const next = async () => {
    if (saving) return;
    for (const e of draft.earners) {
      if (!e.incomeRange || !e.nextPayday) {
        setActiveId(e.id);
        setError(`Choose an income range and next payday for ${e.firstName}.`);
        return;
      }
    }
    setError(null);

    if (!edit) {
      navigation.navigate("SetupBills");
      return;
    }

    setSaving(true);
    try {
      await saveIncomeEdit(draft);
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
      step={edit ? undefined : 2}
      title={edit ? "Edit Income Details" : "Income Setup"}
      subtitle={edit ? "Update what each earner brings in, and when." : "How much does each earner bring in, and when?"}
      onBack={() => navigation.goBack()}
      onNext={next}
      nextLabel={edit ? (saving ? "Saving…" : "Save Changes") : "Next"}
      error={error}
    >
      {draft.earners.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
          {draft.earners.map((e) => {
            const on = e.id === earner?.id;
            return (
              <Pressable
                key={e.id}
                onPress={() => setActiveId(e.id)}
                style={[styles.chip, { backgroundColor: on ? C.primary : "#F1F5F9" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: on ? "#FFF" : C.sub }}>{e.firstName}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {earner ? (
        <>
          <Text style={styles.earnerTitle}>
            {earner.firstName} {earner.lastName}
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Sel
              label="Income Range (per payday)"
              value={earner.incomeRange || "Select income range"}
              onChange={(v) => updateEarner(earner.id, { incomeRange: v })}
              options={INCOME_BANDS.map((b) => b.label)}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Sel
              label="Income Frequency"
              value={earner.frequency}
              onChange={(v) => updateEarner(earner.id, { frequency: v })}
              options={FREQUENCIES}
            />
          </View>

          <DateField
            label="Next Payday"
            value={earner.nextPayday}
            onChange={(iso) => updateEarner(earner.id, { nextPayday: iso })}
            minimumDate={new Date()}
          />
        </>
      ) : null}

      <View style={styles.combinedCard}>
        <Text style={styles.combinedLabel}>COMBINED INCOME</Text>
        <Text style={styles.combinedValue}>
          {combined.max === 0 ? "—" : `${fmt(combined.min)} – ${fmt(combined.max)}`}
        </Text>
        <Text style={styles.combinedSub}>per pay period, all earners</Text>
      </View>
    </SetupLayout>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99 },
  earnerTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 14 },
  combinedCard: { backgroundColor: C.primaryLt, borderRadius: 16, padding: 16, marginTop: 4, marginBottom: 8 },
  combinedLabel: { fontSize: 11, fontWeight: "600", color: C.sub, letterSpacing: 0.5 },
  combinedValue: { fontSize: 20, fontWeight: "700", color: C.primaryDk, marginTop: 4 },
  combinedSub: { fontSize: 11, color: C.muted, marginTop: 2 },
});
