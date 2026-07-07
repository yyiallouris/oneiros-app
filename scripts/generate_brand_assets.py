#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
BRANDING_DIR = ROOT / "assets" / "branding"
BACKGROUND_PATH = ROOT / "assets" / "backgrounds" / "BG_paper.png"
LOGO_PATH = BRANDING_DIR / "oneiros_logo.png"

CANVAS_SIZE = 1024
PAPER_BASE = (248, 243, 234, 255)


def cover_square(image: Image.Image, size: int) -> Image.Image:
    ratio = max(size / image.width, size / image.height)
    resized = image.resize(
        (round(image.width * ratio), round(image.height * ratio)),
        Image.LANCZOS,
    )
    left = (resized.width - size) // 2
    top = (resized.height - size) // 2
    return resized.crop((left, top, left + size, top + size))


def contain(image: Image.Image, max_width: int, max_height: int) -> Image.Image:
    ratio = min(max_width / image.width, max_height / image.height)
    return image.resize(
        (
            max(1, round(image.width * ratio)),
            max(1, round(image.height * ratio)),
        ),
        Image.LANCZOS,
    )


def center(canvas: Image.Image, image: Image.Image, *, dx: int = 0, dy: int = 0) -> None:
    x = (canvas.width - image.width) // 2 + dx
    y = (canvas.height - image.height) // 2 + dy
    canvas.alpha_composite(image, (x, y))


def create_icon_background(paper_image: Image.Image) -> Image.Image:
    background = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), PAPER_BASE)
    background.alpha_composite(cover_square(paper_image, CANVAS_SIZE))
    return background


def create_icon_composite(background: Image.Image, logo: Image.Image) -> Image.Image:
    large_logo = contain(logo, int(CANVAS_SIZE * 0.7), int(CANVAS_SIZE * 0.72))
    shadow = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    shadow_logo = Image.new("RGBA", large_logo.size, (0, 0, 0, 110))
    shadow_alpha = large_logo.getchannel("A").filter(ImageFilter.GaussianBlur(12))
    shadow_logo.putalpha(shadow_alpha)
    center(shadow, shadow_logo, dy=18)

    icon = Image.alpha_composite(background, shadow)
    center(icon, large_logo)
    return icon


def create_adaptive_foreground(logo: Image.Image) -> Image.Image:
    foreground = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    centered_logo = contain(logo, int(CANVAS_SIZE * 0.58), int(CANVAS_SIZE * 0.62))
    center(foreground, centered_logo)
    return foreground


def create_monochrome_foreground(logo: Image.Image) -> Image.Image:
    mono_canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (255, 255, 255, 0))
    centered_logo = contain(logo, int(CANVAS_SIZE * 0.58), int(CANVAS_SIZE * 0.62))
    alpha = centered_logo.getchannel("A").point(lambda value: 255 if value > 8 else 0)
    mono_fill = Image.new("RGBA", centered_logo.size, (17, 17, 17, 255))
    mono_fill.putalpha(alpha)
    center(mono_canvas, mono_fill)
    return mono_canvas


def create_splash_logo(logo: Image.Image) -> Image.Image:
    return contain(logo, 520, 560)


def create_splash_canvas(logo: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    center(canvas, create_splash_logo(logo))
    return canvas


def main() -> None:
    if not BACKGROUND_PATH.exists():
        raise FileNotFoundError(f"Missing paper background at {BACKGROUND_PATH}")
    if not LOGO_PATH.exists():
        raise FileNotFoundError(f"Missing logo source at {LOGO_PATH}")

    paper = Image.open(BACKGROUND_PATH).convert("RGBA")
    logo = Image.open(LOGO_PATH).convert("RGBA")

    background = create_icon_background(paper)
    icon = create_icon_composite(background, logo)
    splash_logo = create_splash_logo(logo)
    splash_canvas = create_splash_canvas(logo)
    adaptive_foreground = create_adaptive_foreground(logo)
    monochrome_foreground = create_monochrome_foreground(logo)

    icon.save(BRANDING_DIR / "icon-ios.png")
    icon.save(BRANDING_DIR / "icon-android-legacy.png")
    background.save(BRANDING_DIR / "icon-android-background.png")
    adaptive_foreground.save(BRANDING_DIR / "icon-android-foreground.png")
    monochrome_foreground.save(BRANDING_DIR / "icon-android-monochrome.png")
    splash_logo.save(BRANDING_DIR / "splash-logo.png")
    splash_canvas.save(BRANDING_DIR / "splash-lockup.png")
    icon.resize((256, 256), Image.LANCZOS).save(ROOT / "assets" / "favicon.png")


if __name__ == "__main__":
    main()
