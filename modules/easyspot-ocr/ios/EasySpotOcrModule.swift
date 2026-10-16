import ExpoModulesCore
import UIKit
import Vision

/// On-device text recognition for Pillar Scan and Ticket Scan (stage 2) —
/// Apple Vision, offline, free. Same result shape as the Android module
/// (ML Kit); the parsing is in domain/ocr-parse.ts.
public class EasySpotOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("EasySpotOcr")

    Function("engine") { "Apple Vision (on-device)" }

    AsyncFunction("recognizeTextAsync") { (uri: String, promise: Promise) in
      guard let url = URL(string: uri),
            let image = UIImage(contentsOfFile: url.path),
            let cgImage = image.cgImage else {
        promise.reject("E_IMAGE", "Could not read the photo")
        return
      }
      let width = cgImage.width
      let height = cgImage.height

      let request = VNRecognizeTextRequest { request, error in
        if let error = error {
          promise.reject("E_OCR", error.localizedDescription)
          return
        }
        let observations = (request.results as? [VNRecognizedTextObservation]) ?? []
        // Vision boxes are normalised with the origin bottom-left → image pixels, top-left.
        let lines: [[String: Any]] = observations.compactMap { obs in
          guard let best = obs.topCandidates(1).first else { return nil }
          let b = obs.boundingBox
          return [
            "text": best.string,
            "frame": [
              "x": Int(b.minX * CGFloat(width)),
              "y": Int((1 - b.maxY) * CGFloat(height)),
              "width": Int(b.width * CGFloat(width)),
              "height": Int(b.height * CGFloat(height)),
            ],
          ]
        }
        promise.resolve([
          "text": lines.compactMap { $0["text"] as? String }.joined(separator: "\n"),
          "lines": lines,
          "width": width,
          "height": height,
        ])
      }
      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = false // codes like "B2", "C14" are not words
      if #available(iOS 16.0, *) {
        request.automaticallyDetectsLanguage = true
      }

      let orientation = CGImagePropertyOrientation(image.imageOrientation)
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          try VNImageRequestHandler(cgImage: cgImage, orientation: orientation, options: [:]).perform([request])
        } catch {
          promise.reject("E_OCR", error.localizedDescription)
        }
      }
    }

    /// Photo of the spot: the camera picture turned upright and made smaller
    /// (long side ≤ maxSide), saved as JPEG at dest. Text recognition and
    /// colour sampling then use this file — every box in the same pixels.
    AsyncFunction("preparePhotoAsync") { (src: String, dest: String, maxSide: Int, quality: Double, promise: Promise) in
      guard let srcUrl = URL(string: src), let image = UIImage(contentsOfFile: srcUrl.path),
            let destUrl = URL(string: dest) else {
        promise.reject("E_IMAGE", "Could not read the photo")
        return
      }
      DispatchQueue.global(qos: .userInitiated).async {
        let w = image.size.width * image.scale
        let h = image.size.height * image.scale
        let s = min(1, CGFloat(maxSide) / max(w, h))
        let target = CGSize(width: floor(w * s), height: floor(h * s))
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = true
        // draw(in:) applies the photo's orientation → the result is upright (.up).
        let upright = UIGraphicsImageRenderer(size: target, format: format).image { _ in
          image.draw(in: CGRect(origin: .zero, size: target))
        }
        guard let data = upright.jpegData(compressionQuality: CGFloat(quality)) else {
          promise.reject("E_IMAGE", "Could not save the photo")
          return
        }
        do {
          try FileManager.default.createDirectory(at: destUrl.deletingLastPathComponent(), withIntermediateDirectories: true)
          try data.write(to: destUrl, options: .atomic)
          promise.resolve(["uri": destUrl.absoluteString, "width": Int(target.width), "height": Int(target.height)])
        } catch {
          promise.reject("E_IMAGE", error.localizedDescription)
        }
      }
    }

    /// The colours inside a box of the (prepared) photo, scaled down to
    /// size × size, as 0xRRGGBB numbers — the zone colour is worked out in
    /// TypeScript (domain/zone-color.ts). rect = [x, y, width, height].
    AsyncFunction("samplePixelsAsync") { (uri: String, rect: [Int], size: Int, promise: Promise) in
      guard let url = URL(string: uri), let image = UIImage(contentsOfFile: url.path), let cg = image.cgImage else {
        promise.reject("E_IMAGE", "Could not read the photo")
        return
      }
      let n = max(4, min(64, size))
      let full = CGRect(x: 0, y: 0, width: cg.width, height: cg.height)
      let box = CGRect(
        x: rect.count > 0 ? rect[0] : 0,
        y: rect.count > 1 ? rect[1] : 0,
        width: rect.count > 2 ? rect[2] : cg.width,
        height: rect.count > 3 ? rect[3] : cg.height
      ).intersection(full)
      guard !box.isNull, box.width >= 1, box.height >= 1, let crop = cg.cropping(to: box) else {
        promise.resolve([Int]())
        return
      }
      var bytes = [UInt8](repeating: 0, count: n * n * 4)
      let ok: Bool = bytes.withUnsafeMutableBytes { buf in
        guard let ctx = CGContext(
          data: buf.baseAddress, width: n, height: n, bitsPerComponent: 8, bytesPerRow: n * 4,
          space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
        ) else { return false }
        ctx.interpolationQuality = .medium
        ctx.draw(crop, in: CGRect(x: 0, y: 0, width: n, height: n))
        return true
      }
      guard ok else {
        promise.reject("E_IMAGE", "Could not read the colours")
        return
      }
      var out = [Int]()
      out.reserveCapacity(n * n)
      for i in 0..<(n * n) {
        out.append((Int(bytes[i * 4]) << 16) | (Int(bytes[i * 4 + 1]) << 8) | Int(bytes[i * 4 + 2]))
      }
      promise.resolve(out)
    }
  }
}

extension CGImagePropertyOrientation {
  init(_ o: UIImage.Orientation) {
    switch o {
    case .up: self = .up
    case .upMirrored: self = .upMirrored
    case .down: self = .down
    case .downMirrored: self = .downMirrored
    case .left: self = .left
    case .leftMirrored: self = .leftMirrored
    case .right: self = .right
    case .rightMirrored: self = .rightMirrored
    @unknown default: self = .up
    }
  }
}
