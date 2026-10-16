import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { palette } from "../theme/tokens";

/** The "Bay" mark — same geometry as the app icon. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 108 108" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect width={108} height={108} rx={26} fill={palette.volt} />
      <Path d="M30 80 V32 H78 V80" fill="none" stroke={palette.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={54} cy={60} r={10} fill={palette.ink} />
    </Svg>
  );
}
