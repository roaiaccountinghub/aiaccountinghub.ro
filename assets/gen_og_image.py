from PIL import Image, ImageDraw, ImageFont
import math, os

W, H = 1200, 630
img = Image.new("RGB", (W, H), "#07121a")
draw = ImageDraw.Draw(img)

# --- grid lines ---
grid_color = (34, 211, 238, 15)
grid_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(grid_img)
step = 60
for x in range(0, W, step):
    gdraw.line([(x, 0), (x, H)], fill=(34, 211, 238, 12), width=1)
for y in range(0, H, step):
    gdraw.line([(0, y), (W, y)], fill=(34, 211, 238, 12), width=1)
img = Image.alpha_composite(img.convert("RGBA"), grid_img)

# --- radial glow left (teal-blue) ---
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
for r in range(280, 0, -1):
    alpha = int(55 * (1 - r / 280) ** 2)
    color = (8, 145, 178, alpha)
    bbox = [-100 + 280 - r, -100 + 280 - r, -100 + 280 + r, -100 + 280 + r]
    ImageDraw.Draw(glow).ellipse(bbox, fill=color)
img = Image.alpha_composite(img, glow)

# --- radial glow right (teal-green) ---
glow2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
for r in range(220, 0, -1):
    alpha = int(40 * (1 - r / 220) ** 2)
    color = (13, 148, 136, alpha)
    bbox = [W + 50 - r, H + 50 - r, W + 50 + r, H + 50 + r]
    ImageDraw.Draw(glow2).ellipse(bbox, fill=color)
img = Image.alpha_composite(img, glow2)

draw = ImageDraw.Draw(img)

# --- top gradient bar ---
for x in range(W):
    t = x / W
    r = int(8 + (34 - 8) * t * 2) if t < 0.5 else int(34 + (13 - 34) * (t - 0.5) * 2)
    g = int(145 + (211 - 145) * t * 2) if t < 0.5 else int(211 + (148 - 211) * (t - 0.5) * 2)
    b = int(178 + (238 - 178) * t * 2) if t < 0.5 else int(238 + (136 - 238) * (t - 0.5) * 2)
    draw.line([(x, 0), (x, 4)], fill=(r, g, b))

# --- fonts (Windows system fonts) ---
font_dir = "C:/Windows/Fonts/"
def load_font(names, size):
    for name in names:
        try:
            return ImageFont.truetype(font_dir + name, size)
        except:
            pass
    return ImageFont.load_default()

font_logo   = load_font(["segoeuib.ttf", "calibrib.ttf", "arialbd.ttf"], 24)
font_heading1 = load_font(["segoeuib.ttf", "calibrib.ttf", "arialbd.ttf"], 58)
font_heading2 = load_font(["segoeuib.ttf", "calibrib.ttf", "arialbd.ttf"], 58)
font_tagline  = load_font(["segoeui.ttf",  "calibri.ttf",  "arial.ttf"],   24)
font_domain   = load_font(["segoeui.ttf",  "calibri.ttf",  "arial.ttf"],   18)

# --- logo icon (rounded rect with house) ---
icon_x, icon_y, icon_size = 60, 60, 52
# gradient background for icon
for row in range(icon_size):
    t = row / icon_size
    ri = int(8  + (13  - 8)  * t)
    gi = int(145 + (148 - 145) * t)
    bi = int(178 + (136 - 178) * t)
    draw.rectangle([icon_x, icon_y + row, icon_x + icon_size, icon_y + row + 1], fill=(ri, gi, bi))
# clip to rounded rect (approximate with ellipse corners)
mask = Image.new("L", (icon_size, icon_size), 0)
mdraw = ImageDraw.Draw(mask)
r_corner = 10
mdraw.rounded_rectangle([0, 0, icon_size - 1, icon_size - 1], radius=r_corner, fill=255)
icon_img = img.crop((icon_x, icon_y, icon_x + icon_size, icon_y + icon_size))
icon_bg = Image.new("RGB", (icon_size, icon_size), "#07121a")
icon_bg.paste(icon_img, mask=mask)
img.paste(icon_bg, (icon_x, icon_y))
# apply mask to keep rounded corners
final_mask = Image.new("RGBA", (W, H), (0, 0, 0, 0))
final_mask.paste(icon_bg.convert("RGBA"), (icon_x, icon_y))

# house shape on icon
draw = ImageDraw.Draw(img)
cx, cy = icon_x + icon_size // 2, icon_y + icon_size // 2
# roof polygon
draw.polygon([
    (icon_x + 26, icon_y + 9),
    (icon_x + 8,  icon_y + 20),
    (icon_x + 44, icon_y + 20),
], fill=(255, 255, 255, 240))
# body
draw.rectangle([icon_x + 12, icon_y + 19, icon_x + 40, icon_y + 38], fill=(255, 255, 255))
# door (teal cutout)
draw.rectangle([icon_x + 20, icon_y + 26, icon_x + 32, icon_y + 38], fill=(14, 116, 144))

# --- logo text ---
draw.text((icon_x + icon_size + 16, icon_y + 14), "AI Accounting Hub",
          font=font_logo, fill=(232, 243, 248))

# --- heading line 1: "Unde" (white) + " Inteligența Artificială" (cyan) ---
pad_y = icon_y + icon_size + 36
draw.text((60, pad_y), "Unde ", font=font_heading1, fill=(232, 243, 248))
w_unde = draw.textlength("Unde ", font=font_heading1)
draw.text((60 + w_unde, pad_y), "Inteligența Artificială", font=font_heading1, fill=(34, 211, 238))

# --- heading line 2 ---
line2_y = pad_y + 70
draw.text((60, line2_y), "întâlnește Contabilitatea", font=font_heading2, fill=(232, 243, 248))

# --- tagline ---
tagline_y = line2_y + 76
draw.text((60, tagline_y),
          "Resurse, analize și strategii pentru profesioniștii contabili din România",
          font=font_tagline, fill=(139, 169, 184))

# --- domain badge ---
badge_text = "aiaccountinghub.ro"
badge_w = int(draw.textlength(badge_text, font=font_domain)) + 36
badge_h = 38
badge_x = W - badge_w - 60
badge_y = H - badge_h - 40
draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h],
                        radius=8, fill=(34, 211, 238, 25), outline=(34, 211, 238, 64))
draw.text((badge_x + 18, badge_y + 9), badge_text, font=font_domain, fill=(34, 211, 238))

# --- save ---
out = os.path.join(os.path.dirname(__file__), "og-image.png")
img.convert("RGB").save(out, "PNG", optimize=True)
print(f"Saved: {out}")
