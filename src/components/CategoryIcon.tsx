import React from "react";
import { Zap, Droplets, Wifi, Home, ShieldCheck, Landmark, Smartphone, FileText } from "lucide-react-native";
import { C } from "../theme";
import type { BillCategory } from "../data";

// Re-created: your original file was missing. Same props as before (category, size, color).
const ICONS: Record<BillCategory, any> = {
  electricity: Zap,
  water: Droplets,
  internet: Wifi,
  rent: Home,
  insurance: ShieldCheck,
  loan: Landmark,
  phone: Smartphone,
  other: FileText,
};

export function CategoryIcon({
  category,
  size = 20,
  color = C.primary,
}: {
  category: BillCategory;
  size?: number;
  color?: string;
}) {
  const Icon = ICONS[category] ?? FileText;
  return <Icon size={size} color={color} strokeWidth={1.75} />;
}
