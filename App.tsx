import React from "react";
import { StatusBar, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import {
  useFonts,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
  Lexend_800ExtraBold,
} from "@expo-google-fonts/lexend";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { C } from "./src/theme";
import { SessionProvider } from "./src/context/SessionContext";
import { SetupProvider } from "./src/context/SetupContext";
import { TextSizeProvider } from "./src/context/TextSizeContext";
import { navigationRef } from "./src/navigation/navigationRef";
import RootNavigator from "./src/navigation/RootNavigator";
import { configureNotifications } from "./src/notifications/reminders";
import { NotificationHandler } from "./src/notifications/NotificationHandler";

// Show bill reminders even while the app is open.
configureNotifications();

export default function App() {
  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["left", "right"]}>
        <StatusBar translucent backgroundColor="transparent" />
        <TextSizeProvider>
        <SessionProvider>
          <SetupProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
              <NotificationHandler />
            </NavigationContainer>
          </SetupProvider>
        </SessionProvider>
        </TextSizeProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});
