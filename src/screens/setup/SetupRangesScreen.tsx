import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, fmt, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { Field } from "../../components/Atoms";
import { Piso } from "../../components/Piso";
import { SetupLayout } from "../../components/SetupLayout";
import { ScreenLoading } from "../../components/ScreenLoading";
import { useSetup, combinedIncome } from "../../context/SetupContext";
import { useSession } from "../../context/SessionContext";
import { useLoadDraft } from "../../hooks/useLoadDraft";
import { bandFor } from "../../constants/options";
import { buildSetupPayload, submitSetup } from "../../api/setup";
import { saveRangesEdit } from "../../api/edit";
import { errorMessage } from "../../api/client";
import { monthYear } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "SetupRanges" | "EditRanges">;

const money = (v: string) => v.replace(/[^0-9.]/g, "");

export default function SetupRangesScreen({ navigation, route }: Props) {
  const edit = route.name === "EditRanges";
  const { draft, patch, updateBill, reset } = useSetup();
  const { setUser } = useSession();
  const { loading: loadingDraft, error: loadError, reload } = useLoadDraft(edit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const combined = combinedIncome(draft.earners, bandFor);
  const firstPayday = draft.earners.map((e) => e.nextPayday).filter(Boolean).sort()[0];

  const fail = (msg: string) => setError(msg);

  const submit = async () => {
    if (loading) return;

    for (const b of draft.bills) {
      const lo = Number(b.min);
      const hi = Number(b.max);
      if (!b.min || !b.max || !Number.isFinite(lo) || !Number.isFinite(hi) || lo <= 0 || hi <= 0) {
        return fail(`Enter a minimum and maximum amount for ${b.name}.`);
      }
      if (lo > hi) return fail(`${b.name}: the minimum can't be higher than the maximum.`);
    }
    if (draft.dailyFood === "" || !Number.isFinite(Number(draft.dailyFood))) return fail("Enter your daily food expenses.");
    if (draft.dailyTransport === "" || !Number.isFinite(Number(draft.dailyTransport))) return fail("Enter your daily transportation cost.");

    setLoading(true);
    setError(null);
    try {
      if (edit) {
        await saveRangesEdit(draft);
      } else {
        await submitSetup(buildSetupPayload(draft));
        reset();
        setUser((u) => (u ? { ...u, setupCompleted: true } : u));
      }
      // reset() so the back button can't return to these screens; Analysis then opens Home
      navigation.reset({ index: 0, routes: [{ name: "Analysis" }] });
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  };

  if (edit && (loadingDraft || loadError)) {
    return <ScreenLoading error={loadError} onRetry={reload} onBack={() => navigation.goBack()} />;
  }

  return (
    <SetupLayout
      step={edit ? undefined : 4}
      title={edit ? "Edit budget ranges" : "How much do they cost?"}
      subtitle="Set a minimum and maximum you expect to pay for each bill."
      onBack={() => navigation.goBack()}
      onNext={submit}
      nextLabel={edit ? (loading ? "Saving…" : "Save changes") : loading ? "Submitting…" : "Submit setup"}
      error={error}
    >
      <View style={styles.topRow}>
        <View style={styles.periodChip}>
          <Text style={styles.periodText}>{firstPayday ? monthYear(firstPayday) : "Budget period"}</Text>
        </View>
      </View>

      <View style={styles.combined}>
        <Text style={styles.combinedLabel}>Combined income</Text>
        <Text style={styles.combinedValue} numberOfLines={1} adjustsFontSizeToFit>
          {combined.max === 0 ? "—" : `${fmt(combined.min)} – ${fmt(combined.max)}`}
        </Text>
      </View>

      {draft.bills.map((b) => (
        <View key={b.id} style={[styles.billCard, sh.sm]}>
          <Text style={styles.billName}>{b.name}</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Min (₱)" value={b.min} onChange={(v) => updateBill(b.id, { min: money(v) })} placeholder="0" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Max (₱)" value={b.max} onChange={(v) => updateBill(b.id, { max: money(v) })} placeholder="0" keyboardType="numeric" />
            </View>
          </View>
        </View>
      ))}

      <View style={[styles.billCard, sh.sm]}>
        <Text style={styles.billName}>Daily costs</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Food (₱ a day)" value={draft.dailyFood} onChange={(v) => patch({ dailyFood: money(v) })} placeholder="0" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Transport (₱ a day)" value={draft.dailyTransport} onChange={(v) => patch({ dailyTransport: money(v) })} placeholder="0" keyboardType="numeric" />
          </View>
        </View>
      </View>

      <View style={styles.note}>
        <Piso size={36} mood="happy" />
        <Text style={styles.noteText}>
          I use these numbers to check whether your income covers your bills and daily needs until your next payday.
        </Text>
      </View>
    </SetupLayout>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", marginBottom: 14 },
  periodChip: { backgroundColor: C.primaryLt, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5 },
  periodText: { fontSize: 12, fontWeight: "600", color: C.primary },
  combined: { backgroundColor: C.primary, borderRadius: 24, padding: 18, marginBottom: 14 },
  combinedLabel: { fontSize: 12, color: "#D3E4FF" },
  combinedValue: { fontSize: 24, fontWeight: "800", color: "#FFF", marginTop: 4 },
  billCard: { backgroundColor: C.surface, borderRadius: 24, padding: 16, marginBottom: 12 },
  billName: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 12 },
  note: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.primaryLt, borderRadius: 22, padding: 14, marginTop: 4 },
  noteText: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 19 },
});
