import React from "react";
import {
  User, Smartphone, Mail, Bell, Wallet, BarChart3, Lock, Globe, Palette,
  HelpCircle, Star, MessageSquare, PiggyBank, Landmark, Zap,
} from "lucide-react-native";

const MAP: Record<string, any> = {
  user: User, phone: Smartphone, mail: Mail, bell: Bell, wallet: Wallet,
  chart: BarChart3, lock: Lock, globe: Globe, palette: Palette,
  help: HelpCircle, star: Star, message: MessageSquare, savings: PiggyBank,
  loan: Landmark, electricity: Zap,
};

export function IconFromKey({ iconKey, size = 17, color = "#2563EB" }: { iconKey: string; size?: number; color?: string }) {
  const Icon = MAP[iconKey] ?? User;
  return <Icon size={size} color={color} strokeWidth={1.75} />;
}