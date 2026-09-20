import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HERO_GRADIENT } from "../../theme";
import { GOLD } from "../../brand";
import { PaydayRing } from "../../components/PaydayRing";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { resolveStart } from "../../api/auth";
import { useSession } from "../../context/SessionContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function SplashScreen({ navigation }: Props) {
  const { setUser } = useSession();
  const reduced = useReducedMotion();
  const glyph = useRef(new Animated.Value(0)).current;
  const words = useRef(new Animated.Value(0)).current;

  // One orchestrated moment: ring draws (0 to 1.2s), the peso pops, then the name fades in.
  useEffect(() => {
    if (reduced) {
      glyph.setValue(1);
      words.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.delay(800),
      Animated.spring(glyph, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(1200),
      Animated.timing(words, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [reduced, glyph, words]);

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

      <PaydayRing size={148} stroke={10} progress={1} color={GOLD.light} duration={1200}>
        <Animated.Text
          style={[
            styles.peso,
            { opacity: glyph, transform: [{ scale: glyph.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] },
          ]}
        >
          ₱
        </Animated.Text>
      </PaydayRing>

      <Animated.View style={[styles.words, { opacity: words }]}>
        <Text style={styles.name}>BillWise</Text>
        <Text style={styles.tagline}>{"Smart Bills.\nSmarter Budget."}</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, overflow: "hidden" },
  circleBig: { position: "absolute", top: -64, right: -64, width: 224, height: 224, borderRadius: 112, backgroundColor: "rgba(255,255,255,0.08)" },
  circleSmall: { position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.08)" },
  peso: { fontSize: 60, fontWeight: "800", color: GOLD.light },
  words: { alignItems: "center", marginTop: 36 },
  name: { color: "#FFF", fontSize: 36, fontWeight: "800" },
  tagline: { color: "#BFDBFE", fontSize: 16, textAlign: "center", marginTop: 10, lineHeight: 23 },
});
