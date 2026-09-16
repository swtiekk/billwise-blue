import React, { useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Lightbulb, TrendingUp, ChevronDown, ChevronRight, Info } from "lucide-react-native";
import { C, sh, HERO_GRADIENT } from "../theme";
import { TabBar, Tab } from "../components/TabBar";
import { RISK_FACTORS, TIPS } from "../data";
import { IconFromKey } from "../components/IconMap";

const IMPACT_COLOR: Record<string, { text: string; bg: string; bar: string }> = {
  High: { text: C.red, bg: C.redBg, bar: "#FB7185" },
  Medium: { text: C.amber, bg: C.amberBg, bar: "#FBBF24" },
  Low: { text: C.muted, bg: "#F1F5F9", bar: "#CBD5E1" },
};

export default function RecommendationsScreen({ onNavTab }: { onNavTab: (t: Tab) => void }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const maxScore = Math.max(...RISK_FACTORS.map((f) => f.score));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Lightbulb size={20} color="#FDE68A" strokeWidth={1.75} />
          <Text style={styles.heroTitle}>Smart Insights</Text>
        </View>
        <Text style={styles.heroSub}>AI-powered recommendations for your finances</Text>

        <View style={styles.statsRow}>
          {[
            { val: "68", label: "Risk Score", color: "#FCA5A5" },
            { val: "4", label: "Actions", color: "#FFF" },
            { val: "₱750", label: "Save/Month", color: "#FDE68A" },
          ].map((s) => (
            <View key={s.label} style={styles.statCell}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <FlatList
        data={[{ key: "content" }]}
        keyExtractor={(i) => i.key}
        contentContainerStyle={{ padding: 20, gap: 20 }}
        renderItem={() => (
          <View style={{ gap: 20 }}>
            <View>
              <View style={styles.sectionHeader}>
                <TrendingUp size={16} color={C.muted} strokeWidth={1.75} />
                <Text style={styles.sectionTitle}>Risk Breakdown</Text>
              </View>
              <View style={{ gap: 8 }}>
                {RISK_FACTORS.map((f, i) => {
                  const col = IMPACT_COLOR[f.impact];
                  const isOpen = expanded === i;
                  return (
                    <View key={i} style={[styles.factorCard, sh.sm]}>
                      <Pressable onPress={() => setExpanded(isOpen ? null : i)} style={styles.factorRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <Text style={styles.factorLabel}>{f.label}</Text>
                            <View style={[styles.impactBadge, { backgroundColor: col.bg }]}>
                              <Text style={[styles.impactText, { color: col.text }]}>{f.impact}</Text>
                            </View>
                          </View>
                          <View style={styles.factorTrack}>
                            <View style={[styles.factorFill, { width: `${(f.score / maxScore) * 100}%`, backgroundColor: col.bar }]} />
                          </View>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 12 }}>
                          <Text style={styles.factorScore}>+{f.score}</Text>
                          <ChevronDown size={16} color={C.muted} style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }} />
                        </View>
                      </Pressable>
                      {isOpen && (
                        <Text style={styles.factorDetail}>{f.detail}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            <View>
              <View style={styles.sectionHeader}>
                <Info size={16} color={C.muted} strokeWidth={1.75} />
                <Text style={styles.sectionTitle}>Recommended Actions</Text>
              </View>
              <View style={{ gap: 12 }}>
                {TIPS.map((tip) => (
                  <View key={tip.title} style={[styles.tipCard, sh.sm]}>
                    <View style={styles.tipIconWrap}>
                      <IconFromKey iconKey={tip.iconKey as string} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tipTitle}>{tip.title}</Text>
                      <Text style={styles.tipDesc}>{tip.desc}</Text>
                      <Pressable style={styles.tipAction}>
                        <Text style={styles.tipActionText}>{tip.action}</Text>
                        <ChevronRight size={12} color={C.primary} strokeWidth={2.5} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      />

      <TabBar active="profile" onChange={onNavTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24 },
  heroTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  heroSub: { color: "#BFDBFE", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  statCell: { flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 12, alignItems: "center" },
  statVal: { fontSize: 20, fontWeight: "700" },
  statLabel: { color: "#BFDBFE", fontSize: 10, marginTop: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  factorCard: { backgroundColor: C.surface, borderRadius: 16, overflow: "hidden" },
  factorRow: { flexDirection: "row", alignItems: "center", padding: 14 },
  factorLabel: { fontSize: 13, fontWeight: "600", color: C.sub },
  impactBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  impactText: { fontSize: 11, fontWeight: "600" },
  factorTrack: { height: 6, backgroundColor: "#E2E8F0", borderRadius: 3, overflow: "hidden", width: "100%" },
  factorFill: { height: "100%", borderRadius: 3 },
  factorScore: { fontSize: 14, fontWeight: "700", color: C.sub },
  factorDetail: { fontSize: 12, color: C.muted, lineHeight: 18, paddingHorizontal: 14, paddingBottom: 14 },
  tipCard: { backgroundColor: C.surface, borderRadius: 16, padding: 14, flexDirection: "row", gap: 12 },
  tipIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  tipTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 2 },
  tipDesc: { fontSize: 11, color: C.muted, lineHeight: 16, marginBottom: 8 },
  tipAction: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: C.primaryLt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  tipActionText: { fontSize: 11, fontWeight: "700", color: C.primary },
});