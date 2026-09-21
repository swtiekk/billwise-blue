import React, { createContext, useContext } from "react";
import { Text as RNText, TextProps, StyleSheet, TextStyle } from "react-native";
import { BASE_TEXT_SCALE, MAX_SYSTEM_FONT_MULTIPLIER, familyForWeight } from "../typography";
import { useTextScale } from "../context/TextSizeContext";

// Text inside Text (a link inside a sentence) should inherit the parent's font unless it sets its own.
const InsideText = createContext(false);

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * Drop-in replacement for React Native's <Text>. It:
 *  1. uses Lexend, choosing the right font file from the style's fontWeight
 *     (the weight lives in the font name, so fontWeight itself is NOT sent to the phone),
 *  2. applies the app-wide text scale (BASE_TEXT_SCALE x the Profile "Text size" setting),
 *  3. tightens the letter-spacing of large text, so big numbers and titles look designed,
 *  4. caps how much the phone's own font-size setting can enlarge it.
 * Screens keep writing fontSize / fontWeight exactly as before.
 */
export function Text({ style, children, maxFontSizeMultiplier = MAX_SYSTEM_FONT_MULTIPLIER, ...rest }: TextProps) {
  const nested = useContext(InsideText);
  const scale = useTextScale() * BASE_TEXT_SCALE;
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;

  // Expo's documented way to use a custom font is the font name alone. Sending fontWeight as well can make
  // Android re-weight or ignore the font, so it is removed here.
  const { fontWeight, ...base } = flat;
  const final: TextStyle = { ...base };

  if (!nested || fontWeight != null || flat.fontFamily != null) {
    final.fontFamily = flat.fontFamily ?? familyForWeight(fontWeight);
  }

  const baseSize = flat.fontSize ?? (nested ? undefined : 14);
  if (baseSize != null) {
    final.fontSize = round(baseSize * scale);
    // Lexend is wide, so large sizes look loose; pull them in a little.
    if (flat.letterSpacing == null && baseSize >= 22) final.letterSpacing = round(-(baseSize >= 30 ? 0.03 : 0.02) * final.fontSize);
  }
  if (flat.lineHeight != null) final.lineHeight = round(flat.lineHeight * scale);

  return (
    <InsideText.Provider value={true}>
      <RNText {...rest} maxFontSizeMultiplier={maxFontSizeMultiplier} style={final}>
        {children}
      </RNText>
    </InsideText.Provider>
  );
}
