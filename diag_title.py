import sys

ANCHOR = "console.log('LIGHTBOX SCRIPT REACHED - START');"
MARKER = ANCHOR + "\n  document.title = 'SCRIPT RAN - ' + document.title;"


def patch(fname):
    with open(fname, "r", encoding="utf-8") as f:
        content = f.read()

    if "SCRIPT RAN -" in content:
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
