"""
build_hero_banner.py — generates src/assets/hero-jaipur.svg

An illustrated Jaipur skyline at sunset, drawn as five depth planes:

  1. far ridge          palest, lowest contrast
  2. distant skyline
  3. the palace facade  the hero silhouette
  4. near parapet
  5. cafe table + cup   darkest, highest contrast, nearest the viewer

Depth comes from atmospheric perspective: each plane recedes by getting
lighter, warmer and lower in contrast, with a single full-height haze
gradient peaking at the horizon (banded haze rects leave visible seams).

The steam animation is embedded in the SVG so it still runs when the file
is used as a plain <img>, and it stops under prefers-reduced-motion.

Usage:  python scripts/build_hero_banner.py
Output: hero.svg in the working directory — copy to src/assets/
"""

import math, random
random.seed(11)

W, H = 1600, 560
HOR = 358                      # horizon line

def arch(x, y, w, h, fill, op=1.0, extra=""):
    """Cusped 'Hawa Mahal' arch, anchored at its base-left."""
    r = w / 2
    return (f'<path d="M {x:.1f} {y:.1f} L {x:.1f} {y-h+r:.1f} '
            f'Q {x:.1f} {y-h-r*0.3:.1f} {x+r:.1f} {y-h-r*0.3:.1f} '
            f'Q {x+w:.1f} {y-h-r*0.3:.1f} {x+w:.1f} {y-h+r:.1f} '
            f'L {x+w:.1f} {y:.1f} Z" fill="{fill}" opacity="{op:.2f}"{extra}/>')

def chhatri(x, base, w, h, fill):
    """Domed rooftop pavilion — the repeating Jaipur motif."""
    p = w * 0.5
    return (f'<g fill="{fill}">'
            f'<rect x="{x-p*0.66:.1f}" y="{base-h*0.40:.1f}" width="{w*0.66:.1f}" height="{h*0.40:.1f}"/>'
            f'<path d="M {x-p*0.86:.1f} {base-h*0.40:.1f} Q {x:.1f} {base-h*1.18:.1f} {x+p*0.86:.1f} {base-h*0.40:.1f} Z"/>'
            f'<rect x="{x-1.3:.1f}" y="{base-h*1.36:.1f}" width="2.6" height="{h*0.24:.1f}"/>'
            f'</g>')

def skyline(y, fill, op, scale, seed):
    """A band of domes/towers at a given depth plane."""
    rnd = random.Random(seed)
    g = [f'<g fill="{fill}" opacity="{op}">']
    x = -40
    while x < W + 60:
        kind = rnd.random()
        w = rnd.uniform(26, 68) * scale
        h = rnd.uniform(30, 78) * scale
        if kind < 0.18:                                   # slim minaret
            tw = rnd.uniform(9, 15) * scale
            th = rnd.uniform(70, 118) * scale
            g.append(f'<rect x="{x:.1f}" y="{y-th:.1f}" width="{tw:.1f}" height="{th:.1f}"/>')
            g.append(f'<path d="M {x-tw*0.34:.1f} {y-th:.1f} Q {x+tw/2:.1f} {y-th-tw*0.95:.1f} '
                     f'{x+tw*1.34:.1f} {y-th:.1f} Z"/>')
            x += tw + rnd.uniform(16, 44) * scale
        elif kind < 0.62:                                 # domed pavilion
            g.append(chhatri(x + w/2, y, w, h, fill))
            x += w + rnd.uniform(10, 40) * scale
        else:                                             # flat block w/ parapet
            g.append(f'<rect x="{x:.1f}" y="{y-h*0.7:.1f}" width="{w:.1f}" height="{h*0.7:.1f}"/>')
            n = max(2, int(w / (9*scale)))
            for k in range(n):
                g.append(f'<rect x="{x + w*k/n:.1f}" y="{y-h*0.7-5*scale:.1f}" '
                         f'width="{w/n*0.55:.1f}" height="{5*scale:.1f}"/>')
            x += w + rnd.uniform(12, 46) * scale
    g.append('</g>')
    return "".join(g)

O = []
A = O.append
A(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
  f'preserveAspectRatio="xMidYMid slice" role="img" '
  f'aria-label="Illustrated Jaipur skyline at sunset, seen from a cafe table">')

A("""<style>
 .steam{animation:rise 5.2s ease-in-out infinite;animation-delay:var(--d,0s);transform-origin:center bottom}
 @keyframes rise{0%{opacity:0;transform:translateY(6px) scaleY(.92)}
  30%{opacity:.45}70%{opacity:.28}
  100%{opacity:0;transform:translateY(-16px) scaleY(1.1)}}
 @media (prefers-reduced-motion:reduce){.steam{animation:none;opacity:.34}}
</style>""")
A('<defs>')
A('''<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%"   stop-color="#241B47"/>
 <stop offset="18%"  stop-color="#4A2A63"/>
 <stop offset="38%"  stop-color="#8E3F63"/>
 <stop offset="58%"  stop-color="#D2645A"/>
 <stop offset="76%"  stop-color="#F09A56"/>
 <stop offset="92%"  stop-color="#FFC978"/>
 <stop offset="100%" stop-color="#FFE3A6"/>
</linearGradient>''')
A('''<radialGradient id="glow" cx="50%" cy="50%" r="50%">
 <stop offset="0%"   stop-color="#FFF0C4" stop-opacity="1"/>
 <stop offset="30%"  stop-color="#FFCE84" stop-opacity="0.62"/>
 <stop offset="70%"  stop-color="#FF9E55" stop-opacity="0.2"/>
 <stop offset="100%" stop-color="#FF8A44" stop-opacity="0"/>
</radialGradient>''')
# Single full-height haze that peaks AT the horizon — no hard rect edges anywhere.
A(f'''<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%"   stop-color="#FFC98A" stop-opacity="0"/>
 <stop offset="{(HOR-120)/H*100:.0f}%" stop-color="#FFC98A" stop-opacity="0.22"/>
 <stop offset="{HOR/H*100:.0f}%"       stop-color="#FFD9A2" stop-opacity="0.46"/>
 <stop offset="{(HOR+90)/H*100:.0f}%"  stop-color="#FFBE84" stop-opacity="0.12"/>
 <stop offset="100%" stop-color="#FFB478" stop-opacity="0"/>
</linearGradient>''')
A('''<linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
 <stop offset="0%"   stop-color="#1C0F22" stop-opacity="0.80"/>
 <stop offset="34%"  stop-color="#1C0F22" stop-opacity="0.46"/>
 <stop offset="64%"  stop-color="#1C0F22" stop-opacity="0.10"/>
 <stop offset="100%" stop-color="#1C0F22" stop-opacity="0"/>
</linearGradient>''')
A('''<linearGradient id="tabletop" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%"   stop-color="#4A1520"/>
 <stop offset="100%" stop-color="#1B070D"/>
</linearGradient>''')
A('''<radialGradient id="vig" cx="50%" cy="42%" r="76%">
 <stop offset="58%"  stop-color="#000" stop-opacity="0"/>
 <stop offset="100%" stop-color="#170A16" stop-opacity="0.5"/>
</radialGradient>''')
A('</defs>')

# ══════ sky ══════
A(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
A(f'<ellipse cx="782" cy="{HOR-4}" rx="430" ry="252" fill="url(#glow)"/>')
A(f'<circle cx="782" cy="{HOR-46}" r="42" fill="#FFF3CE" opacity="0.95"/>')
for bx, by, s in [(300,120,1.0),(342,102,0.78),(376,128,0.66),(250,158,0.58),(1372,96,0.7),(1410,118,0.55)]:
    A(f'<path d="M {bx} {by} q {5.5*s:.1f} {-4.5*s:.1f} {10*s:.1f} 0 q {4.5*s:.1f} {-4.5*s:.1f} {10*s:.1f} 0" '
      f'fill="none" stroke="#3A2148" stroke-width="{1.8*s:.1f}" stroke-linecap="round" opacity="0.45"/>')

# ══════ PLANE 1 — farthest: pale, low contrast ══════
A(skyline(HOR - 4, "#E3A894", 0.40, 0.72, 1))

# ══════ PLANE 2 — mid-distance ══════
A(skyline(HOR + 16, "#C97F77", 0.62, 0.92, 2))

# ══════ PLANE 3 — HERO: the Hawa Mahal facade ══════
FX, FW, FBASE = 902, 470, HOR + 58
TIERS = [(0, 5, 78), (52, 4, 62), (108, 3, 50), (162, 2, 40)]   # inset, storeys… tiered pyramid
g3 = "#9A4A52"
A(f'<g opacity="0.95">')
A(f'<rect x="{FX}" y="{FBASE-96}" width="{FW}" height="96" fill="{g3}"/>')
y = FBASE - 96
for inset, _, th in TIERS:
    x0, w0 = FX + inset, FW - inset*2
    A(f'<rect x="{x0}" y="{y-th}" width="{w0}" height="{th}" fill="{g3}"/>')
    # glowing arched windows along the tier
    n = max(3, int(w0 / 56))
    step = w0 / n
    for k in range(n):
        A(arch(x0 + step*k + step*0.2, y - 12, step*0.6, th*0.5,
               "#FFD79A", 0.30 + 0.45*random.random()))
    # chhatris crowning the tier
    cn = max(3, int(w0 / 62))
    cs = w0 / cn
    for k in range(cn):
        A(chhatri(x0 + cs*(k+0.5), y - th, cs*0.72, 26, g3))
    y -= th
# central spire
A(f'<path d="M {FX+FW/2-16} {y} L {FX+FW/2} {y-54} L {FX+FW/2+16} {y} Z" fill="{g3}"/>')
A(f'<circle cx="{FX+FW/2}" cy="{y-58}" r="5" fill="{g3}"/>')
A('</g>')

# ══════ atmospheric haze — one layer, full height, no seams ══════
A(f'<rect width="{W}" height="{H}" fill="url(#haze)"/>')

# ══════ PLANE 4 — near rooftops, dark and higher contrast ══════
g4 = "#5E2130"
A(f'<g fill="{g4}">')
A(f'<rect x="0" y="{HOR+74}" width="{W}" height="{H-HOR-74}"/>')
# one unbroken parapet across the frame, with depth-varying pavilions
rnd4 = random.Random(21)
x = -30
while x < W + 40:
    w = rnd4.uniform(40, 86)
    if rnd4.random() < 0.22:                      # occasional solid merlon block
        bh = rnd4.uniform(20, 32)
        A(f'<rect x="{x:.0f}" y="{HOR+76-bh:.0f}" width="{w:.0f}" height="{bh:.0f}"/>')
    else:
        A(chhatri(x + w/2, HOR + 76, w, rnd4.uniform(30, 56), g4))
    x += w + rnd4.uniform(2, 18)
A(f'<rect x="0" y="{HOR+74}" width="{W}" height="24"/>')
A('</g>')
# lattice screen glints along the parapet
for k in range(26):
    A(f'<circle cx="{26+k*62}" cy="{HOR+86}" r="5" fill="#FFC486" opacity="0.17"/>')

# ══════ PLANE 5 — foreground: framing arch + table + cup ══════
g5 = "#2A0B14"
TY = H - 68
A(f'<rect x="0" y="{TY}" width="{W}" height="{H-TY}" fill="url(#tabletop)"/>')
A(f'<rect x="0" y="{TY-10}" width="{W}" height="15" rx="5" fill="#7A2838"/>')
A(f'<rect x="0" y="{TY-10}" width="{W}" height="4" fill="#C9705A" opacity="0.6"/>')
for gx in range(0, W, 7):
    A(f'<rect x="{gx}" y="{TY+6}" width="3" height="{H-TY-6}" fill="#FFB98A" '
      f'opacity="{0.012 + 0.016*random.random():.3f}"/>')
CX = 1232
A(f'<ellipse cx="{CX}" cy="{TY+30}" rx="150" ry="34" fill="#C46A3A" opacity="0.13"/>')
A(f'<ellipse cx="{CX}" cy="{TY+26}" rx="96" ry="20" fill="#160509" opacity="0.5"/>')
A(f'<path d="M {CX-52} {TY+22} h 104 a 11 11 0 0 1 -11 11 h -82 a 11 11 0 0 1 -11 -11 Z" fill="#7C2838"/>')
A(f'<path d="M {CX-36} {TY-26} h 72 l -9 46 h -54 Z" fill="#8E2F40"/>')
A(f'<path d="M {CX+36} {TY-18} q 28 3 26 18 q -2 13 -24 13" fill="none" stroke="#8E2F40" '
  f'stroke-width="8" stroke-linecap="round"/>')
A(f'<ellipse cx="{CX}" cy="{TY-26}" rx="36" ry="9" fill="#followme"/>'.replace("#followme", "#2B1008"))
A(f'<ellipse cx="{CX}" cy="{TY-27}" rx="31" ry="7" fill="#6B3A1E" opacity="0.85"/>')
for i, (sx, d) in enumerate([(CX-15, 0), (CX, 1.2), (CX+15, 2.4)]):
    A(f'<path class="steam" style="--d:{d}s" d="M {sx} {TY-36} c -10 -17 10 -26 0 -43 c -9 -16 8 -25 1 -39" '
      f'fill="none" stroke="#FFE7C4" stroke-width="3.6" stroke-linecap="round" opacity="0.4"/>')
A(f'<rect width="{W}" height="{H}" fill="url(#scrim)"/>')
A(f'<rect width="{W}" height="{H}" fill="url(#vig)"/>')
A('</svg>')

open("hero.svg", "w").write("".join(O))
print("wrote", len("".join(O)), "bytes")
