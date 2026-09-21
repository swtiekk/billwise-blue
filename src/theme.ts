// Piso theme. Same token names as before, so every screen picks up the new look at once.
// Palette: bright blue for actions, deep blue for text, pale cloud for pages, Piso gold for money.

export const C = {
  primary: "#1F6FFF",    // bright: actions
  primaryDk: "#1553D6",  // pressed / deeper
  primaryLt: "#DCEBFF",  // tint: icon circles, soft tiles
  primaryMid: "#5B9BFF",
  bg: "#F1F7FF",         // cloud: page background
  surface: "#FFFFFF",
  text: "#12295F",       // deep blue instead of grey-black
  sub: "#3E5590",
  muted: "#5A73A8",
  border: "#DCE8FB",
  green: "#0B8F6A",      // stable
  greenBg: "#D3F3E8",
  amber: "#C2550B",      // tight / warning (text-safe orange)
  amberBg: "#FFE9D6",
  red: "#D6304A",        // critical
  redBg: "#FFE6EA",
  indigo: "#3B4FD8",
  indigoBg: "#E8ECFF",
  purple: "#6D4AE8",
  purpleBg: "#F1ECFF",
  gold: "#FFC533",       // Piso gold: money moments only
  goldDk: "#B57F00",
  goldBg: "#FFF0C7",
  goldText: "#4A3300",
};

// Soft, blue-tinted shadows (very light: the design is mostly flat).
export const sh = {
  sm: { shadowColor: C.primary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  md: { shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 3 },
  lg: { shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 6 },
  btn: { shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4 },
} as const;

// Screens that still use a gradient header get the new blues.
export const HERO_GRADIENT = ["#1553D6", "#1F6FFF", "#3D86FF"] as const;

// Font names now live in src/typography.ts; these keep old imports working.
export const FF = "Lexend_400Regular";
export const FF_MED = "Lexend_500Medium";
export const FF_BOLD = "Lexend_700Bold";
export const FF_BLACK = "Lexend_800ExtraBold";

export function fmt(n: number) {
  return `₱${n.toLocaleString("en-PH")}`;
}
