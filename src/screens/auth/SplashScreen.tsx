import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C } from "../../theme";
import { Text } from "../../ui/Text";
import { PaydayRing } from "../../components/PaydayRing";
import { Piso } from "../../components/Piso";
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
  const piso = useRef(new Animated.Value(0)).current;
  const words = useRef(new Animated.Value(0)).current;

  // One orchestrated moment: the ring draws, Piso pops in, then the name fades in.
  useEffect(() => {
    if (reduced) {
      piso.setValue(1);
      words.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.delay(700),
      Animated.spring(piso, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(1200),
      Animated.timing(words, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [reduced, piso, words]);

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
    <View style={styles.root}>
      <FocusedStatusBar style="light" />
      <View style={styles.circleBig} />
      <View style={styles.circleSmall} />

      <PaydayRing size={164} stroke={8} progress={1} color="#FFFFFF" track="rgba(255,255,255,0.25)" duration={1200}>
        <Animated.View style={{ opacity: piso, transform: [{ scale: piso.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }}>
          <Piso size={96} mood="happy" />
        </Animated.View>
      </PaydayRing>

      <Animated.View style={[styles.words, { opacity: words }]}>
        <Text style={styles.name}>BillWise</Text>
        <Text style={styles.tagline}>{"Smart Bills.\nSmarter Budget."}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, overflow: "hidden" },
  circleBig: { position: "absolute", top: -70, right: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(255,255,255,0.07)" },
  circleSmall: { position: "absolute", bottom: -50, left: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.07)" },
  words: { alignItems: "center", marginTop: 36 },
  name: { color: "#FFF", fontSize: 34, fontWeight: "800" },
  tagline: { color: "#D3E4FF", fontSize: 16, textAlign: "center", marginTop: 10, lineHeight: 24 },
});
