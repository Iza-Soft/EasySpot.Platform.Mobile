import type { TabParamList } from "./types";

/**
 * Screens that are switched on while 2.0 is reviewed screen by screen.
 * A disabled tab stays visible in the bar but is dimmed and cannot be opened.
 * Turn a screen back on here once it has been reviewed.
 */
export const ENABLED_TABS: Record<keyof TabParamList, boolean> = {
  Park: true,
  Spots: true,
  Settings: true,
};

export const isTabEnabled = (name: string): boolean =>
  (ENABLED_TABS as Record<string, boolean>)[name] ?? false;
