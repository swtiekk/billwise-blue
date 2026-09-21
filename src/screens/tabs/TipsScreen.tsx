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
import { amountLabel } from "../../api/bills";
import { Tip, TipKind, buildTips, projectRisk, rangeText, sortByPriority, sumBills } from "../../utils/billInsights";
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
const METER = ["#12A37A", "#F2792B", "#E23D55"];

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
    () => sortByPriority(bills.filter((b) => b.classification === "Deferrable")).reverse(), // lowest priority first
    [bills]
  );

  // every deferrable bill starts ticked; untick one to see how the result changes
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setPicked(Object.fromEntries(deferrable.map((b) => [b.id, true])));
  }, [deferrable]);
  const chosen = deferrable.filter((b) => picked[b.id]);
  const freed = sumBills(chosen);
  const projected = risk && chosen.length > 0 ? STATUS[projectRisk(risk, freed.max)] : null;

  const remaining = risk ? Number(risk.remaining_budget_min) : null;
  const need = risk ? Number(risk.total_daily_need_min) : null;
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

        {/* financial sustainability status */}
        {status && risk ? (
          <View style={[styles.statusCard, { backgroundColor: status.bg }]}>
            <View style={styles.statusHead}>
              <status.Icon size={22} color={status.fg} strokeWidth={2} />
              <Text style={[styles.statusWord, { color: status.fg }]}>{status.label}</Text>
            </View>
            <Text style={[styles.statusSentence, { color: status.fg }]}>
              {fmt(Math.round(remaining ?? 0))} left after bills. Daily costs until payday need about {fmt(Math.round(need ?? 0))}.
            </Text>
            <View style={styles.meter}>
              {METER.map((color, i) => (
                <View key={color} style={[styles.meterSeg, { backgroundColor: color, opacity: i === status.step ? 1 : 0.22 }]} />
              ))}
            </View>
            <View style={styles.meterLabels}>
              <Text style={[styles.meterLabel, { color: status.fg }]}>Stable</Text>
              <Text style={[styles.meterLabel, { color: status.fg }]}>At risk</Text>
              <Text style={[styles.meterLabel, { color: status.fg }]}>Critical</Text>
            </View>
          </View>
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
                </>
              )}
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
  statusCard: { borderRadius: 26, padding: 18, gap: 10 },
  statusHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusWord: { fontSize: 26, fontWeight: "800" },
  statusSentence: { fontSize: 13, lineHeight: 20 },
  meter: { flexDirection: "row", gap: 4, marginTop: 4 },
  meterSeg: { flex: 1, height: 10, borderRadius: 5 },
  meterLabels: { flexDirection: "row", justifyContent: "space-between" },
  meterLabel: { fontSize: 11, fontWeight: "500" },
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
  deferAmount: { fontSize: 14, fontWeight: "700", color: C.text },
  result: { marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E6EEFB", gap: 8 },
  resultLabel: { fontSize: 13, fontWeight: "600", color: C.sub },
  resultPill: { alignSelf: "flex-start", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  resultPillText: { fontSize: 13, fontWeight: "700" },
  hint: { fontSize: 12, color: C.muted, textAlign: "center", marginTop: -4 },
});
