import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export type Scroll = {
  lenis: Lenis | null;
  stop: () => void;
  start: () => void;
  to: (target: string | number, offset?: number) => void;
  destroy: () => void;
};

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarse = () => window.matchMedia('(pointer: coarse)').matches;

/**
 * Smooth scroll on fine pointers only. On touch, native scrolling keeps
 * momentum and browser chrome behavior; hijacking it costs more than it gives.
 */
export function createScroll(): Scroll {
  if (prefersReduced() || isCoarse()) {
    const jump = (target: string | number, offset = 0) => {
      if (typeof target === 'number') {
        window.scrollTo({ top: target + offset, behavior: 'auto' });
        return;
      }
      const el = document.querySelector<HTMLElement>(target);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: 'auto' });
    };
    return {
      lenis: null,
      stop() {},
      start() {},
      to: jump,
      destroy() {},
    };
  }

  const lenis = new Lenis({
    duration: 1.05,
    lerp: 0.1,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
    syncTouch: false,
    smoothWheel: true,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  });

  lenis.on('scroll', ScrollTrigger.update);

  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  return {
    lenis,
    stop: () => lenis.stop(),
    start: () => lenis.start(),
    to: (target: string | number, offset = 0) =>
      lenis.scrollTo(target, { offset, duration: 1.25 }),
    destroy: () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    },
  };
}

/** Anchor links route through Lenis so easing stays consistent. */
export function bindAnchors(scroll: Scroll) {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (event) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector<HTMLElement>(id);
      if (!target) return;
      event.preventDefault();
      history.replaceState(null, '', id);
      target.setAttribute('tabindex', '-1');

      /*
       * Deferred by one frame on purpose. In the mobile menu the same click also
       * closes the overlay, which sets `overflow: hidden` on <body> until its own
       * listener runs; scrolling now would be swallowed by that lock. Waiting a
       * frame lets the lock clear first, and costs nothing on desktop.
       */
      const nav = document.querySelector<HTMLElement & { revealFor?: (ms: number) => void }>(
        '[data-nav]',
      );
      // Pinned before the jump, not inside the frame callback: the scroll events
      // that would hide the bar fire during `scroll.to`, so the guard has to exist
      // first. The hold covers the animation plus a beat to read the section.
      nav?.revealFor?.(2600);

      requestAnimationFrame(() => {
        scroll.to(id, 0);
      });
    });
  });
}
