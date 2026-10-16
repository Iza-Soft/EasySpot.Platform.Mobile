package com.ilkoadamov.easyspot.ocr

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.graphics.Rect
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import kotlin.math.max
import kotlin.math.min
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.TextRecognizer
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * On-device text recognition for Pillar Scan and Ticket Scan (stage 2).
 * ML Kit with the bundled Latin model: offline, free, no Google Play services
 * needed. Digits and Latin letters cover pillar codes ("B2", "C14") and ticket
 * times ("14:30"). The parsing itself is in domain/ocr-parse.ts (TypeScript, tested).
 */
class EasySpotOcrModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private var recognizer: TextRecognizer? = null
  private fun recognizer(): TextRecognizer =
    recognizer ?: TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS).also { recognizer = it }

  override fun definition() = ModuleDefinition {
    Name("EasySpotOcr")

    /** Which engine this phone uses (shown in the dev test). */
    Function("engine") { "ML Kit (on-device)" }

    /**
     * Text in a photo (file:// URI from the camera). Lines come top-to-bottom
     * with their box in image pixels, so callers can prefer the biggest text
     * (the level painted on a pillar).
     */
    AsyncFunction("recognizeTextAsync") { uri: String, promise: Promise ->
      val image = try {
        InputImage.fromFilePath(context, Uri.parse(uri)) // reads EXIF rotation too
      } catch (e: Exception) {
        promise.reject("E_IMAGE", "Could not read the photo: ${e.message}", e)
        return@AsyncFunction
      }
      recognizer().process(image)
        .addOnSuccessListener { text ->
          val lines = text.textBlocks.flatMap { block ->
            block.lines.map { line -> mapOf("text" to line.text, "frame" to frame(line.boundingBox)) }
          }
          promise.resolve(
            mapOf(
              "text" to text.text,
              "lines" to lines,
              "width" to image.width,
              "height" to image.height
            )
          )
        }
        .addOnFailureListener { e -> promise.reject("E_OCR", e.message ?: "Text recognition failed", e) }
    }

    /**
     * Photo of the spot: the camera picture, turned upright (EXIF) and made
     * smaller (long side ≤ maxSide), saved as JPEG at dest (the app's own
     * files). Text recognition and colour sampling then use this file, so
     * every box is in the same, upright pixels.
     */
    AsyncFunction("preparePhotoAsync") { src: String, dest: String, maxSide: Int, quality: Double ->
      val bmp = decodeUpright(Uri.parse(src), maxSide)
      val out = File(Uri.parse(dest).path ?: throw IOException("Bad destination: $dest"))
      out.parentFile?.mkdirs()
      FileOutputStream(out).use { bmp.compress(Bitmap.CompressFormat.JPEG, (quality * 100).toInt().coerceIn(30, 100), it) }
      val result = mapOf("uri" to Uri.fromFile(out).toString(), "width" to bmp.width, "height" to bmp.height)
      bmp.recycle()
      result
    }

    /**
     * The colours inside a box of the (prepared) photo, scaled down to
     * size × size, as 0xRRGGBB numbers — the zone colour is worked out in
     * TypeScript (domain/zone-color.ts). rect = [x, y, width, height].
     */
    AsyncFunction("samplePixelsAsync") { uri: String, rect: List<Int>, size: Int ->
      val bmp = context.contentResolver.openInputStream(Uri.parse(uri)).use { BitmapFactory.decodeStream(it) }
        ?: throw IOException("Could not read the photo")
      try {
        val x = rect.getOrElse(0) { 0 }.coerceIn(0, bmp.width - 1)
        val y = rect.getOrElse(1) { 0 }.coerceIn(0, bmp.height - 1)
        val w = rect.getOrElse(2) { bmp.width }.coerceIn(1, bmp.width - x)
        val h = rect.getOrElse(3) { bmp.height }.coerceIn(1, bmp.height - y)
        val n = size.coerceIn(4, 64)
        val crop = Bitmap.createBitmap(bmp, x, y, w, h)
        val small = Bitmap.createScaledBitmap(crop, n, n, true)
        val pixels = IntArray(n * n)
        small.getPixels(pixels, 0, n, 0, 0, n, n)
        if (small !== crop) small.recycle()
        if (crop !== bmp) crop.recycle()
        pixels.map { it and 0xFFFFFF }
      } finally {
        bmp.recycle()
      }
    }

    OnDestroy {
      recognizer?.close()
      recognizer = null
    }
  }

  /** Decodes a photo already turned the way it was taken and no bigger than maxSide. */
  private fun decodeUpright(uri: Uri, maxSide: Int): Bitmap {
    val resolver = context.contentResolver
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    resolver.openInputStream(uri).use { BitmapFactory.decodeStream(it, null, bounds) }
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) throw IOException("Could not read the photo")
    var sample = 1
    while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= maxSide) sample *= 2
    val raw = resolver.openInputStream(uri).use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample }) }
      ?: throw IOException("Could not read the photo")
    val orientation = try {
      resolver.openInputStream(uri)?.use { ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL) }
        ?: ExifInterface.ORIENTATION_NORMAL
    } catch (e: Exception) {
      ExifInterface.ORIENTATION_NORMAL
    }
    val m = Matrix()
    when (orientation) {
      ExifInterface.ORIENTATION_ROTATE_90 -> m.postRotate(90f)
      ExifInterface.ORIENTATION_ROTATE_180 -> m.postRotate(180f)
      ExifInterface.ORIENTATION_ROTATE_270 -> m.postRotate(270f)
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> m.postScale(-1f, 1f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> m.postScale(1f, -1f)
      ExifInterface.ORIENTATION_TRANSPOSE -> { m.postRotate(90f); m.postScale(-1f, 1f) }
      ExifInterface.ORIENTATION_TRANSVERSE -> { m.postRotate(270f); m.postScale(-1f, 1f) }
    }
    val longSide = max(raw.width, raw.height)
    if (longSide > maxSide) {
      val s = min(1f, maxSide.toFloat() / longSide)
      m.postScale(s, s)
    }
    if (m.isIdentity) return raw
    val out = Bitmap.createBitmap(raw, 0, 0, raw.width, raw.height, m, true)
    if (out !== raw) raw.recycle()
    return out
  }

  private fun frame(r: Rect?): Map<String, Int>? =
    r?.let { mapOf("x" to it.left, "y" to it.top, "width" to it.width(), "height" to it.height()) }
}
