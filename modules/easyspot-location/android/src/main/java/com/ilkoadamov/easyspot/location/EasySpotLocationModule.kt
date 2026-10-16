package com.ilkoadamov.easyspot.location

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Location for every Android phone — the best engine the phone already has:
 *
 *  1. Phone with REAL Google Play services (Samsung, Xiaomi …) → Google's fused
 *     engine (GPS + Wi-Fi + cell + sensors). Indoors ±5–10 m instead of the
 *     ±30–40 m LocationManager gives (measured on a Samsung S22+).
 *  2. Otherwise — incl. microG on a Huawei — or if (1) fails → the system LocationManager: GPS, network
 *     and, on Android 12+, the system fused provider. This is the Huawei
 *     (no GMS) path. Huawei's own fused engine (HMS Location Kit) may be
 *     added later if Huawei tests show poor indoor accuracy.
 *
 * GMS presence is checked at runtime, so one APK serves Google Play and
 * AppGallery; on a phone without GMS the Google code is never called.
 */
class EasySpotLocationModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("EasySpotLocation")

    Function("getServicesInfo") {
      mapOf(
        "gms" to isPackageEnabled("com.google.android.gms"),
        // microG (installable on Huawei) uses the same package name as Google Play services.
        "gmsLabel" to packageLabel("com.google.android.gms"),
        "gmsUsable" to hasGooglePlayServices(),
        "hms" to isPackageEnabled("com.huawei.hwid"),
        "hasBarometer" to hasBarometer(),
        "manufacturer" to Build.MANUFACTURER,
        "sdkInt" to Build.VERSION.SDK_INT
      )
    }

    // fresh = true when the fix will be SAVED (Save sheet): a remembered fix is
    // reused only if it is ≤ 15 m, otherwise a new one is measured.
    // fresh = false (Home): any fix from the last minute is fine — fast.
    // ── Device helpers for Settings / navigation (Kotlin, no libraries) ──

    /** Which of these packages are installed (needs the <queries> from plugins/with-map-queries.js). */
    Function("installedPackages") { packages: List<String> ->
      packages.filter { isPackageEnabled(it) }
    }

    /**
     * Every app on this phone that can show a geo: point — i.e. the installed
     * navigation / map apps (Google Maps, Waze, Petal Maps, HERE, Sygic, OsmAnd …),
     * found by the system, not from a fixed list. Name and icon come from the phone.
     * Needs the geo: <queries> entry from plugins/with-map-queries.js (Android 11+).
     */
    Function("listMapApps") {
      val pm = context.packageManager
      val probe = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse("geo:0,0?q=0,0"))
      @Suppress("DEPRECATION")
      val found = if (Build.VERSION.SDK_INT >= 33) {
        pm.queryIntentActivities(probe, PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_ALL.toLong()))
      } else {
        pm.queryIntentActivities(probe, PackageManager.MATCH_ALL)
      }
      found
        .mapNotNull { it.activityInfo?.applicationInfo }
        .filter { it.enabled && it.packageName != context.packageName }
        .distinctBy { it.packageName }
        .map { app ->
          mapOf(
            "packageName" to app.packageName,
            "label" to pm.getApplicationLabel(app).toString(),
            "icon" to iconPng(pm.getApplicationIcon(app))
          )
        }
    }

    /** Opens a geo: point in ONE specific app (Google Maps, Waze, Petal Maps, HERE). false if it can't. */
    Function("openGeoInApp") { pkg: String, lat: Double, lng: Double, label: String? ->
      try {
        val q = if (label.isNullOrBlank()) "$lat,$lng" else "$lat,$lng(${android.net.Uri.encode(label)})"
        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse("geo:$lat,$lng?q=$q"))
          .setPackage(pkg)
          .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        true
      } catch (e: Exception) {
        false
      }
    }

    // ── Reminders setup (mockups W1–W3): what may stop the parking reminder ──

    /**
     * notifications — app notifications on and the parking channel not muted;
     * exactAlarms — the alarm fires on the minute (USE_EXACT_ALARM / SCHEDULE_EXACT_ALARM);
     * battery     — EasySpot is "Unrestricted" (not battery-optimised);
     * oem         — "huawei" / "xiaomi": an extra manual setting the phone does not report;
     * batteryPage — which page Fix opens: "appInfo" (Battery → Unrestricted) or "list".
     */
    Function("getReminderStatus") {
      val nm = androidx.core.app.NotificationManagerCompat.from(context)
      var notifications = nm.areNotificationsEnabled()
      if (notifications && Build.VERSION.SDK_INT >= 26) {
        val ch = nm.getNotificationChannel("parking_channel")
        if (ch != null && ch.importance == android.app.NotificationManager.IMPORTANCE_NONE) notifications = false
      }
      val am = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
      val exact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()
      val pm = context.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
      mapOf(
        "notifications" to notifications,
        "exactAlarms" to exact,
        "battery" to pm.isIgnoringBatteryOptimizations(context.packageName),
        "oem" to oemKind(),
        "batteryPage" to if (oemKind() == "huawei" || Build.VERSION.SDK_INT < 31) "list" else "appInfo",
        "sdkInt" to Build.VERSION.SDK_INT
      )
    }

    /**
     * Opens the system page for one step: "notifications" | "exactAlarms" | "battery" | "launch".
     * Returns which page opened ("exact" = the page for that step, "battery" = the phone's
     * Battery page, "appInfo" = EasySpot's app info) or null. Each candidate is tried in turn:
     * newer Huawei (HarmonyOS / EMUI 12+) protect the App launch page (Pura 70 Ultra), so it falls back
     * to Battery, where "App launch" is one tap away (the steps on screen say so).
     */
    Function("openReminderSetting") { kind: String ->
      val pkg = context.packageName
      val appInfo = android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
        .setData(android.net.Uri.fromParts("package", pkg, null))
      val battery = android.content.Intent(android.content.Intent.ACTION_POWER_USAGE_SUMMARY)
      val candidates = mutableListOf<Pair<String, android.content.Intent>>()
      when (kind) {
        "notifications" -> if (Build.VERSION.SDK_INT >= 26) {
          candidates += "exact" to android.content.Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, pkg)
        }
        "exactAlarms" -> if (Build.VERSION.SDK_INT >= 31) {
          candidates += "exact" to android.content.Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
            .setData(android.net.Uri.fromParts("package", pkg, null))
        }
        "battery" -> if (oemKind() != "huawei" && Build.VERSION.SDK_INT >= 31) {
          candidates += "exact" to appInfo // Battery → Unrestricted
        } else {
          candidates += "exact" to android.content.Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        }
        "launch" -> {
          for ((p, c) in LAUNCH_PAGES) {
            candidates += "exact" to android.content.Intent().setComponent(android.content.ComponentName(p, c))
          }
          if (oemKind() == "huawei") {
            // Phone Manager → Battery (App launch is listed there).
            candidates += "battery" to android.content.Intent().setComponent(
              android.content.ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.power.ui.HwPowerManagerActivity")
            )
          } else {
            candidates += "exact" to android.content.Intent("miui.intent.action.OP_AUTO_START")
              .addCategory(android.content.Intent.CATEGORY_DEFAULT)
          }
          candidates += "battery" to battery
        }
      }
      candidates += "appInfo" to appInfo
      val pm = context.packageManager
      candidates.firstOrNull { (_, intent) ->
        // Only a page we are really allowed to open: it exists, is exported and needs no
        // permission we lack. Otherwise Huawei shows a stuck "Open with — No apps can
        // perform this action" sheet instead of failing (Pura 70 Ultra).
        // (Needs the <queries> from plugins/with-parking-module.js to see those pages.)
        // Checked only for the phone-maker pages (App launch / Autostart / Battery fallback);
        // the standard Android settings pages always open and are not visible to this check.
        if (kind == "launch" && intent != appInfo && !canOpen(pm, intent)) {
          android.util.Log.d("EasySpotLocation", "openReminderSetting($kind): ${intent.component ?: intent.action} → not allowed / missing")
          return@firstOrNull false
        }
        try {
          context.startActivity(intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK))
          true
        } catch (e: Exception) {
          android.util.Log.d("EasySpotLocation", "openReminderSetting($kind): ${intent.component ?: intent.action} → ${e.javaClass.simpleName}")
          false
        }
      }?.first
    }

    /** true when the system will NOT kill/delay our reminders to save battery. */
    Function("isIgnoringBatteryOptimizations") {
      val pm = context.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
      pm.isIgnoringBatteryOptimizations(context.packageName)
    }

    /** Android 13+: the system "App language" page for EasySpot; older: the system language page. */
    Function("openAppLanguageSettings") {
      try {
        val intent = if (Build.VERSION.SDK_INT >= 33) {
          android.content.Intent(android.provider.Settings.ACTION_APP_LOCALE_SETTINGS)
            .setData(android.net.Uri.fromParts("package", context.packageName, null))
        } else {
          android.content.Intent(android.provider.Settings.ACTION_LOCALE_SETTINGS)
        }
        context.startActivity(intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK))
        true
      } catch (e: Exception) {
        false
      }
    }

    /**
     * Address for a point, from the phone's own geocoder (Google on GMS phones,
     * microG/OSM or Huawei on Huawei) — no external service. Same fields as
     * expo-location returned before, so services/geocoding.ts is unchanged.
     * Android 13+: the non-blocking API; older: on a background thread.
     */
    AsyncFunction("reverseGeocodeAsync") { lat: Double, lng: Double, promise: Promise ->
      if (!android.location.Geocoder.isPresent()) {
        promise.reject("E_GEOCODER", "Geocoder is not running", null)
        return@AsyncFunction
      }
      val geocoder = android.location.Geocoder(context, java.util.Locale.getDefault())
      if (Build.VERSION.SDK_INT >= 33) {
        geocoder.getFromLocation(lat, lng, 1, object : android.location.Geocoder.GeocodeListener {
          override fun onGeocode(addresses: MutableList<android.location.Address>) {
            promise.resolve(addresses.map { addressMap(it) })
          }
          override fun onError(errorMessage: String?) {
            promise.reject("E_GEOCODER", errorMessage ?: "Geocoder failed", null)
          }
        })
      } else {
        Thread {
          try {
            @Suppress("DEPRECATION")
            val list = geocoder.getFromLocation(lat, lng, 1) ?: emptyList()
            promise.resolve(list.map { addressMap(it) })
          } catch (e: Exception) {
            promise.reject("E_GEOCODER", e.message ?: "Geocoder failed", e)
          }
        }.start()
      }
    }

    /**
     * Air pressure in hPa — median of the readings during `sampleMs` (smooths out
     * noise), or null when the phone has no barometer (e.g. Pura 70 Ultra).
     * For the level-from-barometer feature (stage 2).
     */
    AsyncFunction("getPressureAsync") { sampleMs: Int, promise: Promise ->
      val sm = context.getSystemService(Context.SENSOR_SERVICE) as android.hardware.SensorManager
      val sensor = sm.getDefaultSensor(android.hardware.Sensor.TYPE_PRESSURE)
      if (sensor == null) {
        promise.resolve(null)
        return@AsyncFunction
      }
      val values = mutableListOf<Float>()
      val handler = Handler(Looper.getMainLooper())
      val listener = object : android.hardware.SensorEventListener {
        override fun onSensorChanged(e: android.hardware.SensorEvent) {
          values += e.values[0]
        }
        override fun onAccuracyChanged(s: android.hardware.Sensor?, accuracy: Int) {}
      }
      sm.registerListener(listener, sensor, android.hardware.SensorManager.SENSOR_DELAY_UI, handler)
      handler.postDelayed({
        sm.unregisterListener(listener)
        if (values.isEmpty()) promise.resolve(null)
        else promise.resolve(values.sorted()[values.size / 2].toDouble())
      }, sampleMs.toLong().coerceIn(200L, 10_000L))
    }

    AsyncFunction("getCurrentPositionAsync") { timeoutMs: Int, fresh: Boolean, promise: Promise ->
      if (!hasLocationPermission()) {
        promise.reject("E_NO_PERMISSION", "Location permission not granted", null)
      } else if (useGoogleFused()) {
        getFromGoogleFused(timeoutMs.toLong(), fresh, promise)
      } else {
        getCurrentPosition(timeoutMs.toLong(), fresh, promise)
      }
    }
  }

  /** android.location.Address → the same fields expo-location used (records/LocationResults.kt). */
  private fun addressMap(a: android.location.Address): Map<String, Any?> = mapOf(
    "city" to a.locality,
    "district" to a.subLocality,
    "streetNumber" to a.subThoroughfare,
    "street" to a.thoroughfare,
    "region" to a.adminArea,
    "subregion" to a.subAdminArea,
    "country" to a.countryName,
    "postalCode" to a.postalCode,
    "name" to a.featureName,
    "isoCountryCode" to a.countryCode,
    "formattedAddress" to if (a.maxAddressLineIndex < 0) null else (0..a.maxAddressLineIndex).joinToString(", ") { a.getAddressLine(it) }
  )

  private fun packageLabel(pkg: String): String? = try {
    @Suppress("DEPRECATION")
    context.packageManager.getApplicationLabel(context.packageManager.getApplicationInfo(pkg, 0)).toString()
  } catch (e: Exception) {
    null
  }

  private fun hasBarometer(): Boolean = try {
    val sm = context.getSystemService(Context.SENSOR_SERVICE) as android.hardware.SensorManager
    sm.getDefaultSensor(android.hardware.Sensor.TYPE_PRESSURE) != null
  } catch (e: Exception) {
    false
  }

  private fun isPackageEnabled(pkg: String): Boolean = try {
    @Suppress("DEPRECATION")
    context.packageManager.getApplicationInfo(pkg, 0).enabled
  } catch (e: PackageManager.NameNotFoundException) {
    false
  }

  private fun hasGooglePlayServices(): Boolean = try {
    GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS
  } catch (t: Throwable) {
    false
  }

  /**
   * microG reuses the Google Play services package name and answers "available",
   * but its fused location is weaker than the phone's own providers
   * (Huawei Pura 70 Ultra: microG ±15–20 m, system LocationManager ±5 m).
   */
  private fun isMicroG(): Boolean =
    packageLabel("com.google.android.gms")?.contains("microg", ignoreCase = true) == true

  /** Google's fused engine only with REAL Google Play services. */
  private fun useGoogleFused(): Boolean = !isMicroG() && hasGooglePlayServices()

  /** Google's fused engine; falls back to LocationManager on any failure or no fix. */
  @SuppressLint("MissingPermission") // checked before the call
  private fun getFromGoogleFused(timeoutMs: Long, fresh: Boolean, promise: Promise) {
    val settled = AtomicBoolean(false)
    fun fallback(reason: String) {
      if (!settled.compareAndSet(false, true)) return
      android.util.Log.i(TAG, "Google fused unavailable ($reason) — using LocationManager")
      getCurrentPosition(timeoutMs, fresh, promise)
    }
    fun measure(client: com.google.android.gms.location.FusedLocationProviderClient) {
      val request = CurrentLocationRequest.Builder()
        .setPriority(Priority.PRIORITY_HIGH_ACCURACY)
        // fresh: never hand back a remembered fix — measure now.
        .setMaxUpdateAgeMillis(if (fresh) 0L else FRESH_MS)
        .setDurationMillis(timeoutMs)
        .build()
      client.getCurrentLocation(request, CancellationTokenSource().token)
        .addOnSuccessListener { loc ->
          if (loc == null) fallback("no fix")
          else if (settled.compareAndSet(false, true)) promise.resolve(loc.toMap())
        }
        .addOnFailureListener { e -> fallback(e.message ?: e.javaClass.simpleName) }
    }
    try {
      val client = LocationServices.getFusedLocationProviderClient(context)
      if (!fresh) {
        measure(client)
        return
      }
      // fresh: a remembered fix only if it is recent AND accurate (≤ 15 m).
      client.lastLocation
        .addOnSuccessListener { last ->
          if (last != null && System.currentTimeMillis() - last.time < FRESH_MS && last.hasAccuracy() && last.accuracy <= SAVE_ACCURACY_M) {
            if (settled.compareAndSet(false, true)) promise.resolve(last.toMap())
          } else {
            measure(client)
          }
        }
        .addOnFailureListener { measure(client) }
    } catch (t: Throwable) {
      fallback(t.message ?: t.javaClass.simpleName)
    }
  }

  private fun hasLocationPermission(): Boolean =
    ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
      ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

  @SuppressLint("MissingPermission") // checked in hasLocationPermission()
  private fun getCurrentPosition(timeoutMs: Long, fresh: Boolean, promise: Promise) {
    val good = if (fresh) SAVE_ACCURACY_M else GOOD_ACCURACY_M
    if (!hasLocationPermission()) {
      promise.reject("E_NO_PERMISSION", "Location permission not granted", null)
      return
    }
    val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val candidates = buildList {
      add(LocationManager.GPS_PROVIDER)
      add(LocationManager.NETWORK_PROVIDER)
      // Android 12+: the platform's own fused provider (GPS + Wi-Fi + cell + sensors).
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
        runCatching { lm.hasProvider(LocationManager.FUSED_PROVIDER) }.getOrDefault(false)
      ) add(LocationManager.FUSED_PROVIDER)
    }
    val providers = candidates.filter { runCatching { lm.isProviderEnabled(it) }.getOrDefault(false) }
    if (providers.isEmpty()) {
      promise.reject("E_LOCATION_DISABLED", "Location services are turned off", null)
      return
    }

    // A fresh, accurate cached fix is good enough — return immediately.
    val lastKnown = providers
      .mapNotNull { runCatching { lm.getLastKnownLocation(it) }.getOrNull() }
      .maxByOrNull { it.time }
    if (lastKnown != null && System.currentTimeMillis() - lastKnown.time < FRESH_MS && lastKnown.accuracy <= good) {
      promise.resolve(lastKnown.toMap())
      return
    }

    val done = AtomicBoolean(false)
    var best: Location? = null
    val handler = Handler(Looper.getMainLooper())
    lateinit var listener: LocationListener

    fun finish(result: Location?) {
      if (!done.compareAndSet(false, true)) return
      handler.removeCallbacksAndMessages(null)
      runCatching { lm.removeUpdates(listener) }
      if (result != null) promise.resolve(result.toMap())
      else promise.reject("E_TIMEOUT", "No location fix within ${timeoutMs} ms", null)
    }

    // All four callbacks are implemented on purpose: on API < 30 the framework
    // interface has no default methods and a missing override would crash.
    listener = object : LocationListener {
      override fun onLocationChanged(location: Location) {
        if (best == null || location.accuracy < best!!.accuracy) best = location
        if (location.accuracy <= good) finish(location)
      }
      override fun onProviderEnabled(provider: String) {}
      override fun onProviderDisabled(provider: String) {}
      @Deprecated("Deprecated in API 29")
      override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
    }

    providers.forEach { p ->
      runCatching { lm.requestLocationUpdates(p, 0L, 0f, listener, Looper.getMainLooper()) }
    }
    // Indoors a "good" fix may never come: after a few seconds take the best
    // one measured so far instead of making the user wait the full timeout.
    handler.postDelayed({ best?.let { finish(it) } }, SETTLE_MS)
    // On timeout return the best fix we saw (or the cached one) rather than nothing.
    handler.postDelayed({ finish(best ?: lastKnown) }, timeoutMs)
  }

  private fun Location.toMap(): Map<String, Any?> = mapOf(
    "latitude" to latitude,
    "longitude" to longitude,
    "accuracy" to accuracy.toDouble(),
    "altitude" to if (hasAltitude()) altitude else null,
    "timestamp" to time.toDouble(),
    "provider" to provider
  )

  companion object {
    private const val TAG = "EasySpotLocation"
    private const val FRESH_MS = 60_000L
    private const val GOOD_ACCURACY_M = 25f
    /** A fix that is SAVED must be at least this good to skip measuring (green on screen). */
    private const val SAVE_ACCURACY_M = 15f
    private const val SETTLE_MS = 4_000L
    /** "App launch" (Huawei / Honor) and "Autostart" (Xiaomi) — newest first. */
    private val LAUNCH_PAGES = listOf(
      "com.huawei.systemmanager" to "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity",
      "com.hihonor.systemmanager" to "com.hihonor.systemmanager.startupmgr.ui.StartupNormalAppListActivity",
      "com.huawei.systemmanager" to "com.huawei.systemmanager.appcontrol.activity.StartupAppControlActivity",
      "com.huawei.systemmanager" to "com.huawei.systemmanager.optimize.process.ProtectActivity",
      "com.miui.securitycenter" to "com.miui.permcenter.autostart.AutoStartManagementActivity"
    )
  }

  /** App icon as a small PNG data URI (shown in Settings next to the app name). */
  private fun iconPng(d: android.graphics.drawable.Drawable): String? = try {
    val size = 96
    val bmp = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bmp)
    d.setBounds(0, 0, size, size)
    d.draw(canvas)
    val out = java.io.ByteArrayOutputStream()
    bmp.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, out)
    bmp.recycle()
    "data:image/png;base64," + android.util.Base64.encodeToString(out.toByteArray(), android.util.Base64.NO_WRAP)
  } catch (e: Exception) {
    null
  }

  /** The page exists, is exported, and needs no permission EasySpot does not have. */
  private fun canOpen(pm: PackageManager, intent: android.content.Intent): Boolean {
    val info = (if (Build.VERSION.SDK_INT >= 33) {
      pm.resolveActivity(intent, PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_DEFAULT_ONLY.toLong()))
    } else {
      @Suppress("DEPRECATION")
      pm.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
    })?.activityInfo ?: return false
    if (info.packageName == "android" && info.name.contains("Resolver")) return false // "Open with" sheet
    if (!info.exported) return false
    val perm = info.permission ?: return true
    return ContextCompat.checkSelfPermission(context, perm) == PackageManager.PERMISSION_GRANTED
  }

  /** Phones that stop apps in the background unless the user allows it by hand. */
  private fun oemKind(): String? {
    val m = (Build.MANUFACTURER ?: "").lowercase()
    return when {
      m.contains("huawei") || m.contains("honor") -> "huawei"
      m.contains("xiaomi") || m.contains("redmi") || m.contains("poco") -> "xiaomi"
      else -> null
    }
  }
}
