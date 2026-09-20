import React from "react";
import { useIsFocused } from "@react-navigation/native";
import { StatusBar, StatusBarProps } from "expo-status-bar";

// Re-created: your original file was missing. Only the screen in front controls the status bar.
export function FocusedStatusBar(props: StatusBarProps) {
  const isFocused = useIsFocused();
  return isFocused ? <StatusBar {...props} /> : null;
}

