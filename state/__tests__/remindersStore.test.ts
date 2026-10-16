import { Readiness, warningKey } from "../remindersStore";

const r = (steps: Readiness["steps"]): Readiness => ({
  loaded: true,
  steps,
  oem: null,
  batteryPage: "appInfo",
  done: steps.filter((s) => s.ok).length,
  total: steps.length,
  ready: steps.every((s) => s.ok),
});

test("notifications off wins over exact time off (X1/X2)", () => {
  expect(warningKey(r([{ key: "notifications", ok: false }, { key: "exactAlarms", ok: false }]))).toBe("notifications");
  expect(warningKey(r([{ key: "notifications", ok: true }, { key: "exactAlarms", ok: false }]))).toBe("exactAlarms");
});

test("battery or App launch alone do not show the paid-time warning", () => {
  expect(warningKey(r([{ key: "notifications", ok: true }, { key: "battery", ok: false }, { key: "launch", ok: false, manual: true }]))).toBeNull();
  expect(warningKey({ ...r([]), loaded: false })).toBeNull();
});
