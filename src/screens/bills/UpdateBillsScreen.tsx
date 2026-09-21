import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Pressable, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { Text } from "../../ui/Text";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Info, ScanLine } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, fmt } from "../../theme";
import { Field, Btn } from "../../components/Atoms";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { useBills } from "../../hooks/useBills";
import { BudgetBill, amountLabel } from "../../api/bills";
import { updateBillAmounts } from "../../api/edit";
import { errorMessage } from "../../api/client";
import { subscribeAmount } from "../../navigation/billBus";
import { sortByPriority } from "../../utils/billInsights";
import { monthYear, toISO } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "UpdateBills">;

const money = (v: string) => v.replace(/[^0-9.]/g, "");

/** The amount this bill was last set to: the actual amount if there is one, else the estimate. */
const currentAmount = (b: BudgetBill) => b.amount ?? b.amountMax;

export default function UpdateBillsScreen({ navigation }: Props) {
  const { bills, loading, error, refresh } = useBills();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // "Scan New Bill" sends the scanned amount back here for that one bill.
  useEffect(() => subscribeAmount((id, amount) => setValues((v) => ({ ...v, [id]: String(amount) }))), []);

  const ranked = useMemo(() => sortByPriority(bills), [bills]);
  const entered = (b: BudgetBill) => Number(values[b.id]) > 0;
  const updatedCount = ranked.filter(entered).length;
  const total = ranked.reduce((sum, b) => sum + (entered(b) ? Number(values[b.id]) : currentAmount(b)), 0);
  const periodISO = ranked.find((b) => b.dueDate)?.dueDate ?? toISO(new Date());

  const submit = async () => {
    if (saving) return;
    const items = ranked.filter(entered).map((b) => ({ id: b.id, amount: Number(values[b.id]) }));
    if (items.length === 0) {
      setFormError("Enter at least one new amount.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await updateBillAmounts(items);
      navigation.reset({ index: 0, routes: [{ name: "Analysis" }] }); // Loading -> Home with updated results
    } catch (e) {
      setFormError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={18} color={C.primaryDk} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Update This Period's Bills</Text>
          <Text style={styles.headerSub}>{monthYear(periodISO)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* progress tracker */}
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>{updatedCount} of {ranked.length} updated</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${ranked.length ? (updatedCount / ranked.length) * 100 : 0}%` }]} />
          </View>
        </View>

        <View style={styles.banner}>
          <Info size={16} color={C.primary} strokeWidth={1.75} />
          <Text style={styles.bannerText}>
            Enter this period's amount for each bill, or scan the new bill. Leave a bill blank to keep its current amount.
          </Text>
        </View>

        {ranked.map((b) => (
          <View key={b.id} style={[styles.card, sh.sm]}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name} numberOfLines={1}>{b.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <View style={styles.catTag}>
                    <Text style={styles.catText}>{b.categoryDesc}</Text>
                  </View>
                  <View style={styles.lastChip}>
                    <Text style={styles.lastText}>
                      {b.amount != null ? `Last: ${fmt(b.amount)}` : `Estimate: ${amountLabel(b)}`}
                    </Text>
                  </View>
                </View>
              </View>
              <Pressable
                onPress={() => navigation.navigate("ScanBill", { forBillId: b.id })}
                style={({ pressed }) => [styles.scanBtn, pressed && { opacity: 0.85 }]}
              >
                <ScanLine size={13} color={C.primary} strokeWidth={2} />
                <Text style={styles.scanText}>Scan New Bill</Text>
              </Pressable>
            </View>
            <View style={{ marginTop: 12 }}>
              <Field
                label="This period's amount (₱)"
                value={values[b.id] ?? ""}
                onChange={(v) => setValues((prev) => ({ ...prev, [b.id]: money(v) }))}
                placeholder={String(currentAmount(b))}
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}

        {ranked.length === 0 && !loading ? (
          <Text style={styles.empty}>You have no bills yet. Add them in Edit Budget Items.</Text>
        ) : null}

        {/* period summary */}
        {ranked.length > 0 ? (
          <View style={[styles.summary, sh.sm]}>
            <Text style={styles.summaryTitle}>Period Summary</Text>
            {ranked.map((b) => (
              <View key={b.id} style={styles.summaryRow}>
                <Text style={styles.summaryName} numberOfLines={1}>{b.name}</Text>
                <Text style={[styles.summaryAmount, entered(b) && { color: C.primary }]}>
                  {fmt(entered(b) ? Number(values[b.id]) : currentAmount(b))}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{fmt(total)}</Text>
            </View>
          </View>
        ) : null}

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        <Btn onPress={submit}>{saving ? "Updating…" : "Update and Re-run Analysis"}</Btn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: C.surface, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  headerSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  errorText: { color: C.red, fontSize: 12 },
  progressLabel: { fontSize: 11, fontWeight: "600", color: C.muted, letterSpacing: 0.5 },
  progressValue: { fontSize: 12, fontWeight: "700", color: C.primary },
  track: { height: 8, backgroundColor: "#E2E8F0", borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: C.primary, borderRadius: 4 },
  banner: { flexDirection: "row", gap: 10, backgroundColor: C.primaryLt, borderRadius: 12, padding: 12 },
  bannerText: { flex: 1, fontSize: 12, color: C.sub, lineHeight: 17 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 14 },
  name: { fontSize: 14, fontWeight: "700", color: C.text },
  catTag: { backgroundColor: C.primaryLt, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1 },
  catText: { fontSize: 10, fontWeight: "600", color: C.primary },
  lastChip: { backgroundColor: "#F1F5F9", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1 },
  lastText: { fontSize: 10, fontWeight: "600", color: C.sub },
  scanBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.primaryLt, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  scanText: { fontSize: 11, fontWeight: "700", color: C.primary },
  empty: { fontSize: 12, color: C.muted, textAlign: "center", paddingVertical: 24 },
  summary: { backgroundColor: C.surface, borderRadius: 16, padding: 16, gap: 8 },
  summaryTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  summaryName: { flex: 1, fontSize: 12, color: C.sub },
  summaryAmount: { fontSize: 12, fontWeight: "600", color: C.text },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  totalLabel: { fontSize: 13, fontWeight: "700", color: C.text },
  totalValue: { fontSize: 15, fontWeight: "700", color: C.primaryDk },
});
