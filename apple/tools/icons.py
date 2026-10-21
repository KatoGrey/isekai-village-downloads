# The Apple icons and launch image from the game's 256 px pixel-art icon, scaled by whole steps (nearest neighbour, so
# the pixels stay crisp), on the game's own dark colour.
#   python icons.py <icon.png> mac <out.png>      1024 px: the macOS rounded square with the portrait inside
#   python icons.py <icon.png> ios <out.png>      1024 px: full bleed and no transparency (iOS rounds the corners itself)
#   python icons.py <icon.png> splash <out.png>   2732 px: the launch screen (cropped to the screen by iOS)
import sys
from PIL import Image, ImageDraw

src, kind, out = sys.argv[1], sys.argv[2], sys.argv[3]
BG = (42, 34, 51, 255)
icon = Image.open(src).convert('RGBA')

def scaled(target):
    """The portrait at the largest whole multiple of its size that fits in `target` px."""
    k = max(1, target // max(icon.size))
    return icon.resize((icon.width * k, icon.height * k), Image.NEAREST)

def centred(size, art, under):
    layer = under.copy()
    layer.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    return layer

if kind == 'mac':
    # Apple's grid: an 824 px rounded square (radius ~185) inside the 1024 canvas, the art within it.
    plate = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    mask = Image.new('L', (1024, 1024), 0)
    ImageDraw.Draw(mask).rounded_rectangle((100, 100, 923, 923), radius=185, fill=255)
    plate.paste(Image.new('RGBA', (1024, 1024), BG), (0, 0), mask)
    art = centred(1024, scaled(768), Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)))
    plate.paste(art, (0, 0), Image.composite(art, Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)), mask))
    plate.save(out)
elif kind == 'ios':
    centred(1024, scaled(768), Image.new('RGBA', (1024, 1024), BG)).convert('RGB').save(out)
elif kind == 'splash':
    centred(2732, scaled(1024), Image.new('RGBA', (2732, 2732), BG)).convert('RGB').save(out)
else:
    sys.exit(f'unknown kind {kind}')
print(f'{kind} -> {out}')
