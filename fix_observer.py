import sys

BROKEN = """  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
          entry.target.classList.remove('hidden');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }"""

FIXED = """  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
          entry.target.classList.remove('hidden');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  });
  reveals.forEach(el => observer.observe(el));"""


def fix(fname):
    with open(fname, "r", encoding="utf-8") as f:
        content = f.read()

    if "reveals.forEach(el => observer.observe(el));" in content:
        print(f"SKIP (already fixed): {fname}")
        return

    if BROKEN not in content:
        print(f"FAIL (broken pattern not found -- may already differ): {fname}")
        return

    content = content.replace(BROKEN, FIXED, 1)

    with open(fname, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"FIXED: {fname}")


if __name__ == "__main__":
    for fname in sys.argv[1:]:
        fix(fname)
