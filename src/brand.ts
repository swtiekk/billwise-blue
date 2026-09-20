/**
 * Gold accent: used ONLY for money moments (the payday ring, the peso sign, loaders).
 * Risk status keeps its own green / amber / red so gold is never mistaken for a warning.
 * Kept in its own file so your theme.ts stays untouched.
 */
export const GOLD = {
  gold: "#F5B301",  // on light backgrounds (icons)
  light: "#FFCF4A", // on the blue gradient
  bg: "#FFF8E1",
  dark: "#5C3D00",  // text on gold
} as const;
