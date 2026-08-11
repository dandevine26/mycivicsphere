import sys

CSS_ANCHOR = """.slide-card img { width: 100%; display: block; aspect-ratio: 16/9; object-fit: cover; }"""

COLORS = [
    "2E6FBB", "1C7293", "3A6B4C", "6B8E4E", "C9A227", "C1652F",
    "A34B3C", "7A3548", "6B4577", "4A4E8C", "4E6379", "8C7A3A",
]

ACCENT_CSS_LINES = ["\n  /* -- FRAMEWORK TILE ACCENT COLORS -- */"]
ACCENT_CSS_LINES.append(
    "  .slide-card:nth-child(1) .slide-card-label, "
    ".slide-card:nth-child(14) .slide-card-label { border-top: 3px solid var(--gold); }"
)
for i, color in enumerate(COLORS):
    nth = i + 2
    ACCENT_CSS_LINES.append(
        f"  .slide-card:nth-child({nth}) .slide-card-label {{ border-top: 3px solid #{color}; }}"
    )
ACCENT_CSS = "\n".join(ACCENT_CSS_LINES) + "\n"


def patch(fname):
    with open(fname, "r", encoding="utf-8") as f:
        content = f.read()

    if "FRAMEWORK TILE ACCENT COLORS" in content:
        print(f"SKIP (already patched): {fname}")
        return

    if CSS_ANCHOR not in content:
        print(f"FAIL (anchor not found): {fname}")
        return

    content = content.replace(CSS_ANCHOR, CSS_ANCHOR + "\n" + ACCENT_CSS, 1)

    with open(fname, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"PATCHED: {fname}")


if __name__ == "__main__":
    for fname in sys.argv[1:]:
        patch(fname)
