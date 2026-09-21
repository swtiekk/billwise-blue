/**
 * All font settings live here.
 *
 *  BASE_TEXT_SCALE   one knob that resizes every text in the app (1 = as designed, 0.95 = 5% smaller).
 *  TEXT_SIZE_SCALE   what the "Text size" setting on Profile applies on top (Small / Default / Large).
 *  MAX_SYSTEM_FONT_MULTIPLIER   how far the phone's own font-size setting may enlarge text.
 */
export type TextSizeKey = "small" | "default" | "large";

export const BASE_TEXT_SCALE = 1;

export const TEXT_SIZE_SCALE: Record<TextSizeKey, number> = { small: 0.9, default: 1, large: 1.15 };

export const MAX_SYSTEM_FONT_MULTIPLIER = 1.2;

/** Lexend, loaded in App.tsx. Each weight is its own font, so the weight lives in the family name. */
export const FONT = {
  regular: "Lexend_400Regular",
  medium: "Lexend_500Medium",
  semibold: "Lexend_600SemiBold",
  bold: "Lexend_700Bold",
  black: "Lexend_800ExtraBold",
} as const;

export function familyForWeight(weight?: string | number): string {
  const w = String(weight ?? "400");
  if (w === "bold" || w === "700") return FONT.bold;
  if (w === "800" || w === "900") return FONT.black;
  if (w === "600") return FONT.semibold;
  if (w === "500") return FONT.medium;
  return FONT.regular;
}

/** Size guide for new components (before scaling). */
export const T = { display: 30, title: 22, heading: 16, body: 14, small: 12, tiny: 11 } as const;
