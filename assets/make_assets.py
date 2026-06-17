"""Generate Flaily PNG icons + social card from code (no external assets)."""
from PIL import Image, ImageDraw, ImageFont
import os

HERE = os.path.dirname(os.path.abspath(__file__))
BG = (11, 15, 23)
SURFACE = (19, 27, 41)
TEAL = (45, 212, 191)
AMBER = (251, 191, 36)
TEXT = (232, 238, 248)
MUTED = (147, 161, 184)


def font(size, bold=True):
    names = (["arialbd.ttf", "segoeuib.ttf"] if bold else ["arial.ttf", "segoeui.ttf"])
    for n in names:
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            continue
    return ImageFont.load_default()


def rounded(draw, box, r, **kw):
    draw.rounded_rectangle(box, radius=r, **kw)


def draw_mark(img, cx, cy, scale, ss=4):
    """Envelope + sparkle, drawn supersampled for crisp edges."""
    layer = Image.new("RGBA", (int(140 * scale * ss), int(140 * scale * ss)), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    s = scale * ss
    w = int(2.8 * s)
    # envelope body
    ex0, ey0, ex1, ey1 = 18 * s, 30 * s, 122 * s, 105 * s
    rounded(d, [ex0, ey0, ex1, ey1], int(14 * s), outline=TEAL, width=w)
    # flap
    d.line([(24 * s, 40 * s), (70 * s, 74 * s), (116 * s, 40 * s)],
           fill=TEAL, width=w, joint="curve")
    # sparkle (4-point star) top-right
    sx, sy, r1, r2 = 104 * s, 26 * s, 16 * s, 6 * s
    pts = []
    import math
    for i in range(8):
        ang = math.pi / 2 - i * math.pi / 4
        rr = r1 if i % 2 == 0 else r2
        pts.append((sx + rr * math.cos(ang), sy - rr * math.sin(ang)))
    d.polygon(pts, fill=AMBER)
    layer = layer.resize((int(140 * scale), int(140 * scale)), Image.LANCZOS)
    img.paste(layer, (int(cx - 70 * scale), int(cy - 67 * scale)), layer)


def make_icon(size, maskable_pad=0.0):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(size * 0.22)
    rounded(d, [0, 0, size, size], r, fill=BG)
    scale = (size / 140.0) * (1 - maskable_pad)
    draw_mark(img, size / 2, size / 2, scale)
    return img


def make_og():
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    # soft glow blobs
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-150, -200, 520, 380], fill=(45, 212, 191, 46))
    gd.ellipse([720, -240, 1380, 360], fill=(129, 140, 248, 46))
    from PIL import ImageFilter
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    img.paste(Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB"), (0, 0))
    d = ImageDraw.Draw(img)

    # brand row
    draw_mark(img, 96, 96, 0.62)
    d.text((150, 70), "Flaily", font=font(46), fill=TEXT)

    # headline
    d.text((80, 210), "Stop flailing", font=font(96), fill=TEXT)
    d.text((80, 312), "in your inbox.", font=font(96), fill=TEAL)

    # subhead
    sub = "AI triage for Gmail — stars what matters, drafts your replies,"
    sub2 = "never sends without you."
    d.text((82, 446), sub, font=font(30, bold=False), fill=MUTED)
    d.text((82, 488), sub2, font=font(30, bold=False), fill=MUTED)

    # footer tag
    d.text((82, 560), "a portfolio project by Florian Sumi", font=font(24, bold=False), fill=(100, 116, 139))
    img.save(os.path.join(HERE, "og-image.png"), "PNG")


make_icon(192).save(os.path.join(HERE, "icon-192.png"), "PNG")
make_icon(512).save(os.path.join(HERE, "icon-512.png"), "PNG")
make_og()
print("Wrote icon-192.png, icon-512.png, og-image.png")
