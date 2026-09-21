import React, { useCallback, useMemo } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { Text } from "../../ui/Text";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangle, CalendarClock, CheckCircle2, Info, Lightbulb, RefreshCw, Hourglass } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, HERO_GRADIENT, fmt } from "../../theme";
import { TabBar } from "../../components/TabBar";
import { Btn } from "../../components/Atoms";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { useBills } from "../../hooks/useBills";
import { useRisk, riskDisplay } from "../../hooks/useRisk";
import { useRecommendations } from "../../hooks/useRecommendations";
import { useTabNav } from "../../navigation/useTabNav";
import { amountLabel } from "../../api/bills";
import { Tip, TipKind, buildTips, projectRisk, rangeText, sortByPriority, sumBills } from "../../utils/billInsights";
import { formatShort } from "../../utils/dates";
import type { RiskLabel } from "../../api/types";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Tips">;

// warning = amber, success = green, info = violet
const KIND_STYLE: Record<TipKind, { bg: string; border: string; iconBg: string; color: string }> = {
  warning: { bg: C.amberBg, border: "#FDE68A", iconBg: "#FEF3C7", color: C.amber },
  success: { bg: C.greenBg, border: "#A7F3D0", iconBg: "#D1FAE5", color: C.green },
  info: { bg: C.purpleBg, border: "#E9D5FF", iconBg: "#EDE9FE", color: C.purple },
};

const TIP_ICON = { alert: AlertTriangle, check: CheckCircle2, info: Info, calendar: CalendarClock } as const;

const LABEL_STYLE: Record<RiskLabel, { text: string; bg: string; color: string }> = {
  STABLE: { text: "Stable", bg: C.greenBg, color: C.green },
  "AT RISK": { text: "At Risk", bg: C.amberBg, color: C.amber },
  CRITICAL: { text: "Critical", bg: C.redBg, color: C.red },
};

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

  const rd = riskDisplay(risk);
  const tips = useMemo(() => buildTips(bills, risk), [bills, risk]);

  const showDeferral = !!risk && (recs?.activate_deferral ?? risk.label !== "STABLE");
  const deferrable = useMemo(
    () => sortByPriority(bills.filter((b) => b.classification === "Deferrable")).reverse(), // lowest priority first
    [bills]
  );
  const freed = sumBills(deferrable);
  const projected: RiskLabel | null = risk ? projectRisk(risk, freed.max) : null;

  const remaining = risk ? Number(risk.remaining_budget_min) : null;
  const caption = risk
    ? `${fmt(remaining ?? 0)} left after bills · ${risk.days_until_next_payday} days to payday`
    : "";

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="light" />
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Lightbulb size={20} color="#FDE68A" strokeWidth={1.75} />
          <Text style={styles.heroTitle}>Recommendations</Text>
        </View>
        <Text style={styles.heroSub}>Based on your bills, income and daily expenses</Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Financial sustainability</Text>
          <Text style={[styles.statusValue, { color: rd.color }]}>{rd.label}</Text>
          {caption ? <Text style={styles.statusCaption}>{caption}</Text> : null}
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${rd.pct}%`, backgroundColor: rd.barColor }]} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
            <Text style={styles.trackLabel}>Stable</Text>
            <Text style={styles.trackLabel}>Critical</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} />}
      >
        {riskError ? <Text style={styles.errorText}>{riskError}</Text> : null}

        <View>
          <View style={styles.sectionHeader}>
            <Info size={16} color={C.muted} strokeWidth={1.75} />
            <Text style={styles.sectionTitle}>Bill Recommendations</Text>
          </View>
          <View style={{ gap: 10 }}>
            {tips.map((tip: Tip) => {
              const k = KIND_STYLE[tip.kind];
              const Icon = TIP_ICON[tip.icon];
              return (
                <View key={tip.id} style={[styles.tipCard, { backgroundColor: k.bg, borderColor: k.border }]}>
                  <View style={[styles.tipIcon, { backgroundColor: k.iconBg }]}>
                    <Icon size={18} color={k.color} strokeWidth={1.75} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipDesc}>{tip.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {showDeferral ? (
          <View>
            <View style={styles.sectionHeader}>
              <Hourglass size={16} color={C.muted} strokeWidth={1.75} />
              <Text style={styles.sectionTitle}>Deferral Recommendation</Text>
            </View>
            <View style={[styles.deferCard, sh.sm]}>
              <Text style={styles.deferIntro}>
                {recs?.message ?? "Your remaining budget may not cover daily expenses until payday. Consider deferring the bills below."}
              </Text>

              {deferrable.map((b) => (
                <View key={b.id} style={styles.deferRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deferName} numberOfLines={1}>{b.name}</Text>
                    <Text style={styles.deferSub}>
                      {b.priority ?? "Unclassified"} priority · due {formatShort(b.dueDate)}
                    </Text>
                  </View>
                  <Text style={styles.deferAmount}>{amountLabel(b)}</Text>
                </View>
              ))}

              {deferrable.length > 0 ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Estimated budget freed</Text>
                    <Text style={styles.summaryValue}>{rangeText(freed.min, freed.max)}</Text>
                  </View>
                  {projected ? (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Projected risk after deferral</Text>
                      <View style={[styles.pill, { backgroundColor: LABEL_STYLE[projected].bg }]}>
                        <Text style={[styles.pillText, { color: LABEL_STYLE[projected].color }]}>
                          {LABEL_STYLE[projected].text}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.deferEmpty}>
                  None of your bills can be deferred. Try lowering your daily food or transport costs.
                </Text>
              )}
            </View>
          </View>
        ) : null}

        <Btn onPress={() => navigation.navigate("Analysis")}>Re-run Analysis</Btn>
        <View style={styles.rerunHint}>
          <RefreshCw size={12} color={C.muted} strokeWidth={2} />
          <Text style={styles.rerunHintText}>Re-classifies your bills and recomputes risk, then returns to Home.</Text>
        </View>
      </ScrollView>

      <TabBar active="tips" onChange={goTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24 },
  heroTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  heroSub: { color: "#BFDBFE", fontSize: 13 },
  statusCard: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", marginTop: 16 },
  statusLabel: { color: "#BFDBFE", fontSize: 12, fontWeight: "500" },
  statusValue: { fontSize: 38, fontWeight: "800", marginTop: 2 },
  statusCaption: { color: "#BFDBFE", fontSize: 11, marginTop: 2, marginBottom: 10 },
  track: { height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden", marginTop: 6 },
  fill: { height: "100%", borderRadius: 4 },
  trackLabel: { color: "#BFDBFE", fontSize: 10 },
  errorText: { color: C.red, fontSize: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  tipCard: { borderRadius: 16, padding: 14, flexDirection: "row", gap: 12, borderWidth: 1 },
  tipIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tipTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 2 },
  tipDesc: { fontSize: 12, color: C.sub, lineHeight: 17 },
  deferCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, gap: 10 },
  deferIntro: { fontSize: 12, color: C.sub, lineHeight: 17 },
  deferRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F8FAFC", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  deferName: { fontSize: 13, fontWeight: "600", color: C.text },
  deferSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  deferAmount: { fontSize: 13, fontWeight: "700", color: C.text },
  deferEmpty: { fontSize: 12, color: C.muted, lineHeight: 17 },
  divider: { height: 1, backgroundColor: C.border },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 12, color: C.sub },
  summaryValue: { fontSize: 13, fontWeight: "700", color: C.text },
  pill: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 11, fontWeight: "700" },
  rerunHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: -8 },
  rerunHintText: { fontSize: 11, color: C.muted },
});
