import sys

LIGHTBOX_CSS = """
  /* -- FRAMEWORK LIGHTBOX -- */
  .slide-card { cursor: pointer; }
  .lightbox-overlay {
    position: fixed; inset: 0; z-index: 999;
    background: rgba(13,31,60,0.92);
    display: none; align-items: center; justify-content: center;
    padding: 3vw;
  }
  .lightbox-overlay.active { display: flex; }
  .lightbox-overlay img {
    max-width: 100%; max-height: 100%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }
  .lightbox-close {
    position: absolute; top: 1.5rem; right: 2rem;
    color: var(--cream); font-size: 2rem; font-weight: 300;
    background: none; border: none; cursor: pointer;
    line-height: 1; padding: 0.5rem;
  }
  .lightbox-close:hover { color: var(--gold); }
  .lightbox-nav {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: var(--cream);
    font-size: 2.5rem; cursor: pointer; padding: 1rem;
    transition: color 0.2s;
  }
  .lightbox-nav:hover { color: var(--gold); }
  .lightbox-prev { left: 0.5rem; }
  .lightbox-next { right: 0.5rem; }
  .lightbox-counter {
    position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
    color: rgba(245,240,232,0.6); font-size: 0.8rem; letter-spacing: 0.08em;
  }
"""

LIGHTBOX_JS = """
  // Framework in Detail -- lightbox
  (function() {
    const cards = Array.from(document.querySelectorAll('.slide-card'));
    if (!cards.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <button class="lightbox-nav lightbox-prev" aria-label="Previous">&#8249;</button>
      <img src="" alt="">
      <button class="lightbox-nav lightbox-next" aria-label="Next">&#8250;</button>
      <div class="lightbox-counter"></div>
    `;
    document.body.appendChild(overlay);

    const img = overlay.querySelector('img');
    const counter = overlay.querySelector('.lightbox-counter');
    let current = 0;

    function show(i) {
      current = (i + cards.length) % cards.length;
      const src = cards[current].querySelector('img').src;
      const alt = cards[current].querySelector('img').alt;
      img.src = src;
      img.alt = alt;
      counter.textContent = (current + 1) + ' / ' + cards.length;
    }

    function open(i) {
      show(i);
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    cards.forEach((card, i) => {
      card.addEventListener('click', () => open(i));
    });

    overlay.querySelector('.lightbox-close').addEventListener('click', close);
    overlay.querySelector('.lightbox-prev').addEventListener('click', () => show(current - 1));
    overlay.querySelector('.lightbox-next').addEventListener('click', () => show(current + 1));

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  })();
"""

CSS_ANCHOR = """.slide-card-label {
    padding: 0.75rem 1rem;
    font-size: 0.78rem; font-weight: 500;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--navy);
    border-top: 1px solid rgba(0,0,0,0.05);
  }"""

JS_ANCHOR = "// Scroll reveal"


def patch(fname):
    with open(fname, "r", encoding="utf-8") as f:
        content = f.read()

    if "lightbox-overlay" in content:
        print(f"SKIP (already patched): {fname}")
        return

    if CSS_ANCHOR not in content:
        print(f"FAIL (CSS anchor not found): {fname}")
        return
    if JS_ANCHOR not in content:
        print(f"FAIL (JS anchor not found): {fname}")
        return

    content = content.replace(CSS_ANCHOR, CSS_ANCHOR + "\n" + LIGHTBOX_CSS, 1)
    content = content.replace(JS_ANCHOR, LIGHTBOX_JS + "\n  " + JS_ANCHOR, 1)

    with open(fname, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"PATCHED: {fname}")


if __name__ == "__main__":
    for fname in sys.argv[1:]:
        patch(fname)
