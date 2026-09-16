// Blue theme — replaces the old teal theme.ts entirely.
// Colors ported from the new Figma Make version's Tailwind classes
// (blue-600 #2563EB, slate palette, rose/amber/emerald status colors).

export const C = {
  primary: "#2563EB",   // blue-600
  primaryDk: "#1D4ED8", // blue-700
  primaryLt: "#EFF6FF", // blue-50
  primaryMid: "#60A5FA",// blue-400
  bg: "#F0F4FF",         // page background
  surface: "#FFFFFF",
  text: "#1E293B",       // slate-800
  sub: "#475569",        // slate-600
  muted: "#94A3B8",       // slate-400
  border: "#F1F5F9",      // slate-100
  green: "#059669",       // emerald-600
  greenBg: "#ECFDF5",     // emerald-50
  amber: "#D97706",       // amber-600
  amberBg: "#FFFBEB",     // amber-50
  red: "#E11D48",         // rose-600
  redBg: "#FFF1F2",       // rose-50
  indigo: "#4338CA",
  indigoBg: "#EEF2FF",
  purple: "#7C3AED",
  purpleBg: "#FAF5FF",
};

// RN shadow props. This design uses much softer/subtler shadows than the
// teal version (card-shadow: 0 2px 16px rgba(37,99,235,0.08)) — blue-tinted,
// not pure black, which is what gives it that premium-fintech look.
export const sh = {
  sm: {
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  btn: {
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// This design's hero header gradient (.risk-gradient):
// linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)
export const HERO_GRADIENT = ["#1D4ED8", "#2563EB", "#3B82F6"] as const;

export const FF = "Inter_400Regular";
export const FF_MED = "Inter_500Medium";
export const FF_BOLD = "Inter_700Bold";
export const FF_BLACK = "Inter_800ExtraBold";

export function fmt(n: number) {
  return `₱${n.toLocaleString("en-PH")}`;
}