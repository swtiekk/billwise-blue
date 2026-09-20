import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Tab } from "../components/TabBar";
import type { RootStackParamList } from "./routes";

const TAB_ROUTE: Record<Tab, "Home" | "Budget" | "Tips" | "Profile"> = {
  home: "Home",
  budget: "Budget",
  tips: "Tips",
  profile: "Profile",
};

/**
 * Tab switching. Each tab is a screen in the root stack; `replace` swaps the current tab
 * for the next one, so the stack stays one tab deep and the Android back button behaves
 * like a normal tab bar.
 */
export function useTabNav() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return useCallback((tab: Tab) => navigation.replace(TAB_ROUTE[tab]), [navigation]);
}
