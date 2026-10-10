import React, { useState } from "react";
import { View, Pressable, ScrollView, KeyboardAvoidingView, StyleSheet } from "react-native";
import { ArrowLeft, Check } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { Field, Btn } from "../../components/Atoms";
import { BrandMark } from "../../components/BrandMark";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { register } from "../../api/auth";
import { errorMessage } from "../../api/client";
import { useSession } from "../../context/SessionContext";
import { useSetup } from "../../context/SetupContext";
import { clearDataCache } from "../../hooks/dataCache";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const { setUser } = useSession();
  const { reset } = useSetup();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // only for things that belong to no single field

  // One message per field, shown right under the field that is wrong.
  type FieldKey = "firstName" | "lastName" | "email" | "pass" | "confirm" | "agreed";
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  /** Edit a field and clear only that field's error. */
  const edit = (key: FieldKey, set: (v: string) => void) => (v: string) => {
    set(v);
    setError(null);
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validate = () => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!firstName.trim()) next.firstName = "Enter your first name.";
    if (!lastName.trim()) next.lastName = "Enter your last name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (pass.length < 8) next.pass = "Password must be at least 8 characters.";
    if (!confirm) next.confirm = "Re-enter your password.";
    else if (pass !== confirm) next.confirm = "Passwords don't match.";
    if (!agreed) next.agreed = "Please accept the Terms of Service to continue.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (loading) return;
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await register({ firstName, lastName, email, password: pass });
      clearDataCache();
      setUser(user);
      reset();
      navigation.reset({ index: 0, routes: [{ name: "SetupHousehold" }] }); // new user -> Setup 1
    } catch (e) {
      const msg = errorMessage(e);
      // Put a server error on the field it is about (e.g. "email already registered").
      if (/e-?mail/i.test(msg)) setErrors({ email: msg });
      else if (/password/i.test(msg)) setErrors({ pass: msg });
      else setError(msg);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior="padding">
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <FocusedStatusBar style="dark" />

      <Pressable onPress={() => navigation.goBack()} style={[styles.back, sh.sm]}>
        <ArrowLeft size={20} color={C.text} strokeWidth={2} />
      </Pressable>

      <View style={styles.head}>
        <BrandMark size={44} />
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.sub}>Join thousands of Filipino families managing bills smartly.</Text>
      </View>

      <Field label="First name" value={firstName} onChange={edit("firstName", setFirstName)} placeholder="Juan" error={errors.firstName} />
      <Field label="Last name" value={lastName} onChange={edit("lastName", setLastName)} placeholder="dela Cruz" error={errors.lastName} />
      <Field label="Email address" value={email} onChange={edit("email", setEmail)} placeholder="juan@email.com" keyboardType="email-address" error={errors.email} />
      <Field label="Password" value={pass} onChange={edit("pass", setPass)} placeholder="At least 8 characters" secureTextEntry error={errors.pass} />
      <Field label="Confirm password" value={confirm} onChange={edit("confirm", setConfirm)} placeholder="Re-enter your password" secureTextEntry error={errors.confirm} />

      <Pressable
        onPress={() => {
          setAgreed((a) => !a);
          setErrors((prev) => (prev.agreed ? { ...prev, agreed: undefined } : prev));
        }}
        style={styles.agreeRow}
      >
        <View style={[styles.checkbox, { backgroundColor: agreed ? C.primary : "#FFF", borderColor: agreed ? C.primary : errors.agreed ? C.red : "#C9DBFA" }]}>
          {agreed && <Check size={13} color="#FFF" strokeWidth={3} />}
        </View>
        <Text style={styles.agreeText}>
          I agree to BillWise's <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </Pressable>

      {errors.agreed ? <Text style={styles.error}>{errors.agreed}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: 8 }}>
        <Btn onPress={submit}>{loading ? "Creating account…" : "Create my account"}</Btn>
      </View>

      <Text style={styles.loginRow}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => navigation.goBack()}>Log in</Text>
      </Text>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 120 },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  head: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: "800", color: C.text, marginTop: 12 },
  sub: { fontSize: 14, color: C.sub, marginTop: 6, lineHeight: 21 },
  agreeRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 2, marginBottom: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  agreeText: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 20 },
  link: { color: C.primary, fontWeight: "600" },
  error: { color: C.red, fontSize: 13, marginTop: 4 },
  loginRow: { textAlign: "center", fontSize: 14, color: C.sub, marginTop: 22 },
});
