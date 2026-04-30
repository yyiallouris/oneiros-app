#!/usr/bin/env python3

from __future__ import annotations

import io
import re
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
BRANDING_DIR = ROOT / "assets" / "branding"
LOCAL_SOURCE_SVG = BRANDING_DIR / "logo-symbol.svg"
FALLBACK_SOURCE_SVG = Path("/Users/yiannisyiallouris/Desktop/oneiros-assets/logo/logo.svg")

CANVAS_SIZE = 1024
SPLASH_RENDER_HEIGHT = 1400
ICON_RENDER_HEIGHT = 1600

PLUM = "#2B2430"
PLUM_SHADOW = "#1F1A23"
PLUM_HIGHLIGHT = "#4F3A58"
VIOLET_GLOW = "#6E4D78"
CONTOUR = "#DDD3DD"
CONTOUR_SOFT = "#BBA8BF"
PAPER_MIST = "#FFFCFA"
SPLASH_BG = "#F7F3F0"
TEXT_SECONDARY = "#55485D"

ALEGREYA_FONT_PATH = ROOT / "node_modules" / "@expo-google-fonts" / "alegreya-sans" / "400Regular" / "AlegreyaSans_400Regular.ttf"
CORMORANT_FONT_PATH = ROOT / "node_modules" / "@expo-google-fonts" / "cormorant-garamond" / "600SemiBold" / "CormorantGaramond_600SemiBold.ttf"


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def remove_export_background(svg_text: str) -> str:
    return re.sub(r'<path fill="#000000"[\s\S]*?/>', "", svg_text, count=1)


def ensure_local_source_svg() -> Path:
    BRANDING_DIR.mkdir(parents=True, exist_ok=True)

    if LOCAL_SOURCE_SVG.exists():
        return LOCAL_SOURCE_SVG

    if not FALLBACK_SOURCE_SVG.exists():
        raise FileNotFoundError(
            f"Missing source SVG. Expected either {LOCAL_SOURCE_SVG} or {FALLBACK_SOURCE_SVG}"
        )

    cleaned = remove_export_background(FALLBACK_SOURCE_SVG.read_text())
    LOCAL_SOURCE_SVG.write_text(cleaned)
    return LOCAL_SOURCE_SVG


def render_svg(svg_path: Path, output_height: int) -> Image.Image:
    with tempfile.NamedTemporaryFile(suffix=".png") as tmp:
        subprocess.run(
            ["sips", "-s", "format", "png", str(svg_path), "--out", tmp.name],
            check=True,
            capture_output=True,
            text=True,
        )
        image = Image.open(io.BytesIO(Path(tmp.name).read_bytes())).convert("RGBA")
    if output_height != image.height:
        scale = output_height / image.height
        resized = (
            max(1, round(image.width * scale)),
            max(1, round(image.height * scale)),
        )
        image = image.resize(resized, Image.LANCZOS)
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError(f"Rendered SVG has no visible content: {svg_path}")
    return image.crop(bbox)


def create_diagonal_gradient(size: int, top_left: str, bottom_right: str) -> Image.Image:
    start = hex_to_rgb(top_left)
    end = hex_to_rgb(bottom_right)
    gradient = Image.new("RGBA", (size, size))
    pixels = gradient.load()

    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            pixels[x, y] = tuple(round(lerp(start[i], end[i], t)) for i in range(3)) + (255,)

    return gradient


def add_radial_glow(
    image: Image.Image,
    *,
    center: tuple[float, float],
    radius: float,
    color: str,
    opacity: int,
    blur: float | None = None,
) -> Image.Image:
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    draw.ellipse(
        (cx - radius, cy - radius, cx + radius, cy + radius),
        fill=hex_to_rgb(color) + (opacity,),
    )
    return Image.alpha_composite(
        image,
        layer.filter(ImageFilter.GaussianBlur(blur if blur is not None else radius * 0.45)),
    )


def build_icon_background() -> Image.Image:
    image = create_diagonal_gradient(CANVAS_SIZE, PLUM_HIGHLIGHT, PLUM_SHADOW)
    image = add_radial_glow(
        image,
        center=(CANVAS_SIZE * 0.34, CANVAS_SIZE * 0.28),
        radius=CANVAS_SIZE * 0.28,
        color=VIOLET_GLOW,
        opacity=48,
    )
    image = add_radial_glow(
        image,
        center=(CANVAS_SIZE * 0.70, CANVAS_SIZE * 0.76),
        radius=CANVAS_SIZE * 0.34,
        color=CONTOUR_SOFT,
        opacity=28,
    )

    vignette = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(vignette)
    draw.ellipse(
        (-CANVAS_SIZE * 0.08, -CANVAS_SIZE * 0.05, CANVAS_SIZE * 1.08, CANVAS_SIZE * 1.1),
        fill=(0, 0, 0, 115),
    )
    vignette = vignette.filter(ImageFilter.GaussianBlur(CANVAS_SIZE * 0.16))
    return Image.blend(image, ImageChops.subtract(image, vignette), 0.15)


def create_channel_lut(stops: list[tuple[int, tuple[int, int, int]]], channel: int) -> list[int]:
    lut = [0] * 256
    for (start_index, start_color), (end_index, end_color) in zip(stops, stops[1:]):
        span = max(1, end_index - start_index)
        for value in range(start_index, end_index + 1):
            t = (value - start_index) / span
            lut[value] = round(lerp(start_color[channel], end_color[channel], t))
    for value in range(0, stops[0][0]):
        lut[value] = stops[0][1][channel]
    for value in range(stops[-1][0], 256):
        lut[value] = stops[-1][1][channel]
    return lut


def recolor_logo(logo_image: Image.Image) -> Image.Image:
    grayscale = ImageOps.autocontrast(ImageOps.grayscale(logo_image), cutoff=1)
    stops = [
        (0, hex_to_rgb(VIOLET_GLOW)),
        (92, hex_to_rgb(CONTOUR_SOFT)),
        (176, hex_to_rgb(CONTOUR)),
        (255, hex_to_rgb(PAPER_MIST)),
    ]
    red = grayscale.point(create_channel_lut(stops, 0))
    green = grayscale.point(create_channel_lut(stops, 1))
    blue = grayscale.point(create_channel_lut(stops, 2))
    alpha = logo_image.getchannel("A")
    return Image.merge("RGBA", (red, green, blue, alpha))


def resize_to_fit(image: Image.Image, max_width: int, max_height: int) -> Image.Image:
    scale = min(max_width / image.width, max_height / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(size, Image.LANCZOS)


def center_on_canvas(image: Image.Image, canvas_size: int = CANVAS_SIZE) -> tuple[Image.Image, tuple[int, int, int, int]]:
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    x = (canvas_size - image.width) // 2
    y = (canvas_size - image.height) // 2
    canvas.alpha_composite(image, (x, y))
    return canvas, (x, y, x + image.width, y + image.height)


def create_core_glow(bounds: tuple[int, int, int, int], canvas_size: int = CANVAS_SIZE) -> Image.Image:
    x0, y0, x1, y1 = bounds
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    logo_height = y1 - y0

    glow = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    glow = add_radial_glow(
        glow,
        center=(cx, cy),
        radius=logo_height * 0.20,
        color=VIOLET_GLOW,
        opacity=110,
        blur=logo_height * 0.09,
    )
    glow = add_radial_glow(
        glow,
        center=(cx, cy),
        radius=logo_height * 0.11,
        color=CONTOUR,
        opacity=135,
        blur=logo_height * 0.05,
    )
    glow = add_radial_glow(
        glow,
        center=(cx, cy),
        radius=logo_height * 0.055,
        color=PAPER_MIST,
        opacity=180,
        blur=logo_height * 0.025,
    )
    return glow


def create_outer_glow(logo_canvas: Image.Image) -> Image.Image:
    alpha = logo_canvas.getchannel("A")
    blurred = alpha.filter(ImageFilter.GaussianBlur(CANVAS_SIZE * 0.025))
    layer = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), hex_to_rgb(VIOLET_GLOW) + (0,))
    layer.putalpha(blurred.point(lambda value: min(90, int(value * 0.42))))
    return layer


def create_icon_composite(logo_image: Image.Image) -> Image.Image:
    background = build_icon_background()
    placed_logo, bounds = center_on_canvas(
        resize_to_fit(logo_image, round(CANVAS_SIZE * 0.74), round(CANVAS_SIZE * 0.74))
    )
    composite = Image.alpha_composite(background, create_outer_glow(placed_logo))
    composite = Image.alpha_composite(composite, create_core_glow(bounds))
    composite = Image.alpha_composite(composite, placed_logo)
    return composite


def create_android_foreground(logo_image: Image.Image) -> Image.Image:
    # Keep the symbol within Android's safe zone so OEM masks do not clip the core motif.
    placed_logo, bounds = center_on_canvas(
        resize_to_fit(logo_image, round(CANVAS_SIZE * 0.58), round(CANVAS_SIZE * 0.62))
    )
    foreground = Image.alpha_composite(create_core_glow(bounds), placed_logo)
    alpha = foreground.getchannel("A")
    foreground.putalpha(alpha.point(lambda value: 0 if value < 6 else value))
    return foreground


def create_android_monochrome(logo_source: Image.Image) -> Image.Image:
    grayscale = ImageOps.grayscale(logo_source)
    alpha = logo_source.getchannel("A")
    line_mask = grayscale.point(lambda value: 255 if value < 232 else 0)
    line_mask = ImageChops.multiply(line_mask, alpha).filter(ImageFilter.MaxFilter(3))

    mono = Image.new("RGBA", logo_source.size, (255, 255, 255, 0))
    mono.putalpha(line_mask)
    mono = resize_to_fit(mono, round(CANVAS_SIZE * 0.58), round(CANVAS_SIZE * 0.62))
    mono_canvas, _ = center_on_canvas(mono)
    return mono_canvas


def save_image(image: Image.Image, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target)


def create_splash_lockup(logo_image: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    placed_logo = resize_to_fit(logo_image, 420, 500)
    logo_x = (CANVAS_SIZE - placed_logo.width) // 2
    logo_y = 170
    canvas.alpha_composite(placed_logo, (logo_x, logo_y))

    title_font = ImageFont.truetype(str(CORMORANT_FONT_PATH), 108)
    subtitle_font = ImageFont.truetype(str(ALEGREYA_FONT_PATH), 34)

    title_y = logo_y + placed_logo.height + 30
    draw.text(
        (CANVAS_SIZE / 2, title_y),
        "Oneiros",
        font=title_font,
        fill=hex_to_rgb(PLUM),
        anchor="ma",
    )
    draw.text(
        (CANVAS_SIZE / 2, title_y + 86),
        "Dream Journal",
        font=subtitle_font,
        fill=hex_to_rgb(TEXT_SECONDARY),
        anchor="ma",
    )
    return canvas


def main() -> None:
    svg_path = ensure_local_source_svg()

    splash_logo = render_svg(svg_path, SPLASH_RENDER_HEIGHT)
    icon_logo = recolor_logo(render_svg(svg_path, ICON_RENDER_HEIGHT))
    monochrome_logo = render_svg(svg_path, ICON_RENDER_HEIGHT)

    save_image(splash_logo, BRANDING_DIR / "splash-logo.png")
    save_image(create_splash_lockup(splash_logo), BRANDING_DIR / "splash-lockup.png")
    save_image(create_icon_composite(icon_logo), BRANDING_DIR / "icon-ios.png")
    save_image(create_icon_composite(icon_logo), BRANDING_DIR / "icon-android-legacy.png")
    save_image(build_icon_background(), BRANDING_DIR / "icon-android-background.png")
    save_image(create_android_foreground(icon_logo), BRANDING_DIR / "icon-android-foreground.png")
    save_image(create_android_monochrome(monochrome_logo), BRANDING_DIR / "icon-android-monochrome.png")

    print("Generated branding assets in", BRANDING_DIR)


if __name__ == "__main__":
    main()
