import type { Scroll } from './scroll';

/**
 * Strong scroll snaps to the next chapter; gentle scroll stays native.
 *
 * The distinction is a gesture, not a position: a wheel notch or a trackpad flick
 * delivers a large delta inside a short window, while a slow drag delivers many
 * small ones. Accumulating deltas over a fixed window measures exactly that, and
 * it keeps the interaction predictable — nobody has to learn a new control.
 */
const GESTURE_WINDOW_MS = 130;
/** Total delta inside the window that counts as "strong" (one wheel notch is ~100). */
const STRONG_GESTURE_PX = 170;
/** Ignored once the user is this close to a boundary, so a snap cannot re-trigger. */
const ALREADY_THERE_PX = 8;
const SNAP_DURATION_S = 1.05;

export function createSnap(scroll: Scroll, reducedMotion: boolean) {
  const { lenis } = scroll;
  // Snapping is an animation; without Lenis (touch, reduced motion) the native
  // scroll already has momentum and boundaries it respects.
  if (!lenis || reducedMotion) return;

  const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section'));
  if (sections.length < 2) return;

  /** Scroll position where each chapter starts, under the fixed nav. */
  const boundaries = () =>
    sections.map((section) => {
      const margin = Number.parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
      return Math.max(0, section.getBoundingClientRect().top + window.scrollY - margin);
    });

  let accumulated = 0;
  let windowStart = 0;
  let snapping = false;
  let cooldown = 0;

  const onWheel = (event: WheelEvent) => {
    const now = performance.now();
    if (snapping || now < cooldown) return;

    if (now - windowStart > GESTURE_WINDOW_MS) {
      accumulated = 0;
      windowStart = now;
    }
    accumulated += event.deltaY;

    if (Math.abs(accumulated) < STRONG_GESTURE_PX) return;

    const direction = Math.sign(accumulated);
    accumulated = 0;

    const stops = boundaries();
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const current = window.scrollY;

    // Nearest boundary strictly ahead of the gesture, plus the document ends.
    const candidates = direction > 0 ? stops.filter((stop) => stop > current + ALREADY_THERE_PX) : stops
      .filter((stop) => stop < current - ALREADY_THERE_PX)
      .reverse();

    let target = candidates[0];
    if (target === undefined) {
      target = direction > 0 ? maxScroll : 0;
    }
    if (Math.abs(target - current) < ALREADY_THERE_PX) return;

    snapping = true;
    lenis.scrollTo(target, {
      duration: SNAP_DURATION_S,
      lock: true,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      onComplete: () => {
        snapping = false;
        // Absorb the tail of a trackpad fling: a second snap would feel like a
        // double jump on a gesture the user already spent.
        cooldown = performance.now() + 320;
      },
    });
  };

  window.addEventListener('wheel', onWheel, { passive: true });

  // A resize changes every boundary; drop any in-flight state.
  const onResize = () => {
    accumulated = 0;
    snapping = false;
  };
  window.addEventListener('resize', onResize);

  return () => {
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('resize', onResize);
  };
}
