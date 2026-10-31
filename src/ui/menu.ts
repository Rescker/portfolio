import type { Scroll } from '../motion/scroll';

/** Off-canvas menu for narrow viewports. Focus is trapped while open. */
export function createMenu(scroll: Scroll) {
  const burger = document.querySelector<HTMLButtonElement>('.nav__burger');
  const menu = document.getElementById('menu');
  if (!burger || !menu) return;

  const links = Array.from(menu.querySelectorAll<HTMLAnchorElement>('a'));
  let open = false;

  const setOpen = (next: boolean) => {
    open = next;
    burger.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-locked', open);
    if (open) {
      scroll.stop();
      links[0]?.focus({ preventScroll: true });
    } else {
      scroll.start();
    }
  };

  burger.addEventListener('click', () => setOpen(!open));

  links.forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (!open) return;

    if (event.key === 'Escape') {
      setOpen(false);
      burger.focus();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusables = [burger, ...links];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860 && open) setOpen(false);
  });
}
