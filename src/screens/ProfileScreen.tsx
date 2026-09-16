import React from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Users, Star, ChevronRight, LogOut } from "lucide-react-native";
import { C, sh, HERO_GRADIENT } from "../theme";
import { TabBar, Tab } from "../components/TabBar";
import { SETTINGS_GROUPS } from "../data";
import { IconFromKey } from "../components/IconMap";

export default function ProfileScreen({ onNavTab, onLogout }: { onNavTab: (t: Tab) => void; onLogout: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={styles.avatar}>
            <Users size={28} color="#FFF" strokeWidth={1.75} />
          </View>
          <View>
            <Text style={styles.name}>Maria Santos</Text>
            <Text style={styles.email}>maria.santos@gmail.com</Text>
            <View style={styles.badge}>
              <Star size={10} color="#FDE68A" strokeWidth={2} />
              <Text style={styles.badgeText}>Smart Saver</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { val: "7", label: "Bills Tracked" },
            { val: "₱6K", label: "Saved This Month" },
            { val: "3 mo", label: "Member Since" },
          ].map((s) => (
            <View key={s.label} style={styles.statCell}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <FlatList
        data={SETTINGS_GROUPS}
        keyExtractor={(g) => g.section}
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 12 }}
        renderItem={({ item: group }) => (
          <View>
            <Text style={styles.groupLabel}>{group.section.toUpperCase()}</Text>
            <View style={[styles.groupCard, sh.sm]}>
              {group.items.map((item, i) => (
                <View key={item.label}>
                  <Pressable style={styles.row}>
                    <View style={styles.rowIcon}>
                      <IconFromKey iconKey={item.iconKey} size={17} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      {!!item.sub && <Text style={styles.rowSub} numberOfLines={1}>{item.sub}</Text>}
                    </View>
                    <ChevronRight size={16} color="#CBD5E1" strokeWidth={2} />
                  </Pressable>
                  {i < group.items.length - 1 && <View style={styles.rowDivider} />}
                </View>
              ))}
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={{ gap: 12, marginTop: 4 }}>
            <Pressable onPress={onLogout} style={[styles.logoutBtn]}>
              <LogOut size={16} color={C.red} strokeWidth={2} />
              <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>
            <Text style={styles.footer}>BillWise v1.0.0 · Made for Filipino Families</Text>
          </View>
        }
      />

      <TabBar active="profile" onChange={onNavTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" },
  name: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  email: { color: "#BFDBFE", fontSize: 12, marginTop: 1 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(251,191,36,0.25)", alignSelf: "flex-start", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  badgeText: { color: "#FDE68A", fontSize: 10, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 20 },
  statCell: { flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  statVal: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  statLabel: { color: "#BFDBFE", fontSize: 9, marginTop: 2, textAlign: "center" },
  groupLabel: { fontSize: 11, fontWeight: "600", color: C.muted, letterSpacing: 0.6, marginBottom: 8, marginLeft: 2 },
  groupCard: { backgroundColor: C.surface, borderRadius: 16, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 13, fontWeight: "500", color: C.sub },
  rowSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  rowDivider: { height: 1, backgroundColor: "#F8FAFC", marginLeft: 64 },
  logoutBtn: { borderWidth: 1, borderColor: "#FECDD3", backgroundColor: C.redBg, borderRadius: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  logoutText: { fontSize: 14, fontWeight: "700", color: C.red },
  footer: { textAlign: "center", fontSize: 11, color: "#CBD5E1", paddingBottom: 8 },
});