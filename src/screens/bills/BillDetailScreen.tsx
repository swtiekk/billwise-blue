import React, { useCallback, useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Check, Clock } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, fmt } from "../../theme";
import { Text } from "../../ui/Text";
import { Btn } from "../../components/Atoms";
import { CategoryIcon } from "../../components/CategoryIcon";
import { PriorityChip, PRIORITY_STYLE } from "../../components/PriorityChip";
import { ScreenHeader } from "../../components/ScreenHeader";
import { BottomAction } from "../../components/BottomAction";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { useBills } from "../../hooks/useBills";
import { amountLabel } from "../../api/bills";
import { setBillPaid, setBillDeferred } from "../../api/edit";
import { errorMessage } from "../../api/client";
import { BILL_CATEGORIES, dayLabel } from "../../constants/options";
import { STATUS_CONFIG } from "../../data";
import { formatLong } from "../../utils/dates";
import { priorityReasons } from "../../utils/priorityReasons";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "BillDetail">;

const perDay = (monthly: number) => Math.round(monthly / 30); // a daily cost is stored as its monthly equivalent (x30)
const WHY = { High: "Why pay this first", Medium: "Why this comes next", Low: "Why this can wait" } as const;

export default function BillDetailScreen({ navigation, route }: Props) {
  const { bills, loaded, refresh } = useBills();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const bill = bills.find((b) => b.id === route.params.id);

  if (!bill) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <FocusedStatusBar style="dark" />
        <ScreenHeader title="Bill" onBack={() => navigation.goBack()} />
        <Text style={styles.missing}>{loaded ? "This bill isn't here anymore." : "Loading…"}</Text>
      </View>
    );
  }

  const paid = bill.status === "paid";
  const st = STATUS_CONFIG[bill.status];
  const scanned = bill.amount != null && !bill.isDaily;
  const rangeOpen = bill.amountMax > bill.amountMin;
  const reasons = bill.priority ? priorityReasons(bill) : [];
  const group = bill.priority ? PRIORITY_STYLE[bill.priority] : null;

  // where the scanned amount sits inside the estimate
  let compare: { pct: number; text: string; color: string } | null = null;
  if (scanned && rangeOpen) {
    const a = bill.amount as number;
    const pct = Math.max(0, Math.min(1, (a - bill.amountMin) / (bill.amountMax - bill.amountMin)));
    compare =
      a > bill.amountMax
        ? { pct: 1, text: `${fmt(a - bill.amountMax)} over your estimate`, color: C.red }
        : a < bill.amountMin
          ? { pct: 0, text: `${fmt(bill.amountMin - a)} under your estimate`, color: C.green }
          : { pct, text: "Within your estimate", color: C.green };
  }

  const togglePaid = async () => {
    setBusy(true);
    setError(null);
    try {
      await setBillPaid(bill.id, !paid);
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const canMove = bill.classification === "Deferrable" && !paid && !bill.isDaily;
  const toggleMove = async () => {
    setBusy(true);
    setError(null);
    try {
      await setBillDeferred(bill.id, !bill.isDeferred);
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const edit = () =>
    navigation.navigate("BillForm", {
      persist: true,
      edit: {
        id: bill.id,
        name: bill.name,
        category: BILL_CATEGORIES.includes(bill.categoryDesc) ? bill.categoryDesc : "Other",
        dueDay: bill.dueDay ?? (bill.dueDate ? Number(bill.dueDate.slice(8, 10)) : 1),
        graceDays: bill.graceDays,
        hasPenalty: bill.hasPenalty,
        billerId: bill.billerId,
        reminderDay: bill.reminderDay,
        isDaily: bill.isDaily,
        min: bill.amountMin,
        max: bill.amountMax,
      },
    });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <ScreenHeader title={bill.name} subtitle={bill.categoryDesc} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* amount */}
        <View style={[styles.card, sh.sm]}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <CategoryIcon category={bill.category} size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.small}>
                {bill.isDaily ? "Estimated daily cost" : scanned ? "This month's bill" : "Estimated bill"}
              </Text>
              <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
                {bill.isDaily
                  ? `${fmt(perDay(bill.amountMin))}${bill.amountMin === bill.amountMax ? "" : ` – ${fmt(perDay(bill.amountMax))}`}`
                  : scanned
                    ? fmt(bill.amount as number)
                    : amountLabel(bill)}
              </Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
            </View>
          </View>

          {compare ? (
            <>
              <Text style={[styles.small, { marginTop: 14 }]}>Your estimate: {amountLabel(bill)}</Text>
              <View style={styles.trackWrap}>
                <View style={styles.track} />
                <View style={[styles.marker, { left: `${compare.pct * 100}%`, backgroundColor: compare.color === C.red ? C.red : C.primary }]} />
              </View>
              <Text style={[styles.compare, { color: compare.color }]}>{compare.text}</Text>
            </>
          ) : !scanned && !bill.isDaily ? (
            <Text style={[styles.small, { marginTop: 12 }]}>Scan the bill when it arrives to replace the estimate with the real amount.</Text>
          ) : null}
        </View>

        {/* priority and why */}
        {bill.priority && group ? (
          <View style={[styles.card, sh.sm]}>
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <PriorityChip priority={bill.priority} />
              <Text style={[styles.group, { color: group.fg }]}>{group.group}</Text>
            </View>
            <Text style={styles.why}>{WHY[bill.priority]}</Text>
            {reasons.map((r, i) => (
              <View key={i} style={styles.reason}>
                {r.tone === "ease" ? (
                  <Check size={16} color={C.green} strokeWidth={2.4} />
                ) : (
                  <Clock size={16} color={group.fg} strokeWidth={2.2} />
                )}
                <Text style={styles.reasonText}>{r.text}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* can this bill wait? */}
        {canMove ? (
          <View style={[styles.card, sh.sm]}>
            <Text style={styles.why}>{bill.isDeferred ? "Moved to after payday" : "This bill can wait"}</Text>
            <Text style={styles.moveText}>
              {bill.isDeferred
                ? "You plan to pay it after your next payday. It no longer counts against your money before then. Its real due date hasn't changed."
                : "You can plan to pay it after your next payday to free up money now. Its real due date doesn't change."}
            </Text>
            <View style={{ marginTop: 12 }}>
              <Btn variant={bill.isDeferred ? "outline" : "primary"} onPress={busy ? () => {} : toggleMove}>
                {busy ? "Saving…" : bill.isDeferred ? "Undo move" : "Move to next period"}
              </Btn>
            </View>
          </View>
        ) : null}

        {/* details */}
        <View style={[styles.card, sh.sm]}>
          <Detail label="Due date" value={bill.isDaily ? "Every day" : bill.dueDate ? formatLong(bill.dueDate) : "—"} />
          <Detail label="Remind me" value={bill.reminderDay ? `Every month on the ${dayLabel(bill.reminderDay)}` : "—"} />
          <Detail label="Category" value={bill.categoryDesc} last />
        </View>

        <Pressable onPress={edit} style={{ alignSelf: "center", padding: 8 }}>
          <Text style={styles.edit}>Edit bill</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <BottomAction>
        <View style={{ flex: 1, gap: 10 }}>
          {!paid && !bill.isDaily ? (
            <Btn onPress={() => navigation.navigate("ScanBill", { forBillId: bill.id, persist: true })}>
              Scan this month's bill
            </Btn>
          ) : null}
          {!bill.isDaily ? (
            <Btn variant={paid ? "primary" : "outline"} onPress={busy ? () => {} : togglePaid}>
              {busy ? "Saving…" : paid ? "Mark as unpaid" : "Mark as paid"}
            </Btn>
          ) : null}
        </View>
      </BottomAction>
    </View>
  );
}

function Detail({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detail, !last && styles.detailLine]}>
      <Text style={styles.small}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14 },
  missing: { textAlign: "center", color: C.muted, marginTop: 40 },
  card: { backgroundColor: C.surface, borderRadius: 24, padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  small: { fontSize: 12, color: C.muted },
  amount: { fontSize: 26, fontWeight: "800", color: C.text, marginTop: 1 },
  statusChip: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "600" },
  trackWrap: { height: 18, justifyContent: "center", marginTop: 8 },
  track: { height: 8, borderRadius: 99, backgroundColor: C.primaryLt },
  marker: { position: "absolute", width: 18, height: 18, borderRadius: 9, marginLeft: -9, borderWidth: 3, borderColor: "#FFF" },
  compare: { fontSize: 12, fontWeight: "600", marginTop: 6 },
  group: { fontSize: 13, fontWeight: "700" },
  why: { fontSize: 14, fontWeight: "700", color: C.text, marginTop: 14, marginBottom: 6 },
  reason: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 },
  reasonText: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 18 },
  detail: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11 },
  detailLine: { borderBottomWidth: 1, borderBottomColor: "#EEF3FC" },
  detailValue: { fontSize: 13, fontWeight: "600", color: C.text, flexShrink: 1, textAlign: "right", marginLeft: 12 },
  moveText: { fontSize: 13, color: C.sub, lineHeight: 19 },
  edit: { fontSize: 14, fontWeight: "600", color: C.primary },
  error: { color: C.red, fontSize: 12, textAlign: "center" },
});
