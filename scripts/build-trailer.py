#!/usr/bin/env python3
"""Assemble the Aetherion cinematic trailer from existing character loops."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

CARDS = Path("/tmp/trailer-cards")
CARDS.mkdir(parents=True, exist_ok=True)
W, H = 1280, 720
VOID = (5, 6, 10)
PAPER = (232, 238, 246)
ANIMA = (0, 232, 213)
KIMA = (255, 46, 120)
BRONZE = (196, 165, 116)
GOLD = (212, 175, 55)

def font(size, bold=True):
    path = (
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
    )
    return ImageFont.truetype(path, size)

def card(name, kicker, title, sub):
    img = Image.new("RGB", (W, H), VOID)
    d = ImageDraw.Draw(img)
    for i in range(H):
        t = i / H
        d.line([(0, i), (W, i)], fill=(int(5 + 38 * (1 - t) * 0.35), int(6 + 52 * (1 - t) * 0.25), int(10 + 93 * (1 - t) * 0.4)))
    d.rectangle([0, 0, 8, H], fill=ANIMA)
    d.rectangle([W - 8, 0, W, H], fill=KIMA)
    d.rectangle([56, 640, 420, 646], fill=BRONZE)
    d.rectangle([56, 652, 190, 656], fill=GOLD)
    d.text((56, 72), kicker.upper(), font=font(18, False), fill=ANIMA)
    d.text((52, 250), title, font=font(72), fill=PAPER)
    d.text((56, 360), sub, font=font(22, False), fill=BRONZE)
    img.save(CARDS / f"{name}.png")

card("open", "Circuit Ink  ·  seven continents", "AETHERION", "The world is Eden")
card("az", "Act 0  ·  City of Echoes", "AZRAEL RAVEN", "Seeker of Echoes  ·  Resonance Well in the left palm")
card("hg", "Act I  ·  Guild Steps", "LORD HEARTGRIM", "The Grimpling  ·  indigo, a broken Dual Flow core")
card("ws", "Endless Azure Fields", "WIND SERPENT", "A brass regulation  ·  not a villain")
card("dp", "Dual Flow", "KIMA  ·  ANIMA", "Magenta body  ·  cyan soul  ·  the System hates both")
card("end", "Fracture Hour loops", "WALK THE HOUR", "Keep a table, or file the form")
print("ok")
