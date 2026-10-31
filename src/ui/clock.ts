import { profile } from '../config';

/** Local time in the user's own timezone, stated honestly instead of guessed. */
export function startClock() {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-clock]'));
  if (!nodes.length) return;

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: profile.timeZone,
    hour12: false,
  });

  const render = () => {
    const now = formatter.format(new Date());
    for (const node of nodes) node.textContent = now;
  };

  render();
  window.setInterval(render, 15_000);
}
