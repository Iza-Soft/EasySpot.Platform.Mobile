import { useWindowDimensions } from "react-native";
import { spacing } from "../theme/tokens";

/**
 * Font scaling caps (Text.tsx). The phone's text size still matters, but our
 * dense rows (label + button side by side) can't grow without limit.
 *  - FIXED:  numbers and labels inside fixed shapes (B2, PARK circle, tiles)
 *  - UI:     labels, buttons, chips, row titles
 *  - READ:   longer text that is read, not scanned (hints, legal texts)
 */
export const FONT_CAP = { FIXED: 1.0, UI: 1.15, READ: 1.2 } as const;

/** Below this width (in dp, corrected for the text size) rows switch to their narrow layout. */
const COMPACT_WIDTH = 380;

/**
 * true on narrow screens or with a large text size: a phone at the default
 * "display size" (~360 dp) or with text set to "Large". Rows then move their
 * buttons below the text or show icon-only buttons, so nothing is squeezed.
 * A phone with small display size and small text keeps the wide layout.
 */
export function useCompact(): boolean {
  const { width, fontScale } = useWindowDimensions();
  const scale = Math.min(Math.max(fontScale, 1), FONT_CAP.READ);
  return width / scale < COMPACT_WIDTH;
}

/** Side margin of a screen: 20 dp, 16 dp on narrow screens. */
export function useGutter(): number {
  return useCompact() ? spacing.lg : spacing.xl;
}
