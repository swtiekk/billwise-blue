import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Wallet } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HERO_GRADIENT } from "../../theme";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { resolveStart } from "../../api/auth";
import { useSession } from "../../context/SessionContext";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function SplashScreen({ navigation }: Props) {
  const { setUser } = useSession();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Show the splash for at least 2 seconds while the saved session is checked.
      const [start] = await Promise.all([resolveStart(), wait(2000)]);
      if (cancelled) return;
      setUser(start.user);
      navigation.replace(start.route);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigation, setUser]);

  return (
    <LinearGradient colors={HERO_GRADIENT} style={styles.root}>
      <FocusedStatusBar style="light" />
      <View style={styles.circleBig} />
      <View style={styles.circleSmall} />

      <View style={styles.logo}>
        <Wallet size={34} color="#FFF" strokeWidth={1.75} />
      </View>
      <Text style={styles.name}>BillWise</Text>
      <Text style={styles.tagline}>{"Smart Bills.\nSmarter Budget."}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, overflow: "hidden" },
  circleBig: { position: "absolute", top: -64, right: -64, width: 224, height: 224, borderRadius: 112, backgroundColor: "rgba(255,255,255,0.1)" },
  circleSmall: { position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.1)" },
  logo: { width: 76, height: 76, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  name: { color: "#FFF", fontSize: 34, fontWeight: "800" },
  tagline: { color: "#BFDBFE", fontSize: 16, textAlign: "center", marginTop: 10, lineHeight: 23 },
});
