import React, { useState } from "react";
import { View, TextInput, KeyboardAvoidingView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { Btn } from "../../components/Atoms";
import { verifyGoogleOtp, verifyLoginOtp } from "../../api/auth";
import { errorMessage } from "../../api/client";
import { useSession } from "../../context/SessionContext";
import { useSetup } from "../../context/SetupContext";
import { clearDataCache } from "../../hooks/dataCache";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "GoogleOtp">;

export default function GoogleOtpScreen({ navigation, route }: Props) {
  // ✅ Grab the challengeId from the route params
  const { email, challengeId, type } = route.params;
  const { setUser } = useSession();
  const { reset } = useSetup();
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (otp.length < 6) return setError("Please enter the 6-digit code.");
    setLoading(true);
    setError(null);
    
    try {
      let user;
      
      // ✅ Pass the challengeId to the API functions
      if (type === "google") {
        user = await verifyGoogleOtp(challengeId, otp);
      } else {
        user = await verifyLoginOtp(challengeId, otp);
      }

      clearDataCache();
      setUser(user);
      reset();
      navigation.reset({ index: 0, routes: [{ name: user.setupCompleted ? "Home" : "SetupHousehold" }] });
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior="padding">
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.sub}>We sent a 6-digit code to {email}.</Text>

        <TextInput
          style={[styles.input, sh.sm]}
          value={otp}
          onChangeText={setOtp}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Btn onPress={submit}>{loading ? "Verifying..." : "Verify & Log in"}</Btn>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 80 },
  title: { fontSize: 28, fontWeight: "800", color: C.text },
  sub: { fontSize: 14, color: C.sub, marginTop: 8, marginBottom: 32 },
  input: { height: 60, backgroundColor: "#FFF", borderRadius: 16, paddingHorizontal: 20, fontSize: 24, letterSpacing: 8, textAlign: "center", marginBottom: 20 },
  error: { color: C.red, fontSize: 13, marginBottom: 16 },
});