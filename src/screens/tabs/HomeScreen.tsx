import React, { useCallback } from "react";
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Sun, Bell, CalendarClock, Wallet, Star } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, HERO_GRADIENT, fmt } from "../../theme";
import { TabBar } from "../../components/TabBar";
import { BillCard } from "../../components/BillCard";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { useBills } from "../../hooks/useBills";
import { useRisk, riskDisplay } from "../../hooks/useRisk";
import { useSession } from "../../context/SessionContext";
import { useTabNav } from "../../navigation/useTabNav";
import { formatShort } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useSession();
  const goTab = useTabNav();
  const { bills, loading, error, refresh: refreshBills } = useBills();
  const { risk, error: riskError, refresh: refreshRisk } = useRisk();

  // Reload every time Home comes into focus (after setup, after returning from another tab).
  useFocusEffect(
    useCallback(() => {
      refreshBills();
      refreshRisk();
    }, [refreshBills, refreshRisk])
  );

  const refreshAll = useCallback(() => {
    refreshBills();
    refreshRisk();
  }, [refreshBills, refreshRisk]);

  const rd = riskDisplay(risk);
  const priorityBills = bills.filter((b) => b.priority === "High");
  const alertCount = bills.filter((b) => b.status === "overdue" || b.status === "due-soon").length;

  const remainingMin = risk ? Number(risk.remaining_budget_min) : null;
  const remainingMax = risk ? Number(risk.remaining_budget_max) : null;
  const income = risk ? Number(risk.combined_income) : 0;
  const remainingPct = remainingMin != null && income > 0 ? Math.max(0, Math.min(1, remainingMin / income)) : 0;

  const days = risk?.days_until_next_payday;
  const daysText = days == null ? "—" : days === 1 ? "1 day" : `${days} days`;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="light" />
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Text style={styles.name}>{user?.firstName ?? "there"}!</Text>
              <Sun size={18} color="#FDE68A" strokeWidth={1.75} />
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate("Notifications")} style={({ pressed }) => [styles.bellWrap, pressed && { opacity: 0.7 }]}>
            <Bell size={20} color="#FFF" strokeWidth={1.75} />
            {alertCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{alertCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.riskCard}>
          <Text style={styles.riskLabel}>FINANCIAL RISK STATUS</Text>
          <Text style={[styles.riskScore, { color: rd.color }]}>{rd.label}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${rd.pct}%`, backgroundColor: rd.barColor }]} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
            <Text style={styles.progressLabel}>Stable</Text>
            <Text style={styles.progressLabel}>Critical</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} />}
      >
        {error || riskError ? <Text style={styles.errorText}>{error ?? riskError}</Text> : null}

        <View style={[styles.infoCard, sh.sm]}>
          <View style={styles.infoIcon}>
            <CalendarClock size={20} color={C.primary} strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>PAYDAY COUNTDOWN</Text>
            <Text style={styles.infoValue}>{daysText}</Text>
            <Text style={styles.infoSub}>
              until next payday{risk?.next_payday ? ` · ${formatShort(risk.next_payday)}` : ""}
            </Text>
          </View>
        </View>

        <View style={[styles.budgetCard, sh.sm]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={styles.infoIcon}>
              <Wallet size={20} color={C.primary} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>ESTIMATED REMAINING BUDGET</Text>
              <Text style={[styles.infoValue, remainingMin != null && remainingMin < 0 && { color: C.red }]}>
                {remainingMin == null ? "—" : fmt(remainingMin)}
              </Text>
            </View>
          </View>
          <View style={styles.budgetTrack}>
            <View style={[styles.budgetFill, { width: `${remainingPct * 100}%`, backgroundColor: rd.barColor }]} />
          </View>
          <Text style={styles.infoSub}>
            {remainingMin == null || remainingMax == null
              ? "Calculating…"
              : `Between ${fmt(remainingMin)} and ${fmt(remainingMax)} after bills`}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Star size={16} color={C.amber} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Priority Bills This Period</Text>
          </View>
          <Pressable onPress={() => goTab("budget")}>
            <Text style={styles.seeAll}>View All Bills</Text>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          {priorityBills.map((b) => (
            <BillCard key={b.id} bill={b} onPress={() => goTab("budget")} />
          ))}
          {priorityBills.length === 0 && !loading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No high-priority bills</Text>
              <Text style={styles.emptySub}>Bills marked High priority will show up here.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <TabBar active="home" onChange={goTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24, position: "relative", overflow: "hidden" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { color: "#BFDBFE", fontSize: 12, fontWeight: "500" },
  name: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  bellWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  bellBadge: { position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: "#E11D48", alignItems: "center", justifyContent: "center" },
  bellBadgeText: { color: "#FFF", fontSize: 9, fontWeight: "700" },
  riskCard: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  riskLabel: { color: "#BFDBFE", fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  riskScore: { fontSize: 28, fontWeight: "800", marginTop: 2, marginBottom: 12 },
  progressTrack: { height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabel: { color: "#BFDBFE", fontSize: 10 },
  errorText: { color: C.red, fontSize: 12 },
  infoCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  budgetCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, gap: 12 },
  infoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 10, fontWeight: "600", color: C.muted, letterSpacing: 0.5 },
  infoValue: { fontSize: 22, fontWeight: "700", color: C.text, marginTop: 2 },
  infoSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  budgetTrack: { height: 8, backgroundColor: "#E2E8F0", borderRadius: 4, overflow: "hidden" },
  budgetFill: { height: "100%", borderRadius: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  seeAll: { fontSize: 12, color: C.primary, fontWeight: "600" },
  emptyCard: { backgroundColor: C.surface, borderRadius: 16, paddingVertical: 24, alignItems: "center" },
  emptyTitle: { fontSize: 13, fontWeight: "600", color: C.sub },
  emptySub: { fontSize: 11, color: C.muted, marginTop: 2 },
});
