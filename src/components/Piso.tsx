import React from "react";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

export type PisoMood = "happy" | "worried" | "party";

const INK = "#12295F";
const GOLD = "#FFC533";
const RIM = "#E0A100";

/**
 * Piso, the gold coin. Drawn from simple shapes, so there are no image files.
 * happy = Stable, worried = At risk / Critical, party = everything paid.
 */
export function Piso({ size = 64, mood = "happy" }: { size?: number; mood?: PisoMood }) {
  if (mood === "party") {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d="M32 0 L22 15 L42 15Z" fill="#1F6FFF" />
        <Circle cx={32} cy={1.5} r={3} fill="#B9D6FF" />
        <Circle cx={32} cy={36} r={26} fill={GOLD} />
        <Circle cx={32} cy={36} r={20} fill="none" stroke={RIM} strokeWidth={2} />
        <Path d="M21 33 Q24 28 27 33 M37 33 Q40 28 43 33" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Ellipse cx={32} cy={45} rx={6} ry={5} fill={INK} />
        <Circle cx={12} cy={26} r={2.5} fill="#1F6FFF" />
        <Circle cx={53} cy={28} r={2.5} fill="#1F6FFF" />
      </Svg>
    );
  }

  const worried = mood === "worried";
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx={32} cy={32} r={29} fill={GOLD} />
      <Circle cx={32} cy={32} r={23} fill="none" stroke={RIM} strokeWidth={2} />
      <Ellipse cx={24} cy={worried ? 29 : 28} rx={3} ry={4.5} fill={INK} />
      <Ellipse cx={40} cy={worried ? 29 : 28} rx={3} ry={4.5} fill={INK} />
      {worried ? (
        <>
          <Path d="M19 22 L28 25 M45 22 L36 25" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M24 43 Q32 37 40 43" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Path d="M53 16 Q57 23 53 26 Q49 23 53 16Z" fill="#8FB4FF" />
        </>
      ) : (
        <>
          <Path d="M23 38 Q32 46 41 38" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Circle cx={18} cy={37} r={4} fill="#FF9E6B" opacity={0.55} />
          <Circle cx={46} cy={37} r={4} fill="#FF9E6B" opacity={0.55} />
        </>
      )}
    </Svg>
  );
}
