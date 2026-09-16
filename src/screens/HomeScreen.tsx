import React from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sun, Bell, Plus, BarChart3, Lightbulb, AlertTriangle, CalendarClock, Check } from "lucide-react-native";
import { C, sh, HERO_GRADIENT, fmt } from "../theme";
import { TabBar, Tab } from "../components/TabBar";
import { BillCard } from "../components/BillCard";
import { Bill } from "../data";

export default function HomeScreen({
  bills,
  onNavTab,
  onAddBill,
  onBudget,
  onInsights,
  onSeeAllBills,
  onOpenBill,
}: {
  bills: Bill[];
  onNavTab: (t: Tab) => void;
  onAddBill: () => void;
  onBudget: () => void;
  onInsights: () => void;
  onSeeAllBills: () => void;
  onOpenBill: (b: Bill) => void;
}) {
  const overdue = bills.filter((b) => b.status === "overdue");
  const dueSoon = bills.filter((b) => b.status === "due-soon");
  const totalDue = bills.filter((b) => b.status !== "paid").reduce((s, b) => s + b.amount, 0);
  const urgent = [...overdue, ...dueSoon];
  const upcoming = bills.filter((b) => b.status === "upcoming").slice(0, 2);
  const paid = bills.filter((b) => b.status === "paid");

  const riskScore = overdue.length > 0 ? 68 : dueSoon.length > 0 ? 42 : 18;
  const riskLabel = riskScore > 60 ? "High Risk" : riskScore > 35 ? "Moderate" : "Healthy";
  const riskColor = riskScore > 60 ? "#FCA5A5" : riskScore > 35 ? "#FCD34D" : "#6EE7B7";
  const barColor = riskScore > 60 ? "#FB7185" : riskScore > 35 ? "#FBBF24" : "#34D399";

  const sections = [
    urgent.length > 0 && { key: "urgent", title: "Needs Attention", icon: "alert", data: urgent, seeAll: true },
    { key: "upcoming", title: "Upcoming Bills", icon: "calendar", data: upcoming, seeAll: true },
    paid.length > 0 && { key: "paid", title: "Recently Paid", icon: "check", data: paid, seeAll: false },
  ].filter(Boolean) as { key: string; title: string; icon: string; data: Bill[]; seeAll: boolean }[];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.greeting}>Magandang umaga,</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Text style={styles.name}>Maria Santos</Text>
              <Sun size={18} color="#FDE68A" strokeWidth={1.75} />
            </View>
          </View>
          <View style={styles.bellWrap}>
            <Bell size={20} color="#FFF" strokeWidth={1.75} />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{overdue.length + dueSoon.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.riskCard}>
          <View style={styles.riskTop}>
            <View>
              <Text style={styles.riskLabel}>FINANCIAL RISK SCORE</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                <Text style={[styles.riskScore, { color: riskColor }]}>{riskScore}</Text>
                <Text style={styles.riskOutOf}>/100</Text>
                <Text style={[styles.riskTag, { color: riskColor }]}>{riskLabel}</Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.totalDueLabel}>Total Due</Text>
              <Text style={styles.totalDueValue}>{fmt(totalDue)}</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${riskScore}%`, backgroundColor: barColor }]} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
            <Text style={styles.progressLabel}>Healthy</Text>
            <Text style={styles.progressLabel}>Critical</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{overdue.length}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{dueSoon.length}</Text>
              <Text style={styles.statLabel}>Due Soon</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>₱{Math.round(totalDue / 1000)}K</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={sections}
        keyExtractor={(s) => s.key}
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 12 }}
        ListHeaderComponent={
          <View style={styles.quickActions}>
            {[
              { Icon: Plus, label: "Add Bill", action: onAddBill },
              { Icon: BarChart3, label: "Budget", action: onBudget },
              { Icon: Lightbulb, label: "Insights", action: onInsights },
            ].map(({ Icon, label, action }) => (
              <Pressable key={label} onPress={action} style={({ pressed }) => [styles.quickAction, sh.sm, pressed && { transform: [{ scale: 0.95 }] }]}>
                <Icon size={22} color={C.primary} strokeWidth={1.75} />
                <Text style={styles.quickActionLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>
        }
        ListHeaderComponentStyle={{ marginBottom: 4 }}
        renderItem={({ item }) => (
          <View>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {item.icon === "alert" && <AlertTriangle size={16} color="#E11D48" strokeWidth={2} />}
                {item.icon === "calendar" && <CalendarClock size={16} color={C.muted} strokeWidth={1.75} />}
                {item.icon === "check" && <Check size={16} color={C.green} strokeWidth={2.5} />}
                <Text style={styles.sectionTitle}>{item.title}</Text>
              </View>
              {item.seeAll && (
                <Pressable onPress={onSeeAllBills}>
                  <Text style={styles.seeAll}>See all</Text>
                </Pressable>
              )}
            </View>
            <View style={{ gap: 10 }}>
              {item.data.map((b) => (
                <BillCard key={b.id} bill={b} onPress={() => onOpenBill(b)} />
              ))}
            </View>
          </View>
        )}
      />

      <TabBar active="home" onChange={onNavTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24, position: "relative", overflow: "hidden" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { color: "#BFDBFE", fontSize: 12, fontWeight: "500" },
  name: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  bellWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  bellBadge: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: "#E11D48", alignItems: "center", justifyContent: "center" },
  bellBadgeText: { color: "#FFF", fontSize: 9, fontWeight: "700" },
  riskCard: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  riskTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  riskLabel: { color: "#BFDBFE", fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  riskScore: { fontSize: 30, fontWeight: "800" },
  riskOutOf: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  riskTag: { fontSize: 13, fontWeight: "700" },
  totalDueLabel: { color: "#BFDBFE", fontSize: 11 },
  totalDueValue: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  progressTrack: { height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabel: { color: "#BFDBFE", fontSize: 10 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)" },
  statCell: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  statValue: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  statLabel: { color: "#BFDBFE", fontSize: 10 },
  quickActions: { flexDirection: "row", gap: 12 },
  quickAction: { flex: 1, backgroundColor: C.surface, borderRadius: 16, paddingVertical: 14, alignItems: "center", gap: 6 },
  quickActionLabel: { fontSize: 12, fontWeight: "600", color: C.sub },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  seeAll: { fontSize: 12, color: C.primary, fontWeight: "600" },
});