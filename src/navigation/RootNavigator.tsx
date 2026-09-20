import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./routes";

import SplashScreen from "../screens/auth/SplashScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";

import SetupHouseholdScreen from "../screens/setup/SetupHouseholdScreen";
import SetupIncomeScreen from "../screens/setup/SetupIncomeScreen";
import SetupBillsScreen from "../screens/setup/SetupBillsScreen";
import SetupRangesScreen from "../screens/setup/SetupRangesScreen";
import AnalysisScreen from "../screens/setup/AnalysisScreen";

import HomeScreen from "../screens/tabs/HomeScreen";
import BudgetScreen from "../screens/tabs/BudgetScreen";
import TipsScreen from "../screens/tabs/TipsScreen";
import ProfileScreen from "../screens/tabs/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ScanBillScreen from "../screens/bills/ScanBillScreen";
import BillFormModal from "../screens/bills/BillFormModal";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      {/* Entry + auth */}
      <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: "fade" }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} />

      {/* Setup wizard */}
      <Stack.Screen name="SetupHousehold" component={SetupHouseholdScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="SetupIncome" component={SetupIncomeScreen} />
      <Stack.Screen name="SetupBills" component={SetupBillsScreen} />
      <Stack.Screen name="SetupRanges" component={SetupRangesScreen} />
      <Stack.Screen name="Analysis" component={AnalysisScreen} options={{ animation: "fade", gestureEnabled: false }} />

      {/* Tabs */}
      <Stack.Screen name="Home" component={HomeScreen} options={{ animation: "none", gestureEnabled: false }} />
      <Stack.Screen name="Budget" component={BudgetScreen} options={{ animation: "none", gestureEnabled: false }} />
      <Stack.Screen name="Tips" component={TipsScreen} options={{ animation: "none", gestureEnabled: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: "none", gestureEnabled: false }} />

      {/* Over the tabs */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ScanBill" component={ScanBillScreen} options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="BillForm" component={BillFormModal} options={{ animation: "slide_from_bottom" }} />
    </Stack.Navigator>
  );
}
