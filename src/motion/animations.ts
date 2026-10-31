import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Wraps every word in a `<span class="word">` without destroying inline
 * elements (`<em>`, `<br>`), so display type can animate per word.
 */
export function splitWords(root: HTMLElement): HTMLElement[] {
  const words: HTMLElement[] = [];

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? '';
        if (!text.trim()) continue;
        const fragment = document.createDocumentFragment();
        for (const part of text.split(/(\s+)/)) {
          if (!part) continue;
          if (!part.trim()) {
            fragment.append(part);
            continue;
          }
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = part;
          fragment.append(span);
          words.push(span);
        }
        child.replaceWith(fragment);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }
  };

  walk(root);
  return words;
}

/** Words rise into place; a mask on `.line` is what sells it as type, not a fade. */
export function revealHeadings(reducedMotion: boolean) {
  document.querySelectorAll<HTMLElement>('[data-split-lines]').forEach((heading) => {
    const words = splitWords(heading);
    if (!words.length) return;

    if (reducedMotion) {
      gsap.set(words, { yPercent: 0, opacity: 1 });
      return;
    }

    gsap.set(words, { yPercent: 118, opacity: 0 });
    gsap.to(words, {
      yPercent: 0,
      opacity: 1,
      duration: 0.85,
      ease: 'power3.out',
      stagger: 0.035,
      scrollTrigger: { trigger: heading, start: 'top 82%', once: true },
    });
  });
}

/**
 * Re-splits headings after a locale change. The splitter wraps words in spans, so
 * replacing a heading's innerHTML (which translation does) throws that work away;
 * this rebuilds it and pins the result to the final state instead of replaying the
 * entrance, because the visitor is already looking at the page.
 */
export function resplitHeadings() {
  document.querySelectorAll<HTMLElement>('[data-split-lines], .hero__title').forEach((heading) => {
    const words = splitWords(heading);
    if (!words.length) return;
    gsap.set(words, { yPercent: 0, opacity: 1, clearProps: 'transform' });
  });
}

export function revealBlocks(reducedMotion: boolean) {
  const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  if (reducedMotion) return;

  gsap.set(targets, { y: 22, opacity: 0 });
  ScrollTrigger.batch(targets, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.075,
        overwrite: true,
      }),
  });
}

/** Hero entrance: masked lines, then the supporting copy. */
export function heroIntro(reducedMotion: boolean) {
  const words = gsap.utils.toArray<HTMLElement>('.hero__title .word');
  if (reducedMotion) return;

  gsap.set(words, { yPercent: 115 });
  gsap.set('.hero__title .line', { overflow: 'hidden' });

  const timeline = gsap.timeline({ delay: 0.1 });
  timeline
    .to(words, {
      yPercent: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.055,
    })
    .from(
      ['.eyebrow', '.hero__lede', '.hero__actions'],
      { y: 16, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 },
      '-=0.65',
    )
    .from(
      ['.hero__foot', '.hero__aside'],
      { opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.05 },
      '-=0.5',
    );

  return timeline;
}

/** Magnetic buttons: capped displacement, spring back on leave. */
export function magneticElements(reducedMotion: boolean) {
  if (reducedMotion) return;

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = 0.28;
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * strength;
      const y = (event.clientY - rect.top - rect.height / 2) * strength;
      gsap.to(el, { x, y, duration: 0.5, ease: 'power3.out' });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
  });
}

/** The strip loops on its own clock rather than on scroll velocity. */
export function ticker(reducedMotion: boolean) {
  const track = document.querySelector<HTMLElement>('[data-ticker]');
  if (!track || reducedMotion) return;

  const half = track.scrollWidth / 2;
  gsap.set(track, { x: 0 });
  gsap.to(track, {
    x: -half,
    duration: 32,
    ease: 'none',
    repeat: -1,
    modifiers: { x: (value: number) => `${(value % half).toFixed(2)}px` },
  });
}

/**
 * Hero exit: the copy lifts and fades as the section leaves. The canvas itself
 * is static — this is page motion, not scene motion.
 */
export function heroScroll(reducedMotion: boolean) {
  if (reducedMotion) return;

  gsap.to('.hero__content', {
    yPercent: -12,
    opacity: 0.15,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

/** Work list: accordion with measured height, keyboard-friendly. */
export function workAccordion(reducedMotion: boolean) {
  document.querySelectorAll<HTMLElement>('.work-item').forEach((item) => {
    const button = item.querySelector<HTMLButtonElement>('.work-item__head');
    const panel = item.querySelector<HTMLElement>('.work-item__panel');
    if (!button || !panel) return;

    gsap.set(panel, { height: 0, opacity: 0 });

    const toggle = () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      const next = !open;
      button.setAttribute('aria-expanded', String(next));
      item.classList.toggle('is-open', next);

      if (reducedMotion) {
        panel.style.height = next ? 'auto' : '0px';
        panel.style.opacity = next ? '1' : '0';
        return;
      }

      if (next) {
        gsap.to(panel, {
          height: 'auto',
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          onComplete: () => ScrollTrigger.refresh(),
        });
      } else {
        gsap.to(panel, {
          height: 0,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.inOut',
          onComplete: () => ScrollTrigger.refresh(),
        });
      }
    };

    button.addEventListener('click', toggle);
  });
}

export function navStates() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;

  let lastY = window.scrollY;
  /** Set by programmatic navigation so the bar stays put during the jump. */
  let pinned = 0;

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 24);
    // `pinned` covers the frames a programmatic scroll spends in flight: those
    // still fire scroll events, and they would otherwise re-hide the bar that the
    // navigation just revealed.
    const hidden = performance.now() > pinned && y > 240 && y > lastY;
    nav.classList.toggle('is-hidden', hidden);
    lastY = y;
  };

  /** Keeps the bar visible for `ms`, then lets scroll direction take over again. */
  const revealFor = (ms: number) => {
    pinned = performance.now() + ms;
    nav.classList.remove('is-hidden');
  };
  (nav as HTMLElement & { revealFor?: (ms: number) => void }).revealFor = revealFor;

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
