import { androidMapApps, defaultMap, iosMapApps, Maps, packageForChoice, resolveMap } from "../maps";

const sys = (...pkgs: string[]) => pkgs.map((p) => ({ packageName: p, label: p.split(".").pop()!, icon: null }));

test("Samsung with only Google Maps: Google Maps + OpenStreetMap", () => {
  expect(androidMapApps(sys("com.google.android.apps.maps")).map((a) => a.id)).toEqual([Maps.google, Maps.osm]);
});

test("a newly installed app appears; unknown apps get their own id and the phone's name", () => {
  const apps = androidMapApps(sys("com.example.navi", "com.waze", "com.google.android.apps.maps", "com.here.app.maps"));
  expect(apps.map((a) => a.id)).toEqual([Maps.google, Maps.waze, Maps.here, "app:com.example.navi", Maps.osm]);
  expect(apps[3].label).toBe("navi");
});

test("OsmAnd and OsmAnd+ both installed show once", () => {
  expect(androidMapApps(sys("net.osmand", "net.osmand.plus")).filter((a) => a.id === Maps.osmand)).toHaveLength(1);
});

test("Huawei: Petal Maps is the default; Samsung: Google Maps", () => {
  const apps = androidMapApps(sys("com.google.android.apps.maps", "com.huawei.maps.app"));
  expect(defaultMap(apps, true)).toBe(Maps.petal);
  expect(defaultMap(apps, false)).toBe(Maps.google);
  expect(defaultMap(androidMapApps([]), false)).toBe(Maps.osm);
});

test("the chosen app was removed → back to the phone's main map", () => {
  const apps = androidMapApps(sys("com.google.android.apps.maps"));
  expect(resolveMap(Maps.waze, apps, false)).toBe(Maps.google);
  expect(resolveMap(Maps.osm, apps, false)).toBe(Maps.osm);
  expect(resolveMap(Maps.bing, apps, false)).toBe(Maps.google);
});

test("iPhone: Apple Maps + installed apps + OpenStreetMap", () => {
  expect(iosMapApps((id) => id === Maps.waze).map((a) => a.id)).toEqual([Maps.apple, Maps.waze, Maps.osm]);
});

test("package for a saved choice", () => {
  expect(packageForChoice(Maps.waze)).toBe("com.waze");
  expect(packageForChoice("app:com.example.navi")).toBe("com.example.navi");
  expect(packageForChoice(Maps.osm)).toBeUndefined();
});
