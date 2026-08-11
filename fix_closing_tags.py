import sys

TAIL_MARKER = "reveals.forEach(el => observer.observe(el));"


def fix(fname):
    with open(fname, "r", encoding="utf-8") as f:
        content = f.read()

    stripped_end = content.rstrip()

    if stripped_end.endswith("</html>"):
        print(f"SKIP (already has closing tags): {fname}")
        return

    if TAIL_MARKER not in content:
        print(f"FAIL (expected tail marker not found): {fname}")
        return

    idx = content.rfind(TAIL_MARKER)
    after = content[idx + len(TAIL_MARKER):]

    new_content = content[:idx + len(TAIL_MARKER)] + "\n</script>\n</body>\n</html>\n"

    with open(fname, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"FIXED (added missing closing tags): {fname}")
    print(f"  -- discarded trailing content was: {after[:200]!r}")


if __name__ == "__main__":
    for fname in sys.argv[1:]:
        fix(fname)
