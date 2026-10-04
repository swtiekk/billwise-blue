import React, { useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, fmt } from "../../theme";
import { Text } from "../../ui/Text";
import { Sel, FL } from "../../components/Atoms";
import { SetupLayout } from "../../components/SetupLayout";
import { ScreenLoading } from "../../components/ScreenLoading";
import { useSetup, combinedIncome } from "../../context/SetupContext";
import { useLoadDraft } from "../../hooks/useLoadDraft";
import { saveIncomeEdit } from "../../api/edit";
import { errorMessage } from "../../api/client";
import {
  DAY_OPTIONS,
  FREQUENCIES,
  INCOME_BANDS,
  INCOME_QUESTION,
  PAYDAY_PRESETS,
  WEEKDAYS,
  bandFor,
  dayFromLabel,
  dayLabel,
} from "../../constants/options";
import { nextPaydayISO, scheduleComplete } from "../../utils/payday";
import { formatLong, fromISO } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "SetupIncome" | "EditIncome">;

export default function SetupIncomeScreen({ navigation, route }: Props) {
  const edit = route.name === "EditIncome";
  const { draft, updateEarner } = useSetup();
  const { loading, error: loadError, reload } = useLoadDraft(edit);
  const [activeId, setActiveId] = useState<string | undefined>(draft.earners[0]?.id);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [customDays, setCustomDays] = useState<Record<string, boolean>>({});

  const earner = draft.earners.find((e) => e.id === activeId) ?? draft.earners[0];
  const combined = combinedIncome(draft.earners, bandFor);

  const next = async () => {
    if (saving) return;
    for (const e of draft.earners) {
      if (!e.incomeRange || !scheduleComplete(e)) {
        setActiveId(e.id);
        setError(`Choose how much and which payday(s) for ${e.firstName}.`);
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

          <FL>How often are you paid?</FL>
          <View style={styles.chipRow}>
            {FREQUENCIES.map((f) => {
              const on = earner.frequency === f;
              return (
                <Pressable
                  key={f}
                  onPress={() =>
                    on ? null : updateEarner(earner.id, { frequency: f, paydayWeekday: null, payday1: null, payday2: null })
                  }
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && { color: "#FFF" }]}>{f}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Sel
              label={INCOME_QUESTION[earner.frequency] ?? "How much do you receive each payday?"}
              value={earner.incomeRange || "Select amount"}
              onChange={(v) => updateEarner(earner.id, { incomeRange: v })}
              options={INCOME_BANDS.map((b) => b.label)}
            />
            {earner.frequency === "Twice a month" ? (
              <Text style={styles.help}>Count one payday only. Example: ₱32,000 a month paid twice is ₱16,000 each payday.</Text>
            ) : null}
          </View>

          {earner.frequency === "Weekly" ? (
            <>
              <FL>Which day are you paid?</FL>
              <View style={styles.chipRow}>
                {WEEKDAYS.map((name, i) => {
                  const on = earner.paydayWeekday === i;
                  return (
                    <Pressable key={name} onPress={() => updateEarner(earner.id, { paydayWeekday: i })} style={[styles.chip, on && styles.chipOn]}>
                      <Text style={[styles.chipText, on && { color: "#FFF" }]}>{name.slice(0, 3)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          {earner.frequency === "Monthly" ? (
            <Sel
              label="Which day of the month are you paid?"
              value={earner.payday1 ? dayLabel(earner.payday1) : "Select payday"}
              onChange={(v) => updateEarner(earner.id, { payday1: dayFromLabel(v) })}
              options={DAY_OPTIONS}
            />
          ) : null}

          {earner.frequency === "Twice a month" ? (
            <>
              <FL>Which days are you paid?</FL>
              {PAYDAY_PRESETS.map((p) => {
                const on = !customDays[earner.id] && earner.payday1 === p.days[0] && earner.payday2 === p.days[1];
                return (
                  <Pressable
                    key={p.label}
                    onPress={() => {
                      setCustomDays((c) => ({ ...c, [earner.id]: false }));
                      updateEarner(earner.id, { payday1: p.days[0], payday2: p.days[1] });
                    }}
                    style={[styles.preset, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && { color: "#FFF" }]}>{p.label}</Text>
                  </Pressable>
                );
              })}
              {(() => {
                const matchesPreset = PAYDAY_PRESETS.some((p) => earner.payday1 === p.days[0] && earner.payday2 === p.days[1]);
                const custom = customDays[earner.id] || (earner.payday1 != null && !matchesPreset);
                return (
                  <>
                    <Pressable
                      onPress={() => setCustomDays((c) => ({ ...c, [earner.id]: true }))}
                      style={[styles.preset, custom && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, custom && { color: "#FFF" }]}>Other days</Text>
                    </Pressable>
                    {custom ? (
                      <View style={{ gap: 12, marginTop: 4 }}>
                        <Sel
                          label="First payday"
                          value={earner.payday1 ? dayLabel(earner.payday1) : "Select day"}
                          onChange={(v) => updateEarner(earner.id, { payday1: dayFromLabel(v) })}
                          options={DAY_OPTIONS}
                        />
                        <Sel
                          label="Second payday"
                          value={earner.payday2 ? dayLabel(earner.payday2) : "Select day"}
                          onChange={(v) => updateEarner(earner.id, { payday2: dayFromLabel(v) })}
                          options={DAY_OPTIONS}
                        />
                      </View>
                    ) : null}
                  </>
                );
              })()}
            </>
          ) : null}

          {earner.frequency === "Twice a month" ? (
            <Text style={styles.help}>Paid on other days? Choose "Other days". For example, some offices pay on the 12th and 27th.</Text>
          ) : null}

          {earner.frequency !== "Weekly" ? (
            <Text style={styles.help}>If a payday falls on a weekend, we count the Friday before.</Text>
          ) : null}

          {(() => {
            const iso = nextPaydayISO(earner);
            if (!iso) return null;
            return (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Next payday</Text>
                <Text style={styles.previewValue}>
                  {WEEKDAYS[(fromISO(iso).getDay() + 6) % 7].slice(0, 3)}, {formatLong(iso)}
                </Text>
              </View>
            );
          })()}
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  preset: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1.5, borderColor: "#D3E1FA", marginBottom: 8 },
  help: { fontSize: 12, color: C.muted, marginTop: 6, marginBottom: 8 },
  preview: { backgroundColor: C.primaryLt, borderRadius: 18, padding: 14, marginTop: 8, marginBottom: 12 },
  previewLabel: { fontSize: 12, color: C.muted },
  previewValue: { fontSize: 16, fontWeight: "700", color: C.primary, marginTop: 2 },
  earnerTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 14 },
  combined: { backgroundColor: C.primary, borderRadius: 24, padding: 18, marginTop: 6 },
  combinedLabel: { fontSize: 12, color: "#D3E4FF" },
  combinedValue: { fontSize: 26, fontWeight: "800", color: "#FFF", marginTop: 4 },
  combinedSub: { fontSize: 12, color: "#D3E4FF", marginTop: 4 },
});
