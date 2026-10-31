import { LOADER_MIN_MS } from '../config';

/**
 * The loader waits for the real work (fonts + textures) with a floor so it
 * never flashes. Progress is honest: it advances per completed step.
 */
export function createLoader(minMs = LOADER_MIN_MS) {
  const root = document.querySelector<HTMLElement>('[data-loader]');
  const count = document.querySelector<HTMLElement>('[data-loader-count]');
  const bar = document.querySelector<HTMLElement>('.loader__bar i');
  const started = performance.now();

  const setProgress = (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    if (count) count.textContent = String(Math.round(clamped * 100)).padStart(2, '0');
    if (bar) bar.style.width = `${clamped * 100}%`;
  };

  setProgress(0.06);

  return {
    setProgress,
    async finish(onDone?: () => void) {
      const elapsed = performance.now() - started;
      if (elapsed < minMs) {
        await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
      }
      setProgress(1);
      onDone?.();
      root?.classList.add('is-done');
      // The overlay is hidden, not removed: tearing down a full-viewport fixed
      // element is what a layout-shift budget calls a shift, and nothing gains
      // from deleting it 300 ms later.
      await new Promise((resolve) => setTimeout(resolve, 900));
      root?.setAttribute('hidden', '');
    },
  };
}
