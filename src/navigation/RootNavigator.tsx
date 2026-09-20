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
import EditBillsScreen from "../screens/bills/EditBillsScreen";
import UpdateBillsScreen from "../screens/bills/UpdateBillsScreen";

import AboutScreen from "../screens/profile/AboutScreen";
import PrivacyScreen from "../screens/profile/PrivacyScreen";

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

      {/* First-time setup wizard */}
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

      {/* Profile > Edit Setup: the same setup screens, opened with saved data */}
      <Stack.Screen name="UpdateBills" component={UpdateBillsScreen} />
      <Stack.Screen name="EditHousehold" component={SetupHouseholdScreen} />
      <Stack.Screen name="EditIncome" component={SetupIncomeScreen} />
      <Stack.Screen name="EditBills" component={EditBillsScreen} />
      <Stack.Screen name="EditRanges" component={SetupRangesScreen} />

      {/* Other */}
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />

      {/* Bill entry */}
      <Stack.Screen name="ScanBill" component={ScanBillScreen} options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="BillForm" component={BillFormModal} options={{ animation: "slide_from_bottom" }} />
    </Stack.Navigator>
  );
}
