import React, { useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Sun, Bell, Star } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, HERO_GRADIENT, fmt } from "../../theme";
import { GOLD } from "../../brand";
import { TabBar } from "../../components/TabBar";
import { BillCard } from "../../components/BillCard";
import { PaydayRing } from "../../components/PaydayRing";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { useBills } from "../../hooks/useBills";
import { useRisk, riskDisplay } from "../../hooks/useRisk";
import { useCountUp } from "../../hooks/useCountUp";
import { useSession } from "../../context/SessionContext";
import { useTabNav } from "../../navigation/useTabNav";
import { scheduleBillReminders } from "../../notifications/reminders";
import { formatShort } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useSession();
  const goTab = useTabNav();
  const { bills, loading, loaded, error, refresh: refreshBills } = useBills();
  const { risk, error: riskError, refresh: refreshRisk } = useRisk();

  // Reload every time Home comes into focus (after setup, after returning from another tab).
  useFocusEffect(
    useCallback(() => {
      refreshBills();
      refreshRisk();
    }, [refreshBills, refreshRisk])
  );

  // Keep the phone's due-date reminders in step with the bills (3 days, 1 day, and the day itself).
  useEffect(() => {
    if (loaded) scheduleBillReminders(bills).catch(() => {});
  }, [bills, loaded]);

  const refreshAll = useCallback(() => {
    refreshBills();
    refreshRisk();
  }, [refreshBills, refreshRisk]);

  const rd = riskDisplay(risk);
  const priorityBills = bills.filter((b) => b.priority === "High");
  const alertCount = bills.filter((b) => b.status === "overdue" || b.status === "due-soon").length;

  const remaining = risk ? Number(risk.remaining_budget_min) : null;
  const income = risk ? Number(risk.combined_income) : 0;
  const remainingShare = remaining != null && income > 0 ? Math.max(0, Math.min(1, remaining / income)) : 0;
  const days = risk ? risk.days_until_next_payday : null;

  // numbers count up when they arrive
  const remainingShown = Math.round(useCountUp(remaining));
  const daysShown = Math.round(useCountUp(days, 700));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="light" />
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Text style={styles.name}>{user?.firstName ?? "there"}!</Text>
              <Sun size={18} color={GOLD.light} strokeWidth={1.75} />
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

        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <PaydayRing size={136} stroke={12} progress={remainingShare} color={GOLD.light}>
              <Text
                style={[styles.ringAmount, remaining != null && remaining < 0 && { color: "#FCA5A5" }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {remaining == null ? "—" : fmt(remainingShown)}
              </Text>
              <Text style={styles.ringLabel}>left after bills</Text>
            </PaydayRing>

            <View style={styles.heroRight}>
              <Text style={styles.days}>{days == null ? "—" : daysShown}</Text>
              <Text style={styles.daysLabel}>{days === 1 ? "day" : "days"} to payday</Text>
              {risk?.next_payday ? <Text style={styles.daysDate}>{formatShort(risk.next_payday)}</Text> : null}
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: rd.barColor }]} />
            <Text style={[styles.statusText, { color: rd.color }]}>{rd.label}</Text>
            <Text style={styles.statusCaption}>financial risk</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} />}
      >
        {error || riskError ? <Text style={styles.errorText}>{error ?? riskError}</Text> : null}

        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Star size={16} color={GOLD.gold} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Priority bills this period</Text>
          </View>
          <Pressable onPress={() => goTab("budget")}>
            <Text style={styles.seeAll}>View all bills</Text>
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
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  greeting: { color: "#BFDBFE", fontSize: 12, fontWeight: "500" },
  name: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  bellWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  bellBadge: { position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: "#E11D48", alignItems: "center", justifyContent: "center" },
  bellBadgeText: { color: "#FFF", fontSize: 9, fontWeight: "700" },
  heroCard: { backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  ringAmount: { color: "#FFF", fontSize: 22, fontWeight: "800", maxWidth: 96, textAlign: "center" },
  ringLabel: { color: "#BFDBFE", fontSize: 11, marginTop: 1 },
  heroRight: { flex: 1 },
  days: { color: "#FFF", fontSize: 56, fontWeight: "800", lineHeight: 60 },
  daysLabel: { color: "#DBEAFE", fontSize: 14, fontWeight: "600", marginTop: -2 },
  daysDate: { color: "#93C5FD", fontSize: 12, marginTop: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.18)" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 16, fontWeight: "800" },
  statusCaption: { color: "#BFDBFE", fontSize: 12 },
  errorText: { color: C.red, fontSize: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  seeAll: { fontSize: 12, color: C.primary, fontWeight: "600" },
  emptyCard: { backgroundColor: C.surface, borderRadius: 16, paddingVertical: 24, alignItems: "center" },
  emptyTitle: { fontSize: 13, fontWeight: "600", color: C.sub },
  emptySub: { fontSize: 11, color: C.muted, marginTop: 2 },
});
