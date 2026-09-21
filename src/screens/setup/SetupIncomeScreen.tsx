import React, { useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, fmt } from "../../theme";
import { Text } from "../../ui/Text";
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
      step={edit ? undefined : 2}
      title={edit ? "Edit income" : "How does money come in?"}
      subtitle={edit ? "Update what each earner brings in, and when." : "How much does each earner bring in, and when?"}
      onBack={() => navigation.goBack()}
      onNext={next}
      nextLabel={edit ? (saving ? "Saving…" : "Save changes") : "Next"}
      error={error}
    >
      {draft.earners.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 18 }}>
          {draft.earners.map((e) => {
            const on = e.id === earner?.id;
            return (
              <Pressable key={e.id} onPress={() => setActiveId(e.id)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && { color: "#FFF" }]}>{e.firstName}</Text>
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
              label="Income range (per payday)"
              value={earner.incomeRange || "Select income range"}
              onChange={(v) => updateEarner(earner.id, { incomeRange: v })}
              options={INCOME_BANDS.map((b) => b.label)}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Sel
              label="Income frequency"
              value={earner.frequency}
              onChange={(v) => updateEarner(earner.id, { frequency: v })}
              options={FREQUENCIES}
            />
          </View>

          <DateField
            label="Next payday"
            value={earner.nextPayday}
            onChange={(iso) => updateEarner(earner.id, { nextPayday: iso })}
            minimumDate={new Date()}
          />
        </>
      ) : null}

      <View style={styles.combined}>
        <Text style={styles.combinedLabel}>Combined income</Text>
        <Text style={styles.combinedValue} numberOfLines={1} adjustsFontSizeToFit>
          {combined.max === 0 ? "—" : `${fmt(combined.min)} – ${fmt(combined.max)}`}
        </Text>
        <Text style={styles.combinedSub}>per pay period, all earners</Text>
      </View>
    </SetupLayout>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surface, borderWidth: 1.5, borderColor: "#D3E1FA" },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: C.sub },
  earnerTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 14 },
  combined: { backgroundColor: C.primary, borderRadius: 24, padding: 18, marginTop: 6 },
  combinedLabel: { fontSize: 12, color: "#D3E4FF" },
  combinedValue: { fontSize: 26, fontWeight: "800", color: "#FFF", marginTop: 4 },
  combinedSub: { fontSize: 12, color: "#D3E4FF", marginTop: 4 },
});
