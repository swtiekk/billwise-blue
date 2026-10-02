import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { Field, Sel, Btn, Toggle } from "../../components/Atoms";
import { CategoryIcon } from "../../components/CategoryIcon";
import { ScreenHeader } from "../../components/ScreenHeader";
import { BottomAction } from "../../components/BottomAction";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { BILL_CATEGORIES, DAY_OPTIONS, dayFromLabel, dayLabel } from "../../constants/options";
import { getBillers, type Biller } from "../../api/billers";
import { categoryFromText } from "../../api/bills";
import { publishBill } from "../../navigation/billBus";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "BillForm">;

const money = (v: string) => v.replace(/[^0-9.]/g, "");
const DAYS_PER_MONTH = 30; // must match DAYS_PER_MONTH in the backend (setup_views.py)

/** A stored daily cost is its monthly equivalent; show the per-day figure again when editing. */
const perDay = (monthly: number) => String(Number((monthly / DAYS_PER_MONTH).toFixed(2)));

/**
 * Enrolls a bill, GCash-style: the biller was already picked, so this only asks for a nickname,
 * a rough monthly cost, and when to be reminded. BillWise only monitors, so there is no account
 * number. Grace period and late penalty come from the biller; the user is never asked.
 */
export default function BillFormModal({ navigation, route }: Props) {
  const editing = route.params?.edit;
  const initial = route.params?.initial;

  const [billerId] = useState<number | null>(editing?.billerId ?? initial?.billerId ?? null);
  const [billers, setBillers] = useState<Biller[]>([]);
  const selected = billers.find((b) => b.biller_id === billerId);
  const hasBiller = billerId != null;

  // With a biller: `name` is the biller's name and `nickname` is optional. Without one: `name` is typed in.
  const [name, setName] = useState(hasBiller ? "" : editing?.name ?? initial?.name ?? "");
  const [nickname, setNickname] = useState("");
  const [category, setCategory] = useState(editing?.category ?? initial?.category ?? "Other");
  const [isDaily, setIsDaily] = useState(editing?.isDaily ?? false);
  const [reminder, setReminder] = useState<number | null>(editing ? editing.reminderDay ?? editing.dueDay : null);
  const minInit = editing && editing.min > 0 ? (editing.isDaily ? perDay(editing.min) : String(editing.min)) : "";
  const maxInit = editing && editing.max > 0 ? (editing.isDaily ? perDay(editing.max) : String(editing.max)) : "";
  const [min, setMin] = useState(minInit);
  const [max, setMax] = useState(maxInit);
  const [error, setError] = useState<string | null>(null);

  // Needed to know the biller's real name when editing: the saved name may be a nickname.
  useEffect(() => {
    if (!hasBiller) return;
    let live = true;
    getBillers()
      .then((list) => {
        if (!live) return;
        setBillers(list);
        const b = list.find((x) => x.biller_id === billerId);
        if (editing && b && editing.name !== b.name) setNickname(editing.name);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const billerName = selected?.name ?? initial?.name ?? editing?.name ?? "";

  const save = () => {
    const finalName = hasBiller ? nickname.trim() || billerName : name.trim();
    if (!finalName) return setError("Enter the bill name.");

    const lo = Number(min);
    const hi = Number(max);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo <= 0 || hi <= 0) return setError("Enter the lowest and highest you usually pay.");
    if (lo > hi) return setError("The lowest amount can't be higher than the highest.");

    if (!isDaily && reminder == null) return setError("Choose which day of the month to be reminded.");

    const day = isDaily ? 1 : (reminder as number); // a daily cost has no day of its own
    publishBill({
      id: editing?.id,
      name: finalName,
      category,
      dueDay: day,
      reminderDay: isDaily ? undefined : day,
      isDaily,
      billerId: billerId ?? undefined,
      // Used only when there is no biller; a biller supplies its own rules on the server.
      graceDays: editing?.graceDays ?? 0,
      hasPenalty: editing?.hasPenalty ?? true,
      min: lo,
      max: hi,
    });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <ScreenHeader title={editing ? "Edit bill" : "Add a bill"} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {hasBiller ? (
          <>
            <View style={[styles.billerCard, sh.sm]}>
              <View style={styles.billerIcon}>
                <CategoryIcon category={categoryFromText(`${category} ${billerName}`)} size={22} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.billerName} numberOfLines={1}>{billerName}</Text>
                <Text style={styles.billerSub}>{category}</Text>
              </View>
            </View>
            <Text style={styles.help}>We'll apply {billerName}'s grace period and late-payment rules for you.</Text>
            <View style={{ height: 16 }} />
            <Field label="Nickname (optional)" value={nickname} onChange={setNickname} placeholder="e.g. Home, Mama's house" />
          </>
        ) : (
          <>
            <Field label="Bill name" value={name} onChange={setName} placeholder="e.g. Water refill, Rent" />
            <View style={{ marginBottom: 16 }}>
              <Sel label="Category" value={category} onChange={setCategory} options={BILL_CATEGORIES} />
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>{isDaily ? "Estimated daily cost" : "Estimated monthly cost"}</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Lowest (₱)" value={min} onChange={(v) => setMin(money(v))} placeholder="e.g. 5000" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Highest (₱)" value={max} onChange={(v) => setMax(money(v))} placeholder="e.g. 8000" keyboardType="numeric" />
          </View>
        </View>
        <Text style={[styles.help, { marginTop: -6, marginBottom: 14 }]}>A rough range is fine. It changes month to month.</Text>

        {!isDaily ? (
          <View style={{ marginBottom: 16 }}>
            <Sel
              label="Remind me every month on"
              value={reminder != null ? dayLabel(reminder) : "Select day"}
              onChange={(v) => setReminder(dayFromLabel(v))}
              options={DAY_OPTIONS}
            />
          </View>
        ) : null}

        <View style={[styles.toggleCard, sh.sm]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.toggleLabel}>This is a daily cost</Text>
            <Text style={styles.toggleSub}>Turn on if you pay it every day, like fare or a daily meal. Electricity and water are monthly.</Text>
          </View>
          <Toggle on={isDaily} onToggle={() => setIsDaily((v) => !v)} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <BottomAction>
        <View style={{ flex: 1 }}>
          <Btn variant="outline" onPress={() => navigation.goBack()}>Cancel</Btn>
        </View>
        <View style={{ flex: 1 }}>
          <Btn onPress={save}>Save</Btn>
        </View>
      </BottomAction>
    </View>
  );
}

const styles = StyleSheet.create({
  billerCard: { backgroundColor: C.surface, borderRadius: 22, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  billerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  billerName: { fontSize: 16, fontWeight: "700", color: C.text },
  billerSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 8 },
  help: { fontSize: 12, color: C.muted, marginTop: 8 },
  toggleCard: { backgroundColor: C.surface, borderRadius: 22, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: C.text },
  toggleSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  error: { color: C.red, fontSize: 13, marginTop: 12 },
});
