"""Build the JevBench pixel-J logo GIF, still PNG, favicon, and touch icon.

The mark is a geometric J in the site palette (mint #6ee7b7 -> cyan #22d3ee).
It holds, cracks into grid pixels, scatters, then fuses back. Loop is seamless.
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

# Site tokens
BG = (10, 11, 15)  # #0a0b0f
MINT = (110, 231, 183)  # #6ee7b7
CYAN = (34, 211, 238)  # #22d3ee
HIGH = (232, 234, 240)  # #e8eaf0

# Asset size. 128 displayed at 32px is an integer 4x scale.
SIZE = 128
CELL = 4  # image px; one "pixel" of the deconstruction


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    return tuple(int(a[i] + (b[i] - a[i]) * t + 0.5) for i in range(3))  # type: ignore[return-value]


# Hand-authored 32x32 capital J. Flat top bar, one right stem, hook only
# at the bottom. This is the letter — do not derive it from an arc.
J_BITMAP = (
    "................................",
    "................................",
    "................................",
    "................................",
    "........##############..........",
    "........##############..........",
    "........##############..........",
    ".................#####..........",
    ".................#####..........",
    ".................#####..........",
    ".................#####..........",
    ".................#####..........",
    ".................#####..........",
    ".................#####..........",
    ".................#####..........",
    ".................#####..........",
    ".................#####..........",
    ".................#####..........",
    ".........####....#####..........",
    "........#####....#####..........",
    ".........#####...#####..........",
    "..........############..........",
    "...........###########..........",
    "............##########..........",
    ".............########...........",
    "..............######............",
    "...............####.............",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
)


def glyph_cells() -> list[tuple[int, int]]:
    if len(J_BITMAP) != 32 or any(len(row) != 32 for row in J_BITMAP):
        raise SystemExit("J bitmap must be 32x32")
    return [(x, y) for y, row in enumerate(J_BITMAP) for x, ch in enumerate(row) if ch == "#"]


def cells_from_mask(mask: Image.Image | None = None, cell: int = CELL) -> list[dict]:
    """Particles for the authored J. `mask` is ignored; the bitmap is the source."""
    del mask, cell
    found = glyph_cells()
    if not found:
        raise SystemExit("J bitmap produced no cells")
    cx = sum(g[0] for g in found) / len(found)
    cy = sum(g[1] for g in found) / len(found)
    cols = 32
    rows = 32
    particles = []
    for i, (gx, gy) in enumerate(found):
        dx, dy = gx - cx, gy - cy
        dist = math.hypot(dx, dy) or 1.0
        ux, uy = dx / dist, dy / dist
        tx, ty = -uy, ux
        # Stable per-cell jitter.
        h1 = (i * 47 + gx * 13 + gy * 29) % 1000 / 1000.0
        h2 = (i * 91 + gx * 7 + gy * 17) % 1000 / 1000.0
        h3 = (i * 53 + 11) % 1000 / 1000.0
        burst = 2.4 + h1 * 3.4  # in cells
        tangent = (h2 - 0.5) * 3.2
        # Outer cells travel a little farther.
        burst += min(2.0, dist * 0.18)
        scx = gx + ux * burst + tx * tangent
        scy = gy + uy * burst * 0.9 + ty * tangent * 0.45
        # Keep the whole cell on canvas, including the split at the peak.
        scx = min(cols - 1.35, max(0.35, scx))
        scy = min(rows - 1.35, max(0.35, scy))
        # 135deg mint (top-left) -> cyan (bottom-right), matching the old tile.
        t = (gx + gy) / ((cols - 1) + (rows - 1))
        color = mix(MINT, CYAN, t)
        # A few specular chips on the upper-left of the bar.
        if gy <= 8 and gx <= 12 and h3 > 0.82:
            color = mix(color, HIGH, 0.55)
        delay = (1.0 - min(1.0, dist / 14.0)) * 0.28  # inner cells linger
        particles.append(
            {
                "gx": gx,
                "gy": gy,
                "scx": scx,
                "scy": scy,
                "tx": tx,
                "ty": ty,
                "color": color,
                "delay": delay,
                "spin": (h2 - 0.5),  # used as a sideways bow
            }
        )
    return particles


def smoothstep(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def particle_pose(p: dict, e: float, cell: int = CELL) -> tuple[float, float, float]:
    """Return image-space top-left and draw size for a cell at progress e.

    e=0 is fused into the letter. e=1 is scattered and split into a smaller pixel.
    """
    # Local progress so inner pixels leave after outer ones. Reconstruct
    # passes e from 1 to 0, which reverses the same delays.
    span = 0.72
    local = smoothstep((e - p["delay"]) / span)
    # Bow the path so pixels arc away instead of sliding in straight lines.
    bow = math.sin(local * math.pi) * p["spin"] * cell * 1.6
    x = (p["gx"] + (p["scx"] - p["gx"]) * local) * cell + p["tx"] * bow
    y = (p["gy"] + (p["scy"] - p["gy"]) * local) * cell + p["ty"] * bow
    # Open a gap first, then shrink toward a clearly separate pixel.
    crack = smoothstep(min(1.0, local / 0.22))
    shrink = crack * 0.42
    size = cell * (1.0 - shrink)
    inset = (cell - size) / 2.0
    return x + inset, y + inset, size


def render_frame(particles: list[dict], e: float, bg: tuple[int, int, int] | None) -> Image.Image:
    im = Image.new("RGBA", (SIZE, SIZE), (*bg, 255) if bg is not None else (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    # Draw farther particles first so nearer (less delayed) ones sit on top
    # while the letter is reforming. Stable enough for a logo.
    order = sorted(particles, key=lambda p: p["delay"], reverse=True)
    for p in order:
        x, y, size = particle_pose(p, e)
        if size < 0.8:
            continue
        # Snap to the pixel grid when fused so the letter is crisp and the
        # loop has no subpixel shimmer at rest.
        if e < 0.001:
            x, y, size = p["gx"] * CELL, p["gy"] * CELL, CELL
        draw.rectangle([x, y, x + size - 0.01, y + size - 0.01], fill=(*p["color"], 255))
    return im


def build_palette() -> list[int]:
    """Index 0 is the transparent key. The rest covers the mint-cyan ramp."""
    colors = [(255, 0, 255)]  # unused key, never drawn
    for i in range(17):
        colors.append(mix(MINT, CYAN, i / 16))
    colors.append(HIGH)
    colors.append(mix(HIGH, MINT, 0.5))
    colors.append(BG)
    flat: list[int] = []
    for c in colors:
        flat.extend(c)
    flat.extend([0] * (768 - len(flat)))
    return flat


PALETTE = build_palette()


def to_gif_frame(im: Image.Image) -> Image.Image:
    rgba = np.asarray(im.convert("RGBA"))
    rgb = rgba[:, :, :3].astype(np.int32)
    alpha = rgba[:, :, 3]
    n = 21  # key + 17-step ramp + highlight, mix, and background
    pal = np.asarray(PALETTE[: n * 3], dtype=np.int32).reshape(n, 3)
    # int32: int16 squares overflow and map letter pixels to transparent.
    diff = rgb[:, :, None, :] - pal[None, None, :, :]
    idx = np.argmin(np.sum(diff * diff, axis=3), axis=2).astype(np.uint8)
    idx[alpha < 128] = 0
    out = Image.fromarray(idx, mode="P")
    out.putpalette(PALETTE)
    return out


def timeline() -> list[float]:
    """Progress values, one per frame. 0 = fused letter, 1 = fully scattered."""
    fps_hold = 16
    # Seconds. The letter is whole for most of the loop so the header stays readable.
    hold_a = int(1.15 * fps_hold)
    depart = int(0.85 * fps_hold)
    hold_scatter = int(0.28 * fps_hold)
    arrive = int(0.85 * fps_hold)
    hold_b = int(0.70 * fps_hold)
    frames: list[float] = []
    frames += [0.0] * hold_a
    frames += [smoothstep(i / (depart - 1)) for i in range(depart)]
    frames += [1.0] * hold_scatter
    frames += [smoothstep(1.0 - i / (arrive - 1)) for i in range(arrive)]
    frames += [0.0] * hold_b
    return frames


def assert_gif_is_j(path: Path) -> None:
    """The resting frame must be the authored bitmap, cell for cell."""
    im = Image.open(path)
    im.seek(0)
    px = im.convert("RGBA").load()
    bad = []
    for y, row in enumerate(J_BITMAP):
        for x, ch in enumerate(row):
            on = px[x * CELL + CELL // 2, y * CELL + CELL // 2][3] > 128
            if on != (ch == "#"):
                bad.append((x, y, ch, on))
    if bad:
        raise SystemExit(f"resting frame is not the J bitmap ({len(bad)} cells differ, first {bad[:8]})")
    print("resting frame matches the J bitmap")


def main() -> None:
    print("\n".join(J_BITMAP))
    particles = cells_from_mask()
    print(f"cells: {len(particles)}")

    progress = timeline()
    duration_ms = 1000 // 16
    gif_frames = [to_gif_frame(render_frame(particles, e, bg=None)) for e in progress]

    gif_path = PUBLIC / "logo-j.gif"
    gif_frames[0].save(
        gif_path,
        save_all=True,
        append_images=gif_frames[1:],
        duration=duration_ms,
        loop=0,
        disposal=2,
        transparency=0,
        optimize=False,
    )
    print(f"gif {gif_path} frames={len(gif_frames)} bytes={gif_path.stat().st_size}")
    assert_gif_is_j(gif_path)

    still = render_frame(particles, 0.0, bg=None)
    still_path = PUBLIC / "logo-j.png"
    still.save(still_path)
    print(f"png {still_path}")

    write_favicon(particles)
    write_touch_icon(particles)
    update_og(particles)


def write_favicon(particles: list[dict]) -> None:
    """Crisp SVG favicon: dark rounded tile, same pixel J."""
    rects = []
    for p in particles:
        color = p["color"]
        hex_color = f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}"
        rects.append(
            f'<rect x="{p["gx"] * CELL}" y="{p["gy"] * CELL}" width="{CELL}" height="{CELL}" fill="{hex_color}"/>'
        )
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" shape-rendering="crispEdges">
  <rect width="{SIZE}" height="{SIZE}" rx="28" fill="#0a0b0f"/>
  {''.join(rects)}
</svg>
"""
    (PUBLIC / "favicon.svg").write_text(svg, encoding="utf-8")
    print("favicon.svg")


def write_touch_icon(particles: list[dict]) -> None:
    """180px home-screen icon. Dark tile, luminous J, no animation."""
    frame = render_frame(particles, 0.0, bg=None)
    icon = Image.new("RGB", (180, 180), BG)
    mark = frame.resize((128, 128), Image.Resampling.NEAREST)
    icon.paste(mark, (26, 26), mark)
    mask = Image.new("L", (180, 180), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, 179, 179], radius=40, fill=255)
    out = Image.new("RGB", (180, 180), (0, 0, 0))
    out.paste(icon, mask=mask)
    # Corners outside the radius stay black, which matches the previous icon.
    path = PUBLIC / "apple-touch-icon.png"
    out.save(path, optimize=True)
    print(f"touch {path}")


def update_og(particles: list[dict]) -> None:
    """Replace the JB chip on the social card with the same J, grid intact."""
    og = Image.open(PUBLIC / "og.png").convert("RGBA")
    arr = np.array(og)
    src = arr.copy()
    # Inclusive bounds of the old rounded chip, plus a pixel of antialiasing.
    # Copy a clean grid cell from the left so reruns do not smear the letter.
    x0, y0, x1, y1 = 78, 165, 153, 240
    for x in range(x0, x1 + 1):
        sx = x
        while x0 <= sx <= x1:
            sx -= 48
        arr[y0 : y1 + 1, x] = src[y0 : y1 + 1, sx]
    repaired = Image.fromarray(arr, "RGBA")
    side = 68
    mark = render_frame(particles, 0.0, bg=None).resize((side, side), Image.Resampling.NEAREST)
    cx = (80 + 151) // 2
    cy = (167 + 238) // 2
    repaired.paste(mark, (cx - side // 2, cy - side // 2), mark)
    repaired.convert("RGB").save(PUBLIC / "og.png", optimize=True)
    print("og.png")


if __name__ == "__main__":
    main()
