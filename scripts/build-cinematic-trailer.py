#!/usr/bin/env python3
"""Cinematic Aetherion trailer: living footage + Circuit Ink lower-thirds."""
from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/workspace")
OUT = ROOT / "artifacts" / "trailer"
VID = ROOT / "public" / "video"
ART = ROOT / "public" / "art"
CLIPS = Path("/tmp/trailer-clips")
OVER = Path("/tmp/trailer-over")
OUT.mkdir(parents=True, exist_ok=True)
CLIPS.mkdir(parents=True, exist_ok=True)
OVER.mkdir(parents=True, exist_ok=True)

W, H = 1280, 720
VOID = (5, 6, 10)
PAPER = (232, 238, 246)
ANIMA = (0, 232, 213)
KIMA = (255, 46, 120)
INDIGO = (43, 58, 103)
BRONZE = (196, 165, 116)
SAPPHIRE = (61, 107, 170)
GOLD = (212, 175, 55)
JADE = (61, 139, 122)
EMBER = (224, 122, 61)
PARCHMENT = (216, 201, 168)
LEATHER = (110, 74, 50)


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    path = (
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
    )
    return ImageFont.truetype(path, size)


def bars(d: ImageDraw.ImageDraw, accent_l=ANIMA, accent_r=KIMA) -> None:
    d.rectangle([0, 0, 7, H], fill=accent_l)
    d.rectangle([W - 7, 0, W, H], fill=accent_r)
    d.rectangle([0, 0, W, 3], fill=GOLD)
    d.rectangle([0, H - 3, W, H], fill=BRONZE)


def lower(name: str, kicker: str, title: str, sub: str, accent=ANIMA, accent2=KIMA) -> Path:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i in range(220):
        a = int(235 * (i / 220) ** 1.35)
        y = H - 220 + i
        d.line([(0, y), (W, y)], fill=(5, 6, 10, a))
    bars(d, accent, accent2)
    d.rectangle([56, H - 92, 56 + 220, H - 88], fill=accent)
    d.rectangle([56, H - 84, 56 + 72, H - 81], fill=GOLD)
    d.text((56, H - 168), kicker.upper(), font=font(15, False), fill=accent + (255,))
    d.text((52, H - 146), title, font=font(36), fill=PAPER + (255,))
    d.text((56, H - 98), sub, font=font(16, False), fill=PARCHMENT + (255,))
    path = OVER / f"{name}.png"
    img.save(path)
    return path


def open_card(name: str, kicker: str, title: str, sub: str) -> Path:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i in range(H):
        a = 90 if 80 < i < H - 160 else 150
        d.line([(0, i), (W, i)], fill=(5, 6, 10, a))
    bars(d)
    d.rectangle([56, 118, 56 + 280, 124], fill=ANIMA)
    d.rectangle([56, 128, 56 + 90, 132], fill=GOLD)
    d.text((56, 72), kicker.upper(), font=font(16, False), fill=ANIMA + (255,))
    d.text((48, 250), title, font=font(78), fill=PAPER + (255,))
    d.text((56, 350), sub, font=font(22, False), fill=BRONZE + (255,))
    d.text((56, 400), "Circuit Ink  ·  Dual Flow  ·  Fracture Hour", font=font(16, False), fill=SAPPHIRE + (255,))
    path = OVER / f"{name}.png"
    img.save(path)
    return path


def run(cmd: list[str]) -> None:
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def overlay_loop(src: Path, overlay: Path, dst: Path, seconds: float) -> None:
    run(
        [
            "ffmpeg",
            "-y",
            "-stream_loop",
            "-1",
            "-i",
            str(src),
            "-loop",
            "1",
            "-i",
            str(overlay),
            "-t",
            f"{seconds:.2f}",
            "-filter_complex",
            (
                f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
                f"fade=t=in:st=0:d=0.25,fade=t=out:st={seconds-0.35:.2f}:d=0.3[v];"
                f"[v][1:v]overlay=0:0,format=yuv420p[out]"
            ),
            "-map",
            "[out]",
            "-r",
            "24",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-crf",
            "21",
            "-an",
            str(dst),
        ]
    )


def ken(src: Path, dst: Path, seconds: float, overlay: Path, pan: str = "right") -> None:
    # Scale up then crop-pan. pan: right / left / up
    if pan == "right":
        expr = f"scale=1600:900:force_original_aspect_ratio=increase,crop=1600:900,crop={W}:{H}:x='(iw-ow)*t/{seconds}':y='(ih-oh)/2'"
    elif pan == "left":
        expr = f"scale=1600:900:force_original_aspect_ratio=increase,crop=1600:900,crop={W}:{H}:x='(iw-ow)*(1-t/{seconds})':y='(ih-oh)/2'"
    else:
        expr = f"scale=1600:900:force_original_aspect_ratio=increase,crop=1600:900,crop={W}:{H}:x='(iw-ow)/2':y='(ih-oh)*t/{seconds}'"
    run(
        [
            "ffmpeg",
            "-y",
            "-loop",
            "1",
            "-framerate",
            "24",
            "-i",
            str(src),
            "-loop",
            "1",
            "-i",
            str(overlay),
            "-t",
            f"{seconds:.2f}",
            "-filter_complex",
            (
                f"[0:v]{expr},fade=t=in:st=0:d=0.25,fade=t=out:st={seconds-0.3:.2f}:d=0.25[v];"
                f"[v][1:v]overlay=0:0,format=yuv420p[out]"
            ),
            "-map",
            "[out]",
            "-r",
            "24",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-crf",
            "21",
            "-an",
            str(dst),
        ]
    )


def main() -> None:
    o_open = open_card("open", "Aetherion  ·  the world is Eden", "AETHERION", "Seven continents. A murdered god. A lock called the System.")
    o_az = lower("az", "Act 0  ·  City of Echoes", "AZRAEL RAVEN", "Village Seeker  ·  torn indigo sash  ·  Well in the left palm", ANIMA, INDIGO)
    o_well = lower("well", "Resonance Well", "THE LEFT PALM", "A diamond that was not a gift  ·  Anima cyan in leather and brass", ANIMA, SAPPHIRE)
    o_hg = lower("hg", "Act I  ·  Guild Steps", "LORD HEARTGRIM", "Indigo robes  ·  naga-coil ponytail  ·  a broken Dual Flow core", SAPPHIRE, INDIGO)
    o_am = lower("am", "Durak’s honest anvil", "THE BROKEN AMULET", "Sapphire Dual Flow  ·  one shard missing  ·  Sssilvara was his", GOLD, SAPPHIRE)
    o_ws = lower("ws", "Endless Azure Fields", "WIND SERPENT", "Brass regulation  ·  Anima-lined construct  ·  not a villain", BRONZE, ANIMA)
    o_dp = lower("dp", "Dual Flow combat", "KIMA  ·  ANIMA", "Magenta body  ·  cyan soul  ·  Dual Pulse when both wells fill", KIMA, ANIMA)
    o_eden = lower("eden", "Eden  ·  seven inhabited continents", "WALK THE WORLD", "Elysara · Xihuang · Nordheim · Tezcal · Abyssara · Vindraeth · Caelus", GOLD, JADE)
    o_end = open_card("end", "Fracture Hour loops", "WALK THE HOUR", "Keep a table, or file the form.")

    segs = [
        ("01-open.mp4", lambda d: overlay_loop(VID / "loop-echoes.mp4", o_open, d, 4.2)),
        ("02-azrael.mp4", lambda d: overlay_loop(VID / "loop-azrael.mp4", o_az, d, 6.0)),
        ("03-palm.mp4", lambda d: ken(OUT / "az-palm.jpg", d, 4.0, o_well, "up")),
        ("04-heartgrim.mp4", lambda d: overlay_loop(VID / "loop-heartgrim.mp4", o_hg, d, 6.0)),
        ("05-amulet.mp4", lambda d: ken(OUT / "hg-amulet.jpg", d, 4.0, o_am, "right")),
        ("06-serpent.mp4", lambda d: overlay_loop(VID / "loop-serpent.mp4", o_ws, d, 6.2)),
        ("07-head.mp4", lambda d: ken(OUT / "ws-head.jpg", d, 3.6, o_ws, "left")),
        ("08-pulse.mp4", lambda d: overlay_loop(VID / "loop-pulse.mp4", o_dp, d, 6.0)),
        ("09-world.mp4", lambda d: overlay_loop(VID / "loop-world.mp4", o_eden, d, 5.0)),
        ("10-end.mp4", lambda d: overlay_loop(VID / "loop-echoes.mp4", o_end, d, 4.2)),
    ]

    concat_list = CLIPS / "list.txt"
    lines = []
    for name, fn in segs:
        dst = CLIPS / name
        print("encode", name, flush=True)
        fn(dst)
        lines.append(f"file '{dst}'")
    concat_list.write_text("\n".join(lines) + "\n")

    silent = CLIPS / "silent.mp4"
    print("concat", flush=True)
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_list),
            "-c",
            "copy",
            str(silent),
        ]
    )

    # Probe duration
    probe = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(silent),
        ],
        text=True,
    ).strip()
    dur = float(probe)
    print("duration", dur, flush=True)

    final = VID / "trailer.mp4"
    print("mix audio", flush=True)
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(silent),
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=55:sample_rate=44100:duration={dur:.2f}",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=110:sample_rate=44100:duration={dur:.2f}",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=329.6:sample_rate=44100:duration={dur:.2f}",
            "-filter_complex",
            (
                "[1:a]volume=0.10[a1];[2:a]volume=0.05[a2];[3:a]volume=0.02[a3];"
                "[a1][a2][a3]amix=inputs=3:duration=longest,"
                f"afade=t=in:d=1.2,afade=t=out:st={max(0, dur-2.4):.2f}:d=2.2[a]"
            ),
            "-map",
            "0:v",
            "-map",
            "[a]",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "20",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-shortest",
            str(final),
        ]
    )

    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            "7.5",
            "-i",
            str(final),
            "-frames:v",
            "1",
            "-q:v",
            "3",
            str(VID / "poster.jpg"),
        ]
    )
    print("wrote", final, flush=True)


if __name__ == "__main__":
    main()
