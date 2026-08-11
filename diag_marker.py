import sys

ANCHOR = "// Framework in Detail -- lightbox"
MARKER = "console.log('LIGHTBOX SCRIPT REACHED - START');\n  " + ANCHOR


def patch(fname):
    with open(fname, "r", encoding="utf-8") as f:
        content = f.read()

    if "LIGHTBOX SCRIPT REACHED" in content:
        print(f"SKIP (already patched): {fname}")
        return

    if ANCHOR not in content:
        print(f"FAIL (anchor not found): {fname}")
        return

    content = content.replace(ANCHOR, MARKER, 1)

    with open(fname, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"PATCHED: {fname}")


if __name__ == "__main__":
    for fname in sys.argv[1:]:
        patch(fname)
