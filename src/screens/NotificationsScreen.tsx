import React, { useCallback, useMemo, useState } from "react";
import { View, Pressable, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, AlertTriangle, BellRing, TrendingDown, Info } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../theme";
import { Text } from "../ui/Text";
import { Piso } from "../components/Piso";
import type { NotifKind } from "../data";
import { FocusedStatusBar } from "../components/FocusedStatusBar";
import { getNotifications } from "../api/insights";
import { errorMessage } from "../api/client";
import type { ApiNotification } from "../api/types";
import { daysUntil } from "../utils/dates";
import type { RootStackParamList } from "../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

const NOTIF_CONFIG: Record<NotifKind, { bg: string; iconBg: string; iconColor: string; Icon: any }> = {
  overdue: { bg: C.redBg, iconBg: "#FFCDD5", iconColor: "#A3182F", Icon: AlertTriangle },
  "due-soon": { bg: C.amberBg, iconBg: "#FFD9B8", iconColor: "#9A4308", Icon: BellRing },
  risk: { bg: C.primaryLt, iconBg: "#BFD9FF", iconColor: C.primary, Icon: TrendingDown },
  info: { bg: "#EAF0FB", iconBg: "#D3E0F7", iconColor: C.sub, Icon: Info },
};

const KIND: Record<ApiNotification["type"], NotifKind> = {
  overdue: "overdue",
  due_soon: "due-soon",
  upcoming: "info",
  risk_alert: "risk",
};

// The backend has no timestamps, so notifications are grouped by urgency instead of "Today".
type Group = "Needs attention" | "Coming up";
const GROUPS: Group[] = ["Needs attention", "Coming up"];

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
    group: n.type === "upcoming" ? "Coming up" : "Needs attention",
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
      <FocusedStatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.backBtn, sh.sm]}>
          <ArrowLeft size={20} color={C.text} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 ? <Text style={styles.headerSub}>{unreadCount} unread</Text> : null}
        </View>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

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
              <Text style={styles.groupLabel}>{group}</Text>
              <View style={{ gap: 10 }}>
                {list.map((n) => {
                  const cfg = NOTIF_CONFIG[n.kind];
                  const isRead = read.has(n.id);
                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => open(n)}
                      style={({ pressed }) => [styles.card, { backgroundColor: isRead ? C.surface : cfg.bg }, pressed && { opacity: 0.8 }]}
                    >
                      <View>
                        <View style={[styles.iconWrap, { backgroundColor: cfg.iconBg }]}>
                          <cfg.Icon size={20} color={cfg.iconColor} strokeWidth={1.9} />
                        </View>
                        {!isRead ? <View style={styles.unreadDot} /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                          <Text style={[styles.title, { fontWeight: isRead ? "500" : "700", color: isRead ? C.sub : C.text }]}>{n.title}</Text>
                          <Text style={styles.time}>{n.time}</Text>
                        </View>
                        <Text style={styles.desc}>{n.desc}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        {loaded && !error && (items.length === 0 || unreadCount === 0) ? (
          <View style={styles.empty}>
            <Piso size={72} mood="party" />
            <Text style={styles.emptyTitle}>You're all caught up!</Text>
            <Text style={styles.emptySub}>{items.length === 0 ? "No reminders right now." : "No new notifications right now."}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: C.text },
  headerSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  markAllBtn: { backgroundColor: C.primaryLt, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  markAllText: { color: C.primary, fontSize: 12, fontWeight: "600" },
  errorText: { color: C.red, fontSize: 12 },
  groupLabel: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 10, marginLeft: 2 },
  card: { borderRadius: 22, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  unreadDot: { position: "absolute", top: -1, right: -1, width: 11, height: 11, borderRadius: 6, backgroundColor: C.primary, borderWidth: 2, borderColor: "#FFF" },
  title: { fontSize: 14, flex: 1, lineHeight: 20 },
  time: { fontSize: 11, color: C.muted, marginTop: 3 },
  desc: { fontSize: 13, color: C.sub, lineHeight: 19, marginTop: 4 },
  empty: { alignItems: "center", paddingVertical: 36, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginTop: 8 },
  emptySub: { fontSize: 13, color: C.muted },
});
