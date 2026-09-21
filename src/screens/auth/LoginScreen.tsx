import React, { useState } from "react";
import { View, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { Field, Btn } from "../../components/Atoms";
import { Piso } from "../../components/Piso";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { login } from "../../api/auth";
import { errorMessage } from "../../api/client";
import { useSession } from "../../context/SessionContext";
import { useSetup } from "../../context/SetupContext";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

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

export default function LoginScreen({ navigation }: Props) {
  const { setUser } = useSession();
  const { reset } = useSetup();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (loading) return;
    if (!email.trim() || !pass) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, pass);
      setUser(user);
      reset(); // never carry over another account's unfinished setup
      // Returning user -> Home. Signed up but never finished setup -> Setup 1.
      navigation.reset({ index: 0, routes: [{ name: user.setupCompleted ? "Home" : "SetupHousehold" }] });
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <FocusedStatusBar style="dark" />

      <View style={styles.head}>
        <Piso size={72} mood="happy" />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Log in to see how your bills and budget are doing.</Text>
      </View>

      <View style={styles.form}>
        <Field label="Email address" value={email} onChange={setEmail} placeholder="juan@email.com" keyboardType="email-address" />
        <Field label="Password" value={pass} onChange={setPass} placeholder="Your password" secureTextEntry />

        <Pressable style={{ alignSelf: "flex-end", marginBottom: 10 }}>
          <Text style={styles.forgot}>Forgot password?</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Btn onPress={submit}>{loading ? "Logging in…" : "Log in"}</Btn>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          onPress={() => Alert.alert("Coming soon", "Google sign-in isn't available yet.")}
          style={({ pressed }) => [styles.googleBtn, sh.sm, pressed && { opacity: 0.85 }]}
        >
          <GoogleIcon />
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>
      </View>

      <Text style={styles.signupRow}>
        New to BillWise?{" "}
        <Text style={styles.signupLink} onPress={() => navigation.navigate("Signup")}>Create an account</Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 32 },
  head: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: "800", color: C.text, marginTop: 14 },
  sub: { fontSize: 14, color: C.sub, marginTop: 6, lineHeight: 21 },
  form: { flex: 1 },
  forgot: { fontSize: 13, color: C.primary, fontWeight: "600" },
  error: { color: C.red, fontSize: 13, marginBottom: 10 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#D3E1FA" },
  dividerText: { fontSize: 13, color: C.muted },
  googleBtn: { height: 54, borderRadius: 18, borderWidth: 1.5, borderColor: "#D3E1FA", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#FFF" },
  googleText: { fontSize: 15, fontWeight: "600", color: C.text },
  signupRow: { textAlign: "center", fontSize: 14, color: C.sub, marginTop: 24 },
  signupLink: { color: C.primary, fontWeight: "700" },
});
