import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Pressable, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AlertTriangle, CalendarClock, CheckCircle2, Info, Check } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, fmt } from "../../theme";
import { Text } from "../../ui/Text";
import { TabBar } from "../../components/TabBar";
import { Btn } from "../../components/Atoms";
import { Piso } from "../../components/Piso";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { useBills } from "../../hooks/useBills";
import { useRisk } from "../../hooks/useRisk";
import { useRecommendations } from "../../hooks/useRecommendations";
import { useTabNav } from "../../navigation/useTabNav";
import { setBillDeferred } from "../../api/edit";
import { errorMessage } from "../../api/client";
import { amountLabel } from "../../api/bills";
import { Tip, TipKind, buildTips, projectRisk, rangeText, sortByPriority, sumBills } from "../../utils/billInsights";
import { priorityReasons } from "../../utils/priorityReasons";
import { STATUS } from "../../utils/statusStyle";
import { formatShort } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Tips">;

// warning = orange, success = green, info = violet (as in your flow)
const KIND_STYLE: Record<TipKind, { bg: string; iconBg: string; color: string }> = {
  warning: { bg: C.amberBg, iconBg: "#FFD9B8", color: "#9A4308" },
  success: { bg: C.greenBg, iconBg: "#B4EAD6", color: "#0B6B53" },
  info: { bg: C.purpleBg, iconBg: "#E0D6FF", color: C.purple },
};

const TIP_ICON = { alert: AlertTriangle, check: CheckCircle2, info: Info, calendar: CalendarClock } as const;
/** Solid color for the status pill. */
const SOLID = { STABLE: C.green, "AT RISK": C.amber, CRITICAL: C.red } as const;

/** Where the pay goes. Uses the lower end of income, the same numbers the risk label uses, so they always agree. */
function payBreakdown(risk: NonNullable<ReturnType<typeof useRisk>["risk"]>) {
  const remaining = Number(risk.remaining_budget_min); // income (low) minus bills (high)
  const bills = Number(risk.total_bill_allocations);
  const daily = Number(risk.total_daily_need_min); // food and fare until payday
  return { bills, daily, left: remaining - daily };
}

/** One short line on why a bill can wait (its first "ease" reason). */
const whyItCanWait = (b: Parameters<typeof priorityReasons>[0]) => priorityReasons(b).find((r) => r.tone === "ease")?.text ?? null;

export default function TipsScreen({ navigation }: Props) {
  const goTab = useTabNav();
  const { bills, loading, refresh: refreshBills } = useBills();
  const { risk, error: riskError, refresh: refreshRisk } = useRisk();
  const { recs, refresh: refreshRecs } = useRecommendations();

  useFocusEffect(
    useCallback(() => {
      refreshBills();
      refreshRisk();
      refreshRecs();
    }, [refreshBills, refreshRisk, refreshRecs])
  );

  const refreshAll = useCallback(() => {
    refreshBills();
    refreshRisk();
    refreshRecs();
  }, [refreshBills, refreshRisk, refreshRecs]);

  const tips = useMemo(() => buildTips(bills, risk), [bills, risk]);
  const status = risk ? STATUS[risk.label] : null;

  const showDeferral = !!risk && (recs?.activate_deferral ?? risk.label !== "STABLE");
  const deferrable = useMemo(
    () => sortByPriority(bills.filter((b) => b.classification === "Deferrable" && b.status !== "paid" && !b.isDeferred)).reverse(), // lowest priority first
    [bills]
  );

  // every deferrable bill starts ticked; untick one to see how the result changes
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setPicked(Object.fromEntries(deferrable.map((b) => [b.id, true])));
  }, [deferrable]);
  const moved = useMemo(() => bills.filter((b) => b.isDeferred && b.status !== "paid"), [bills]);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const moveBills = async (list: typeof bills, deferred: boolean) => {
    setMoving(true);
    setMoveError(null);
    try {
      await Promise.all(list.map((b) => setBillDeferred(b.id, deferred)));
      refreshAll();
    } catch (e) {
      setMoveError(errorMessage(e));
    } finally {
      setMoving(false);
    }
  };

  const chosen = deferrable.filter((b) => picked[b.id]);
  const freed = sumBills(chosen);
  const projected = risk && chosen.length > 0 ? STATUS[projectRisk(risk, freed.max)] : null;

  const dateText = risk?.next_payday ? formatShort(risk.next_payday) : "payday";

  const bubble = !risk
    ? "Let me check your budget…"
    : risk.label === "STABLE"
    ? `You're covered until ${dateText}. Nice work!`
    : risk.label === "AT RISK"
    ? `Tight until ${dateText}. Let's move some bills to next time.`
    : `It's critical until ${dateText}. Let's free up some cash.`;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} />}
      >
        <View style={styles.chat}>
          <Piso size={60} mood={status?.mood ?? "happy"} />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{bubble}</Text>
          </View>
        </View>

        {riskError ? <Text style={styles.errorText}>{riskError}</Text> : null}

        {/* where the pay goes */}
        {status && risk ? (
          (() => {
            const { bills: billsAmt, daily, left } = payBreakdown(risk);
            const short = left < 0;
            const segs = [
              { key: "bills", label: "Bills", value: billsAmt, color: C.primary },
              { key: "daily", label: "Food and fare until payday", value: daily, color: "#5B9BFF" },
              { key: "left", label: "Left over", value: Math.max(left, 0), color: "#FFC533" },
            ];
            const total = segs.reduce((sum, x) => sum + x.value, 0);
            return (
              <View style={[styles.payCard, sh.sm]}>
                <View style={styles.payHead}>
                  <Text style={styles.payTitle}>Where your pay goes</Text>
                  <View style={[styles.payPill, { backgroundColor: SOLID[risk.label] }]}>
                    <Text style={styles.payPillText}>{status.label}</Text>
                  </View>
                </View>
                {total > 0 ? (
                  <View style={styles.payBar}>
                    {segs.filter((x) => x.value > 0).map((x) => (
                      <View key={x.key} style={{ flex: x.value, backgroundColor: x.color }} />
                    ))}
                  </View>
                ) : null}
                {segs.map((x) => (
                  <View key={x.key} style={styles.payRow}>
                    <View style={[styles.dot, { backgroundColor: x.color }]} />
                    <Text style={styles.payLabel}>{x.key === "left" && short ? "Short by" : x.label}</Text>
                    <Text style={[styles.payValue, x.key === "left" && short && { color: C.red }]}>
                      {x.key === "left" && short ? fmt(Math.round(-left)) : fmt(Math.round(x.value))}
                    </Text>
                  </View>
                ))}
                <Text style={styles.payNote}>Based on the lower end of your income, to stay on the safe side.</Text>
              </View>
            );
          })()
        ) : null}

        {/* bill recommendations */}
        <Text style={styles.sectionTitle}>What I noticed</Text>
        <View style={{ gap: 10 }}>
          {tips.map((tip: Tip) => {
            const k = KIND_STYLE[tip.kind];
            const Icon = TIP_ICON[tip.icon];
            return (
              <View key={tip.id} style={[styles.tipCard, { backgroundColor: k.bg }]}>
                <View style={[styles.tipIcon, { backgroundColor: k.iconBg }]}>
                  <Icon size={18} color={k.color} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tipTitle, { color: k.color }]}>{tip.title}</Text>
                  <Text style={styles.tipDesc}>{tip.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* deferral recommendation */}
        {showDeferral ? (
          <>
            <Text style={styles.sectionTitle}>Move these to next time</Text>
            <View style={[styles.deferCard, sh.sm]}>
              {deferrable.length === 0 ? (
                <Text style={styles.deferEmpty}>
                  None of your bills can wait. Try lowering your daily food or transport costs.
                </Text>
              ) : (
                <>
                  {deferrable.map((b) => {
                    const on = !!picked[b.id];
                    return (
                      <Pressable key={b.id} onPress={() => setPicked((p) => ({ ...p, [b.id]: !p[b.id] }))} style={styles.deferRow}>
                        <View style={[styles.check, on && styles.checkOn]}>
                          {on ? <Check size={14} color="#FFF" strokeWidth={3} /> : null}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.deferName} numberOfLines={1}>{b.name}</Text>
                          <Text style={styles.deferSub}>{b.priority ?? "Unranked"} priority, due {formatShort(b.dueDate)}</Text>
                          {whyItCanWait(b) ? <Text style={styles.deferWhy}>Can wait: {whyItCanWait(b)}</Text> : null}
                        </View>
                        <Text style={styles.deferAmount}>{amountLabel(b)}</Text>
                      </Pressable>
                    );
                  })}

                  <View style={styles.result}>
                    <Text style={styles.resultLabel}>
                      {chosen.length ? `Frees up ${rangeText(freed.min, freed.max)}` : "Tick a bill to see what changes"}
                    </Text>
                    {projected ? (
                      <View style={[styles.resultPill, { backgroundColor: projected.bg }]}>
                        <Text style={[styles.resultPillText, { color: projected.fg }]}>Then you'd be {projected.label}</Text>
                      </View>
                    ) : null}
                  </View>
                  {chosen.length > 0 ? (
                    <View style={{ marginTop: 12 }}>
                      <Btn onPress={moving ? () => {} : () => moveBills(chosen, true)}>{moving ? "Moving…" : "Move to next period"}</Btn>
                      <Text style={styles.moveHint}>You'll pay these after payday. Their real due dates don't change.</Text>
                    </View>
                  ) : null}
                  {moveError ? <Text style={styles.errorText}>{moveError}</Text> : null}
                </>
              )}
            </View>
          </>
        ) : null}

        {moved.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Moved to next period</Text>
            <View style={[styles.deferCard, sh.sm]}>
              {moved.map((b) => (
                <View key={b.id} style={styles.deferRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deferName} numberOfLines={1}>{b.name}</Text>
                    <Text style={styles.deferSub}>Pay after payday · {amountLabel(b)}</Text>
                  </View>
                  <Pressable onPress={moving ? undefined : () => moveBills([b], false)} hitSlop={8}>
                    <Text style={styles.undo}>Undo</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Btn onPress={() => navigation.navigate("Analysis")}>Re-run analysis</Btn>
        <Text style={styles.hint}>Re-ranks your bills and checks your budget again, then goes back to Home.</Text>
      </ScrollView>

      <TabBar active="tips" onChange={goTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, gap: 14 },
  chat: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  bubble: { flex: 1, backgroundColor: C.surface, borderRadius: 22, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 13 },
  bubbleText: { fontSize: 15, fontWeight: "600", color: C.text, lineHeight: 22 },
  errorText: { color: C.red, fontSize: 12 },
  payCard: { backgroundColor: C.surface, borderRadius: 26, padding: 18, gap: 10 },
  payHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  payTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  payPill: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
  payPillText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  payBar: { flexDirection: "row", height: 14, borderRadius: 7, overflow: "hidden", gap: 2 },
  payRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  payLabel: { flex: 1, fontSize: 13, color: C.sub },
  payValue: { fontSize: 14, fontWeight: "700", color: C.text },
  payNote: { fontSize: 11, color: C.muted, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginTop: 6 },
  tipCard: { borderRadius: 22, padding: 14, flexDirection: "row", gap: 12 },
  tipIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  tipTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  tipDesc: { fontSize: 13, color: C.sub, lineHeight: 19 },
  deferCard: { backgroundColor: C.surface, borderRadius: 24, padding: 14, gap: 4 },
  deferEmpty: { fontSize: 13, color: C.sub, lineHeight: 20 },
  deferRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#B9D0F5", alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: C.primary, borderColor: C.primary },
  deferName: { fontSize: 14, fontWeight: "600", color: C.text },
  deferSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  moveHint: { fontSize: 11, color: C.muted, textAlign: "center", marginTop: 8 },
  undo: { fontSize: 13, fontWeight: "700", color: C.primary },
  deferWhy: { fontSize: 11, color: C.green, marginTop: 2 },
  deferAmount: { fontSize: 14, fontWeight: "700", color: C.text },
  result: { marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E6EEFB", gap: 8 },
  resultLabel: { fontSize: 13, fontWeight: "600", color: C.sub },
  resultPill: { alignSelf: "flex-start", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  resultPillText: { fontSize: 13, fontWeight: "700" },
  hint: { fontSize: 12, color: C.muted, textAlign: "center", marginTop: -4 },
});
