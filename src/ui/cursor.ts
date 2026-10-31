import { gsap } from 'gsap';

/**
 * Cursor with a trailing ring. Suppressed on coarse pointers and for
 * reduced-motion users; every interactive element gets the same treatment so
 * the affordance stays learnable.
 */
export function createCursor(reducedMotion: boolean) {
  const root = document.querySelector<HTMLElement>('.cursor');
  const label = document.querySelector<HTMLElement>('.cursor__label');
  if (!root || reducedMotion) return;
  // Touch devices fire synthetic pointer moves; never paint a cursor there.
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return;

  const ring = root.querySelector<HTMLElement>('.cursor__ring');
  const dot = root.querySelector<HTMLElement>('.cursor__dot');
  if (!ring || !dot) return;

  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const target = { ...pos };
  let visible = false;

  gsap.set(root, { x: pos.x, y: pos.y });
  gsap.set(ring, { xPercent: -50, yPercent: -50 });
  gsap.set(dot, { xPercent: -50, yPercent: -50 });

  let raf = 0;
  const loop = () => {
    pos.x += (target.x - pos.x) * 0.16;
    pos.y += (target.y - pos.y) * 0.16;
    gsap.set(root, { x: pos.x, y: pos.y });
    gsap.set(ring, { x: target.x - pos.x, y: target.y - pos.y });
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  window.addEventListener(
    'pointermove',
    (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (!visible) {
        visible = true;
        gsap.to(root, { opacity: 1, duration: 0.3 });
      }
    },
    { passive: true },
  );

  document.addEventListener('pointerleave', () => {
    visible = false;
    gsap.to(root, { opacity: 0, duration: 0.3 });
  });

  const setState = (element: Element | null) => {
    const interactive = element?.closest<HTMLElement>('a, button, [data-cursor]');
    root.classList.toggle('is-active', Boolean(interactive));

    const text = interactive?.dataset.cursor;
    root.classList.toggle('is-label', Boolean(text));
    if (label) label.textContent = text ?? '';
  };

  window.addEventListener(
    'pointerover',
    (event) => setState(event.target as Element | null),
    { passive: true },
  );

  window.addEventListener(
    'pointerout',
    () => setState(null),
    { passive: true },
  );

  document.documentElement.addEventListener('mouseleave', () => {
    visible = false;
    gsap.to(root, { opacity: 0, duration: 0.3 });
  });

  // Stop the loop when the tab is hidden: rAF is throttled anyway, but this
  // keeps the intent explicit and releases the frame budget immediately.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(loop);
    }
  });
}
