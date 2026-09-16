import React from "react";
import {
  Zap, Droplets, Wifi, Home, ShieldCheck, Landmark, Smartphone, FileText,
} from "lucide-react-native";
import type { BillCategory } from "../data";

export function CategoryIcon({
  category,
  size = 18,
  color = "#2563EB",
}: {
  category: BillCategory;
  size?: number;
  color?: string;
}) {
  const props = { size, color, strokeWidth: 1.75 };
  switch (category) {
    case "electricity": return <Zap {...props} />;
    case "water": return <Droplets {...props} />;
    case "internet": return <Wifi {...props} />;
    case "rent": return <Home {...props} />;
    case "insurance": return <ShieldCheck {...props} />;
    case "loan": return <Landmark {...props} />;
    case "phone": return <Smartphone {...props} />;
    default: return <FileText {...props} />;
  }
}