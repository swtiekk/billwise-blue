import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { Wallet, CircleDollarSign } from "lucide-react-native";
import { C, sh, HERO_GRADIENT, fmt } from "../theme";
import { Field, Btn } from "../components/Atoms";

// Multi-color Google "G" logo, ported from the web version's inline SVG paths
function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

export default function LoginScreen({ onLogin, onGoToSignup }: { onLogin: () => void; onGoToSignup: () => void }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ flexGrow: 1 }}>
      {/* Hero */}
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={[styles.circleBig]} />
        <View style={[styles.circleSmall]} />

        {/* Floating stacked card illustration */}
        <View style={styles.illustrationWrap}>
          <View style={styles.cardBack1} />
          <View style={styles.cardBack2} />
          <View style={[styles.card, sh.lg]}>
            <View style={styles.cardTop}>
              <View style={styles.cardIconWrap}>
                <Wallet size={16} color={C.primary} strokeWidth={2} />
              </View>
              <Text style={styles.cardBrand}>BillWise</Text>
            </View>
            <Text style={styles.cardLabel}>Total Due</Text>
            <Text style={styles.cardValue}>{fmt(16528)}</Text>
            <View style={styles.cardBars}>
              <View style={[styles.cardBar, { backgroundColor: "#FECDD3", flex: 1 }]} />
              <View style={[styles.cardBar, { backgroundColor: "#FDE68A", flex: 1 }]} />
              <View style={[styles.cardBar, { backgroundColor: "#F1F5F9", width: 32, flex: 0 }]} />
            </View>
          </View>
          <View style={styles.coinBadge}>
            <CircleDollarSign size={22} color="#FFF" strokeWidth={2} />
          </View>
        </View>

        <Text style={styles.heroTitle}>Smart Bills,{"\n"}Smarter Budget</Text>
        <Text style={styles.heroTagline}>
          Never miss a bill again. Prioritize what matters for your family.
        </Text>
      </LinearGradient>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.welcome}>Welcome back</Text>
        <Text style={styles.welcomeSub}>Log in to your BillWise account</Text>

        <Field label="Email Address" value={email} onChange={setEmail} placeholder="juan@email.com" keyboardType="email-address" />
        <Field label="Password" value={pass} onChange={setPass} placeholder="••••••••" secureTextEntry />

        <Pressable style={{ alignSelf: "flex-end", marginBottom: 8 }}>
          <Text style={styles.forgot}>Forgot password?</Text>
        </Pressable>

        <View style={{ marginTop: 8 }}>
          <Btn onPress={onLogin}>Log In</Btn>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable style={({ pressed }) => [styles.googleBtn, sh.sm, pressed && { opacity: 0.85 }]}>
          <GoogleIcon />
          <Text style={styles.googleText}>Sign in with Google</Text>
        </Pressable>

        <Text style={styles.signupRow}>
          Don't have an account?{" "}
          <Text style={styles.signupLink} onPress={onGoToSignup}>Sign up</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 80, position: "relative", overflow: "hidden" },
  circleBig: { position: "absolute", top: -64, right: -64, width: 192, height: 192, borderRadius: 96, backgroundColor: "rgba(255,255,255,0.1)" },
  circleSmall: { position: "absolute", bottom: -32, left: -32, width: 128, height: 128, borderRadius: 64, backgroundColor: "rgba(255,255,255,0.1)" },
  illustrationWrap: { alignItems: "center", marginBottom: 24, position: "relative", height: 150 },
  cardBack1: { position: "absolute", top: 16, width: 208, height: 128, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", transform: [{ rotate: "6deg" }] },
  cardBack2: { position: "absolute", top: 8, width: 208, height: 128, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.3)", transform: [{ rotate: "3deg" }] },
  card: { width: 208, height: 128, backgroundColor: "#FFF", borderRadius: 16, padding: 16 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  cardBrand: { fontSize: 11, color: C.muted, fontWeight: "600" },
  cardLabel: { fontSize: 11, color: C.muted, marginBottom: 2 },
  cardValue: { fontSize: 20, fontWeight: "700", color: C.text },
  cardBars: { flexDirection: "row", gap: 4, marginTop: 8 },
  cardBar: { height: 6, borderRadius: 3 },
  coinBadge: { position: "absolute", bottom: -6, right: 12, width: 48, height: 48, borderRadius: 24, backgroundColor: "#F59E0B", alignItems: "center", justifyContent: "center", ...sh.md },
  heroTitle: { color: "#FFF", fontSize: 28, fontWeight: "800", textAlign: "center", lineHeight: 34 },
  heroTagline: { color: "#BFDBFE", fontSize: 13, textAlign: "center", marginTop: 12, lineHeight: 19, paddingHorizontal: 8 },
  form: { flex: 1, backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32, marginTop: -20 },
  welcome: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 2 },
  welcomeSub: { fontSize: 13, color: C.muted, marginBottom: 20 },
  forgot: { fontSize: 12, color: C.primary, fontWeight: "600" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 12, color: C.muted },
  googleBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FFF" },
  googleText: { fontSize: 14, fontWeight: "500", color: C.sub },
  signupRow: { textAlign: "center", fontSize: 13, color: C.muted, marginTop: 20 },
  signupLink: { color: C.primary, fontWeight: "700" },
});