import React, { useCallback, useEffect } from "react";
import { View, Pressable, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Bell, CalendarDays, CheckCircle2, AlertTriangle, Star } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, fmt } from "../../theme";
import { GOLD } from "../../brand";
import { Text } from "../../ui/Text";
import { TabBar } from "../../components/TabBar";
import { BillPill } from "../../components/BillPill";
import { MoneyTank } from "../../components/MoneyTank";
import { Piso } from "../../components/Piso";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { useBills } from "../../hooks/useBills";
import { useRisk } from "../../hooks/useRisk";
import { useCountUp } from "../../hooks/useCountUp";
import { useSession } from "../../context/SessionContext";
import { useTabNav } from "../../navigation/useTabNav";
import { scheduleBillReminders } from "../../notifications/reminders";
import { formatShort } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

// How each risk level looks on the status tile (label wording follows your flow).
const STATUS = {
  STABLE: { label: "Stable", note: "You're covered", bg: C.greenBg, fg: "#0B6B53", Icon: CheckCircle2 },
  "AT RISK": { label: "At risk", note: "Watch your spending", bg: C.amberBg, fg: "#9A4308", Icon: AlertTriangle },
  CRITICAL: { label: "Critical", note: "Act on this soon", bg: C.redBg, fg: "#A3182F", Icon: AlertTriangle },
} as const;

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

  const priorityBills = bills.filter((b) => b.priority === "High");
  const alertCount = bills.filter((b) => b.status === "overdue" || b.status === "due-soon").length;

  const remaining = risk ? Number(risk.remaining_budget_min) : null;
  const income = risk ? Number(risk.combined_income) : 0;
  const share = remaining != null && income > 0 ? Math.max(0, Math.min(1, remaining / income)) : 0;
  const days = risk ? risk.days_until_next_payday : null;

  // numbers count up when they arrive
  const remainingShown = Math.round(useCountUp(remaining));
  const daysShown = Math.round(useCountUp(days, 700));

  const status = risk ? STATUS[risk.label] : null;
  const StatusIcon = status?.Icon ?? CheckCircle2;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} />}
      >
        <View style={styles.top}>
          <View style={styles.hello}>
            <Piso size={34} mood={risk && risk.label !== "STABLE" ? "worried" : "happy"} />
            <Text style={styles.helloText}>Hi, {user?.firstName ?? "there"}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate("Notifications")} style={({ pressed }) => [styles.bell, sh.sm, pressed && { opacity: 0.7 }]}>
            <Bell size={20} color={C.text} strokeWidth={1.9} />
            {alertCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{alertCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <MoneyTank level={share} height={156}>
          <View>
            <Text style={styles.tankLabel}>Money left after bills</Text>
            <Text style={[styles.tankAmount, remaining != null && remaining < 0 && { color: "#FFD3DA" }]} numberOfLines={1} adjustsFontSizeToFit>
              {remaining == null ? "—" : fmt(remainingShown)}
            </Text>
          </View>
          <Text style={styles.tankFoot}>
            {remaining == null ? "Checking your budget…" : `${Math.round(share * 100)}% of your income`}
          </Text>
        </MoneyTank>

        <View style={styles.tiles}>
          <View style={[styles.tile, { backgroundColor: C.primaryLt }]}>
            <CalendarDays size={20} color={C.primary} strokeWidth={1.9} />
            <Text style={styles.tileNumber}>{days == null ? "—" : daysShown}</Text>
            <Text style={styles.tileLabel}>
              {days === 1 ? "day" : "days"} to payday{risk?.next_payday ? `, ${formatShort(risk.next_payday)}` : ""}
            </Text>
          </View>
          <View style={[styles.tile, { backgroundColor: status?.bg ?? C.primaryLt }]}>
            <StatusIcon size={20} color={status?.fg ?? C.muted} strokeWidth={1.9} />
            <Text style={[styles.tileWord, { color: status?.fg ?? C.muted }]}>{status?.label ?? "—"}</Text>
            <Text style={[styles.tileLabel, { color: status?.fg ?? C.muted }]}>{status?.note ?? "Financial risk"}</Text>
          </View>
        </View>

        {error || riskError ? <Text style={styles.errorText}>{error ?? riskError}</Text> : null}

        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Star size={16} color={GOLD.gold} fill={GOLD.gold} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Priority bills</Text>
          </View>
          <Pressable onPress={() => goTab("budget")}>
            <Text style={styles.seeAll}>See all bills</Text>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          {priorityBills.map((b) => (
            <BillPill key={b.id} bill={b} onPress={() => goTab("budget")} />
          ))}
          {priorityBills.length === 0 && !loading ? (
            <View style={styles.empty}>
              <Piso size={56} mood="party" />
              <Text style={styles.emptyTitle}>Nothing urgent</Text>
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
  scroll: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, gap: 14 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hello: { flexDirection: "row", alignItems: "center", gap: 10 },
  helloText: { fontSize: 18, fontWeight: "700", color: C.text },
  bell: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  tankLabel: { color: "#D3E4FF", fontSize: 12 },
  tankAmount: { color: "#FFF", fontSize: 30, fontWeight: "800", marginTop: 2 },
  tankFoot: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  tiles: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, borderRadius: 24, padding: 14, gap: 4 },
  tileNumber: { fontSize: 26, fontWeight: "800", color: C.text, marginTop: 2 },
  tileWord: { fontSize: 18, fontWeight: "700", marginTop: 6 },
  tileLabel: { fontSize: 12, color: C.sub },
  errorText: { color: C.red, fontSize: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: "600" },
  empty: { backgroundColor: C.surface, borderRadius: 24, paddingVertical: 22, alignItems: "center", gap: 4 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginTop: 6 },
  emptySub: { fontSize: 12, color: C.muted },
});
