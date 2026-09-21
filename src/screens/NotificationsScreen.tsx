import React, { useCallback, useMemo, useState } from "react";
import { View, Pressable, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { Text } from "../ui/Text";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, AlertTriangle, BellRing, TrendingDown, Info, CheckCheck } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, HERO_GRADIENT } from "../theme";
import type { NotifKind } from "../data";
import { FocusedStatusBar } from "../components/FocusedStatusBar";
import { getNotifications } from "../api/insights";
import { errorMessage } from "../api/client";
import type { ApiNotification } from "../api/types";
import { daysUntil } from "../utils/dates";
import type { RootStackParamList } from "../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

const NOTIF_CONFIG: Record<NotifKind, { bg: string; iconBg: string; iconColor: string; Icon: any }> = {
  overdue: { bg: "#FFF1F2", iconBg: "#FFE4E6", iconColor: "#F43F5E", Icon: AlertTriangle },
  "due-soon": { bg: "#FFFBEB", iconBg: "#FEF3C7", iconColor: "#F59E0B", Icon: BellRing },
  risk: { bg: C.primaryLt, iconBg: "#DBEAFE", iconColor: C.primary, Icon: TrendingDown },
  info: { bg: "#F8FAFC", iconBg: "#F1F5F9", iconColor: "#64748B", Icon: Info },
};

const KIND: Record<ApiNotification["type"], NotifKind> = {
  overdue: "overdue",
  due_soon: "due-soon",
  upcoming: "info",
  risk_alert: "risk",
};

// The backend has no timestamps, so notifications are grouped by urgency instead of "Today".
type Group = "Needs Attention" | "Coming Up";
const GROUPS: Group[] = ["Needs Attention", "Coming Up"];

interface Item {
  id: string;
  kind: NotifKind;
  title: string;
  desc: string;
  time: string;
  group: Group;
  hasBill: boolean;
}

function dueLabel(iso?: string): string {
  if (!iso) return "Now";
  const d = daysUntil(iso);
  if (d < 0) return `${-d} day${d === -1 ? "" : "s"} overdue`;
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `Due in ${d} days`;
}

function toItem(n: ApiNotification, index: number): Item {
  return {
    id: `${n.type}-${n.bill_id ?? "risk"}-${index}`,
    kind: KIND[n.type],
    title: n.title,
    desc: n.message,
    time: dueLabel(n.due_date),
    group: n.type === "upcoming" ? "Coming Up" : "Needs Attention",
    hasBill: n.bill_id != null,
  };
}

export default function NotificationsScreen({ navigation }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      setItems(res.notifications.map(toItem));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const unreadCount = useMemo(() => items.filter((n) => !read.has(n.id)).length, [items, read]);

  const markAllRead = () => setRead(new Set(items.map((n) => n.id)));

  const open = (n: Item) => {
    setRead((r) => new Set(r).add(n.id));
    // Bill reminders open the Budget tab, like a tapped push notification will.
    if (n.hasBill) navigation.reset({ index: 0, routes: [{ name: "Budget" }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="light" />
      <LinearGradient colors={HERO_GRADIENT} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={18} color="#FFF" strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.headerSub}>{unreadCount} unread</Text>}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead} style={styles.markAllBtn}>
            <CheckCheck size={14} color="#FFF" strokeWidth={2} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {GROUPS.map((group) => {
          const list = items.filter((n) => n.group === group);
          if (!list.length) return null;
          return (
            <View key={group}>
              <Text style={styles.groupLabel}>{group.toUpperCase()}</Text>
              <View style={{ gap: 8 }}>
                {list.map((n) => {
                  const cfg = NOTIF_CONFIG[n.kind];
                  const isRead = read.has(n.id);
                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => open(n)}
                      style={({ pressed }) => [
                        styles.notifCard,
                        { backgroundColor: isRead ? C.surface : cfg.bg },
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <View>
                        <View style={[styles.iconWrap, { backgroundColor: cfg.iconBg }]}>
                          <cfg.Icon size={18} color={cfg.iconColor} strokeWidth={1.75} />
                        </View>
                        {!isRead && <View style={styles.unreadDot} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                          <Text style={[styles.notifTitle, { fontWeight: isRead ? "500" : "700", color: isRead ? C.sub : C.text }]}>
                            {n.title}
                          </Text>
                          <Text style={styles.notifTime}>{n.time}</Text>
                        </View>
                        <Text style={styles.notifDesc}>{n.desc}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        {loaded && !error && (items.length === 0 || unreadCount === 0) ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <View style={styles.emptyIcon}>
              <CheckCheck size={24} color={C.primary} strokeWidth={1.75} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: C.sub }}>All caught up!</Text>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {items.length === 0 ? "No reminders right now." : "No new notifications right now."}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  headerSub: { color: "#BFDBFE", fontSize: 11, marginTop: 1 },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  markAllText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
  errorText: { color: C.red, fontSize: 12 },
  groupLabel: { fontSize: 11, fontWeight: "600", color: C.muted, letterSpacing: 0.6, marginBottom: 8, marginLeft: 2 },
  notifCard: { borderRadius: 16, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  unreadDot: { position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary, borderWidth: 2, borderColor: "#FFF" },
  notifTitle: { fontSize: 13, flex: 1, lineHeight: 18 },
  notifTime: { fontSize: 10, color: C.muted, marginTop: 2 },
  notifDesc: { fontSize: 12, color: C.muted, lineHeight: 17, marginTop: 3 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center", marginBottom: 12 },
});
