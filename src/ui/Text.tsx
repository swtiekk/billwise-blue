import React, { createContext, useContext } from "react";
import { Text as RNText, TextProps, StyleSheet, TextStyle } from "react-native";
import { BASE_TEXT_SCALE, MAX_SYSTEM_FONT_MULTIPLIER, familyForWeight } from "../typography";
import { useTextScale } from "../context/TextSizeContext";

// Text inside Text (a link inside a sentence) should inherit the parent's font unless it sets its own.
const InsideText = createContext(false);

/**
 * Drop-in replacement for React Native's <Text>. It:
 *  1. uses Lexend, choosing the right font file from the style's fontWeight,
 *  2. applies the app-wide text scale (BASE_TEXT_SCALE x the Profile "Text size" setting),
 *  3. caps how much the phone's own font-size setting can enlarge it.
 * Screens keep writing fontSize / fontWeight exactly as before.
 */
export function Text({ style, children, maxFontSizeMultiplier = MAX_SYSTEM_FONT_MULTIPLIER, ...rest }: TextProps) {
  const nested = useContext(InsideText);
  const scale = useTextScale() * BASE_TEXT_SCALE;
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;

  const override: TextStyle = {};
  if (!nested || flat.fontWeight != null || flat.fontFamily != null) {
    override.fontFamily = flat.fontFamily ?? familyForWeight(flat.fontWeight);
    override.fontWeight = "normal"; // the font file already carries the weight
  }
  if (flat.fontSize != null) override.fontSize = Math.round(flat.fontSize * scale * 10) / 10;
  else if (!nested) override.fontSize = Math.round(14 * scale * 10) / 10;
  if (flat.lineHeight != null) override.lineHeight = Math.round(flat.lineHeight * scale * 10) / 10;

  return (
    <InsideText.Provider value={true}>
      <RNText {...rest} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[style, override]}>
        {children}
      </RNText>
    </InsideText.Provider>
  );
}
