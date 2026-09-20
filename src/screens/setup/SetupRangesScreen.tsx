import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Info } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, fmt } from "../../theme";
import { Field, FL } from "../../components/Atoms";
import { SetupLayout } from "../../components/SetupLayout";
import { useSetup, combinedIncome } from "../../context/SetupContext";
import { useSession } from "../../context/SessionContext";
import { bandFor } from "../../constants/options";
import { buildSetupPayload, submitSetup } from "../../api/setup";
import { errorMessage } from "../../api/client";
import { monthYear } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "SetupRanges">;

const money = (v: string) => v.replace(/[^0-9.]/g, "");

export default function SetupRangesScreen({ navigation }: Props) {
  const { draft, patch, updateBill, reset } = useSetup();
  const { setUser } = useSession();
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
      await submitSetup(buildSetupPayload(draft));
      reset();
      setUser((u) => (u ? { ...u, setupCompleted: true } : u));
      // reset() so the back button can't return to the setup screens
      navigation.reset({ index: 0, routes: [{ name: "Analysis" }] });
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  };

  return (
    <SetupLayout
      step={4}
      title="Budget Ranges"
      subtitle="Set a minimum and maximum you expect to pay for each bill."
      onBack={() => navigation.goBack()}
      onNext={submit}
      nextLabel={loading ? "Submitting…" : "Submit Setup"}
      error={error}
    >
      <View style={styles.periodRow}>
        <View style={styles.periodChip}>
          <Text style={styles.periodText}>{firstPayday ? monthYear(firstPayday) : "Budget period"}</Text>
        </View>
      </View>

      <View style={styles.combinedCard}>
        <Text style={styles.combinedLabel}>COMBINED INCOME</Text>
        <Text style={styles.combinedValue}>
          {combined.max === 0 ? "—" : `${fmt(combined.min)} – ${fmt(combined.max)}`}
        </Text>
      </View>

      {draft.bills.map((b) => (
        <View key={b.id} style={{ marginBottom: 4 }}>
          <Text style={styles.billName}>{b.name}</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Min Amount (₱)" value={b.min} onChange={(v) => updateBill(b.id, { min: money(v) })} placeholder="0" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Max Amount (₱)" value={b.max} onChange={(v) => updateBill(b.id, { max: money(v) })} placeholder="0" keyboardType="numeric" />
            </View>
          </View>
        </View>
      ))}

      <FL>Daily Expenses</FL>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Food (₱ / day)" value={draft.dailyFood} onChange={(v) => patch({ dailyFood: money(v) })} placeholder="0" keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Transport (₱ / day)" value={draft.dailyTransport} onChange={(v) => patch({ dailyTransport: money(v) })} placeholder="0" keyboardType="numeric" />
        </View>
      </View>

      <View style={styles.note}>
        <Info size={16} color={C.primary} strokeWidth={1.75} />
        <Text style={styles.noteText}>
          We use these numbers to check whether your income covers your bills and daily needs until your next payday.
        </Text>
      </View>
    </SetupLayout>
  );
}

const styles = StyleSheet.create({
  periodRow: { flexDirection: "row", marginBottom: 14 },
  periodChip: { backgroundColor: C.primaryLt, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  periodText: { fontSize: 12, fontWeight: "600", color: C.primary },
  combinedCard: { backgroundColor: C.primaryLt, borderRadius: 16, padding: 16, marginBottom: 20 },
  combinedLabel: { fontSize: 11, fontWeight: "600", color: C.sub, letterSpacing: 0.5 },
  combinedValue: { fontSize: 20, fontWeight: "700", color: C.primaryDk, marginTop: 4 },
  billName: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 8 },
  note: { flexDirection: "row", gap: 10, backgroundColor: C.primaryLt, borderRadius: 12, padding: 12, marginTop: 4, marginBottom: 8 },
  noteText: { flex: 1, fontSize: 12, color: C.sub, lineHeight: 17 },
});
