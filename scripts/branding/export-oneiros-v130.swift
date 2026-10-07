#!/usr/bin/env swift

import AppKit
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct ExportError: Error, CustomStringConvertible {
  let description: String
}

let fileManager = FileManager.default
let repositoryRoot = URL(fileURLWithPath: fileManager.currentDirectoryPath, isDirectory: true)
let releaseRoot = repositoryRoot
  .appendingPathComponent("assets/branding/releases/v1.3.0", isDirectory: true)
let sourceRoot = releaseRoot.appendingPathComponent("source", isDirectory: true)
let exportRoot = releaseRoot.appendingPathComponent("exports", isDirectory: true)
let reviewRoot = releaseRoot.appendingPathComponent("review", isDirectory: true)

let symbolSourceURL = sourceRoot.appendingPathComponent("oneiros-symbol-master.png")
let iconSourceURL = sourceRoot.appendingPathComponent("oneiros-app-icon-master.png")

func loadCGImage(_ url: URL) throws -> CGImage {
  guard
    let source = CGImageSourceCreateWithURL(url as CFURL, nil),
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
  else {
    throw ExportError(description: "Could not read image at \(url.path)")
  }
  return image
}

func makeContext(width: Int, height: Int) throws -> CGContext {
  guard let context = CGContext(
    data: nil,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: width * 4,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  ) else {
    throw ExportError(description: "Could not create \(width)x\(height) bitmap context")
  }
  context.interpolationQuality = .high
  return context
}

func makeOpaqueContext(width: Int, height: Int) throws -> CGContext {
  guard let context = CGContext(
    data: nil,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: width * 4,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
  ) else {
    throw ExportError(description: "Could not create opaque \(width)x\(height) bitmap context")
  }
  context.interpolationQuality = .high
  return context
}

func writePNG(_ image: CGImage, to url: URL) throws {
  guard let destination = CGImageDestinationCreateWithURL(
    url as CFURL,
    UTType.png.identifier as CFString,
    1,
    nil
  ) else {
    throw ExportError(description: "Could not create PNG destination at \(url.path)")
  }
  CGImageDestinationAddImage(destination, image, nil)
  guard CGImageDestinationFinalize(destination) else {
    throw ExportError(description: "Could not write PNG at \(url.path)")
  }
}

func renderOpaqueIcon(from source: CGImage, size: Int) throws -> CGImage {
  // The approved master includes transparent presentation margins and an already
  // rounded preview card. Crop only those margins. The visible artwork remains
  // untouched; the dark fill exists solely beneath platform-owned corner masks.
  let crop = CGRect(x: 148, y: 153, width: 959, height: 959)
  guard let cropped = source.cropping(to: crop) else {
    throw ExportError(description: "Could not crop approved icon master")
  }

  let context = try makeOpaqueContext(width: size, height: size)
  context.setFillColor(CGColor(red: 85 / 255, green: 49 / 255, blue: 73 / 255, alpha: 1))
  context.fill(CGRect(x: 0, y: 0, width: size, height: size))
  context.draw(cropped, in: CGRect(x: 0, y: 0, width: size, height: size))

  guard let output = context.makeImage() else {
    throw ExportError(description: "Could not render opaque app icon")
  }
  return output
}

func renderTransparentCanvas(size: Int) throws -> CGImage {
  let context = try makeContext(width: size, height: size)
  context.clear(CGRect(x: 0, y: 0, width: size, height: size))
  guard let output = context.makeImage() else {
    throw ExportError(description: "Could not render transparent adaptive foreground")
  }
  return output
}

func renderMonochromeSymbol(from source: CGImage, size: Int) throws -> CGImage {
  let context = try makeContext(width: size, height: size)
  context.clear(CGRect(x: 0, y: 0, width: size, height: size))

  // Android masks and tints this layer. Preserve the approved silhouette and
  // authored alpha while keeping it inside the adaptive-icon safe zone.
  let canvasWidth = CGFloat(size) * 0.64
  let scale = canvasWidth / CGFloat(source.width)
  let canvasHeight = CGFloat(source.height) * scale
  let destination = CGRect(
    x: (CGFloat(size) - canvasWidth) / 2,
    y: (CGFloat(size) - canvasHeight) / 2,
    width: canvasWidth,
    height: canvasHeight
  )

  context.saveGState()
  context.clip(to: destination, mask: source)
  context.setFillColor(CGColor(gray: 1, alpha: 1))
  context.fill(destination)
  context.restoreGState()

  // The supplied transparent master carries a handful of alpha=1 export
  // speckles far outside the authored mark. Remove only that invisible noise
  // so Android's system tint cannot amplify it in themed-icon mode.
  if let bytes = context.data?.assumingMemoryBound(to: UInt8.self) {
    for pixel in 0..<(size * size) {
      let offset = pixel * 4
      if bytes[offset + 3] < 4 {
        bytes[offset] = 0
        bytes[offset + 1] = 0
        bytes[offset + 2] = 0
        bytes[offset + 3] = 0
      }
    }
  }

  guard let output = context.makeImage() else {
    throw ExportError(description: "Could not render Android monochrome icon")
  }
  return output
}

func resize(_ source: CGImage, size: Int) throws -> CGImage {
  let context = try makeContext(width: size, height: size)
  context.draw(source, in: CGRect(x: 0, y: 0, width: size, height: size))
  guard let output = context.makeImage() else {
    throw ExportError(description: "Could not resize image to \(size)x\(size)")
  }
  return output
}

func makePreview(iconURL: URL, symbolURL: URL, outputURL: URL) throws {
  guard let icon = NSImage(contentsOf: iconURL), let symbol = NSImage(contentsOf: symbolURL) else {
    throw ExportError(description: "Could not load approved exports for visual review")
  }

  let width: CGFloat = 1800
  let height: CGFloat = 1120
  let preview = NSImage(size: NSSize(width: width, height: height))
  preview.lockFocus()

  NSColor(calibratedRed: 248 / 255, green: 243 / 255, blue: 234 / 255, alpha: 1).setFill()
  NSBezierPath(rect: NSRect(x: 0, y: 0, width: width, height: height)).fill()

  let titleAttributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: 42, weight: .semibold),
    .foregroundColor: NSColor(calibratedRed: 52 / 255, green: 31 / 255, blue: 51 / 255, alpha: 1),
  ]
  let labelAttributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: 25, weight: .medium),
    .foregroundColor: NSColor(calibratedRed: 84 / 255, green: 57 / 255, blue: 80 / 255, alpha: 1),
  ]
  let noteAttributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: 18, weight: .regular),
    .foregroundColor: NSColor(calibratedRed: 112 / 255, green: 88 / 255, blue: 106 / 255, alpha: 1),
  ]

  NSString(string: "Oneiros 1.3.0 — approved exact-source release").draw(
    at: NSPoint(x: 78, y: height - 92),
    withAttributes: titleAttributes
  )
  NSString(string: "No generative redraw. Platform masks shown below.").draw(
    at: NSPoint(x: 80, y: height - 132),
    withAttributes: noteAttributes
  )

  func drawLabel(_ text: String, x: CGFloat) {
    NSString(string: text).draw(at: NSPoint(x: x, y: 120), withAttributes: labelAttributes)
  }

  let iconSize: CGFloat = 360
  let iconY: CGFloat = 235
  let positions: [CGFloat] = [90, 515, 940]

  NSGraphicsContext.saveGraphicsState()
  NSBezierPath(roundedRect: NSRect(x: positions[0], y: iconY, width: iconSize, height: iconSize), xRadius: 78, yRadius: 78).addClip()
  icon.draw(in: NSRect(x: positions[0], y: iconY, width: iconSize, height: iconSize))
  NSGraphicsContext.restoreGraphicsState()
  drawLabel("Apple mask", x: positions[0] + 92)

  NSGraphicsContext.saveGraphicsState()
  NSBezierPath(ovalIn: NSRect(x: positions[1], y: iconY, width: iconSize, height: iconSize)).addClip()
  icon.draw(in: NSRect(x: positions[1], y: iconY, width: iconSize, height: iconSize))
  NSGraphicsContext.restoreGraphicsState()
  drawLabel("Android circle", x: positions[1] + 76)

  NSGraphicsContext.saveGraphicsState()
  NSBezierPath(roundedRect: NSRect(x: positions[2], y: iconY, width: iconSize, height: iconSize), xRadius: 120, yRadius: 120).addClip()
  icon.draw(in: NSRect(x: positions[2], y: iconY, width: iconSize, height: iconSize))
  NSGraphicsContext.restoreGraphicsState()
  drawLabel("Android squircle", x: positions[2] + 66)

  let splashRect = NSRect(x: 1320, y: 250, width: 400, height: 400)
  symbol.draw(in: splashRect)
  drawLabel("Splash symbol", x: 1415)

  NSString(string: "60 px").draw(at: NSPoint(x: 1420, y: 726), withAttributes: noteAttributes)
  NSGraphicsContext.saveGraphicsState()
  NSBezierPath(roundedRect: NSRect(x: 1500, y: 705, width: 60, height: 60), xRadius: 13, yRadius: 13).addClip()
  icon.draw(in: NSRect(x: 1500, y: 705, width: 60, height: 60))
  NSGraphicsContext.restoreGraphicsState()

  NSString(string: "Source SHA-256 is locked in the approved release manifest.").draw(
    at: NSPoint(x: 80, y: 62),
    withAttributes: noteAttributes
  )

  preview.unlockFocus()
  guard
    let tiff = preview.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiff),
    let png = bitmap.representation(using: .png, properties: [:])
  else {
    throw ExportError(description: "Could not encode platform preview")
  }
  try png.write(to: outputURL, options: .atomic)
}

do {
  try fileManager.createDirectory(at: exportRoot, withIntermediateDirectories: true)
  try fileManager.createDirectory(at: reviewRoot, withIntermediateDirectories: true)

  let symbol = try loadCGImage(symbolSourceURL)
  let iconSource = try loadCGImage(iconSourceURL)
  let opaqueIcon = try renderOpaqueIcon(from: iconSource, size: 1024)

  let iosURL = exportRoot.appendingPathComponent("icon-ios-1024.png")
  let androidLegacyURL = exportRoot.appendingPathComponent("icon-android-legacy-1024.png")
  let androidBackgroundURL = exportRoot.appendingPathComponent("icon-android-background-1024.png")
  let androidForegroundURL = exportRoot.appendingPathComponent("icon-android-foreground-1024.png")
  let androidMonochromeURL = exportRoot.appendingPathComponent("icon-android-monochrome-1024.png")
  let faviconURL = exportRoot.appendingPathComponent("favicon-256.png")
  let splashURL = exportRoot.appendingPathComponent("splash-symbol-master.png")

  try writePNG(opaqueIcon, to: iosURL)
  try writePNG(opaqueIcon, to: androidLegacyURL)
  try writePNG(opaqueIcon, to: androidBackgroundURL)
  try writePNG(try renderTransparentCanvas(size: 1024), to: androidForegroundURL)
  try writePNG(try renderMonochromeSymbol(from: symbol, size: 1024), to: androidMonochromeURL)
  try writePNG(try resize(opaqueIcon, size: 256), to: faviconURL)

  // Preserve the approved splash source byte-for-byte.
  if fileManager.fileExists(atPath: splashURL.path) {
    try fileManager.removeItem(at: splashURL)
  }
  try fileManager.copyItem(at: symbolSourceURL, to: splashURL)

  try makePreview(
    iconURL: iosURL,
    symbolURL: splashURL,
    outputURL: reviewRoot.appendingPathComponent("platform-preview.png")
  )

  print("Exported Oneiros 1.3.0 approved assets to \(releaseRoot.path)")
} catch {
  fputs("Brand export failed: \(error)\n", stderr)
  exit(1)
}
