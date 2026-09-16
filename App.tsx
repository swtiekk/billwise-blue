import React, { useState } from "react";
import { StatusBar, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { C } from "./src/theme";
import { Tab } from "./src/components/TabBar";
import { Bill, INITIAL_BILLS } from "./src/data";

import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import HomeScreen from "./src/screens/HomeScreen";
import BillsScreen from "./src/screens/BillsScreen";
import AddBillScreen from "./src/screens/AddBillScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import BudgetScreen from "./src/screens/BudgetScreen";
import RecommendationsScreen from "./src/screens/RecommendationsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createNativeStackNavigator();

// Each Tab maps to the route that's the "home" screen for that tab —
// used to translate TabBar taps (which only know about Tab ids) into
// real navigation.navigate() calls.
const TAB_ROOT: Record<Tab, string> = {
  home: "Home",
  bills: "Bills",
  scan: "Scanner",
  budget: "Budget",
  profile: "Profile",
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Bills live at the App root so both Home and Bills screens share one
  // source of truth (mirrors the web version's `useState<Bill[]>` in App()).
  const [bills] = useState<Bill[]>(INITIAL_BILLS);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
            <Stack.Screen name="Login">
              {({ navigation }) => (
                <LoginScreen
                  onLogin={() => navigation.replace("Home" as never)}
                  onGoToSignup={() => navigation.navigate("Signup" as never)}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Signup">
              {({ navigation }) => (
                <SignupScreen
                  onSignup={() => navigation.replace("Home" as never)}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Home">
              {({ navigation }) => (
                <HomeScreen
                  bills={bills}
                  onNavTab={(t) => navigation.navigate(TAB_ROOT[t] as never)}
                  onAddBill={() => navigation.navigate("AddBill" as never)}
                  onBudget={() => navigation.navigate("Budget" as never)}
                  onInsights={() => navigation.navigate("Recommendations" as never)}
                  onSeeAllBills={() => navigation.navigate("Bills" as never)}
                  onOpenBill={() => navigation.navigate("AddBill" as never)}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Bills">
              {({ navigation }) => (
                <BillsScreen
                  bills={bills}
                  onNavTab={(t) => navigation.navigate(TAB_ROOT[t] as never)}
                  onAddBill={() => navigation.navigate("AddBill" as never)}
                  onOpenBill={() => navigation.navigate("AddBill" as never)}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="AddBill">
              {({ navigation }) => (
                <AddBillScreen
                  onBack={() => navigation.goBack()}
                  onScan={() => navigation.navigate("Scanner" as never)}
                  onSave={() => navigation.navigate("Bills" as never)}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Scanner" options={{ animation: "slide_from_bottom" }}>
              {({ navigation }) => (
                <ScannerScreen
                  onBack={() => navigation.goBack()}
                  onSave={() => navigation.navigate("Bills" as never)}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Budget">
              {({ navigation }) => (
                <BudgetScreen onNavTab={(t) => navigation.navigate(TAB_ROOT[t] as never)} />
              )}
            </Stack.Screen>

            <Stack.Screen name="Recommendations">
              {({ navigation }) => (
                <RecommendationsScreen onNavTab={(t) => navigation.navigate(TAB_ROOT[t] as never)} />
              )}
            </Stack.Screen>

            <Stack.Screen name="Profile">
              {({ navigation }) => (
                <ProfileScreen
                  onNavTab={(t) => navigation.navigate(TAB_ROOT[t] as never)}
                  onLogout={() => navigation.reset({ index: 0, routes: [{ name: "Login" }] })}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});