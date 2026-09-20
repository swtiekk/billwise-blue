import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, HERO_GRADIENT } from "../../theme";
import { TabBar } from "../../components/TabBar";
import { Btn } from "../../components/Atoms";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { logout, displayName } from "../../api/auth";
import { useSession } from "../../context/SessionContext";
import { useSetup } from "../../context/SetupContext";
import { useTabNav } from "../../navigation/useTabNav";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

// Phase 1 placeholder: real profile (household summary, edit setup, etc.) is Phase 3.
export default function ProfileScreen({ navigation }: Props) {
  const { user, setUser } = useSession();
  const { reset } = useSetup();
  const goTab = useTabNav();

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const onLogout = async () => {
    await logout();
    reset();
    setUser(null);
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="light" />
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "?"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{displayName(user)}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email ?? ""}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ flex: 1, padding: 20, gap: 16 }}>
        <View style={[styles.card, sh.sm]}>
          <Text style={styles.cardTitle}>More coming soon</Text>
          <Text style={styles.cardSub}>
            Household summary, editing your setup and bills will be added in the next update.
          </Text>
        </View>
        <Btn variant="danger" onPress={onLogout}>Log Out</Btn>
      </View>

      <TabBar active="profile" onChange={goTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: 22, fontWeight: "700" },
  name: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  email: { color: "#BFDBFE", fontSize: 12, marginTop: 1 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 4 },
  cardSub: { fontSize: 12, color: C.muted, lineHeight: 17 },
});
