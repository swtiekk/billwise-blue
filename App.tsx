import React from "react";
import { StatusBar, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { C } from "./src/theme";
import { SessionProvider } from "./src/context/SessionContext";
import { SetupProvider } from "./src/context/SetupContext";
import { navigationRef } from "./src/navigation/navigationRef";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["left", "right"]}>
        <StatusBar translucent backgroundColor="transparent" />
        <SessionProvider>
          <SetupProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
          </SetupProvider>
        </SessionProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});
