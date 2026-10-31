import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/jetbrains-mono';

import { createScroll, bindAnchors } from './motion/scroll';
import { createSnap } from './motion/snap';
import {
  heroIntro,
  heroScroll,
  magneticElements,
  navStates,
  revealBlocks,
  revealHeadings,
  resplitHeadings,
  ticker,
  workAccordion,
} from './motion/animations';
import type { HeroStage } from './gl/stage';
import { createCursor } from './ui/cursor';
import { createLoader } from './ui/loader';
import { createMenu } from './ui/menu';
import { hydrateProfile } from './ui/profile';
import { startClock } from './ui/clock';
import { createThemeToggle, type Theme } from './ui/theme';
import { createLocaleSwitcher } from './i18n';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

hydrateProfile(document);
startClock();

/*
 * Locale and theme are resolved before any animation runs: translation replaces
 * heading markup, so it has to happen before the splitter touches those nodes.
 */
let theme: Theme = 'dark';
createLocaleSwitcher(() => {
  // Copy changed under the split headings; rebuild them at their final state.
  resplitHeadings();
});

theme = createThemeToggle((next) => {
  stage?.setTheme(next);
});

const loader = createLoader();
const scroll = createScroll();

bindAnchors(scroll);
createSnap(scroll, reducedMotion);
createMenu(scroll);
createCursor(reducedMotion);
magneticElements(reducedMotion);
revealHeadings(reducedMotion);
revealBlocks(reducedMotion);
heroScroll(reducedMotion);
workAccordion(reducedMotion);
navStates();

const canvas = document.getElementById('stage') as HTMLCanvasElement | null;
const stageHost = document.querySelector<HTMLElement>('.hero__stage');

let stage: HeroStage | null = null;

async function bootStage() {
  if (!canvas || !stageHost) return;

  const webgl2 = (() => {
    try {
      return Boolean(canvas.getContext('webgl2'));
    } catch {
      return false;
    }
  })();

  if (!webgl2) {
    document.documentElement.classList.remove('is-webgl');
    loader.setProgress(1);
    return;
  }

  // Three.js plus the GLB loader are heavy and only the hero needs them, so
  // they load after the page is interactive instead of blocking first paint.
  const { createHeroStage } = await import('./gl/stage');
  stage = await createHeroStage({
    canvas,
    container: stageHost,
    reducedMotion,
    onProgress: (step, total) => loader.setProgress(0.25 + (step / total) * 0.6),
  });

  if (!stage) {
    document.documentElement.classList.remove('is-webgl');
    return;
  }

  stage.setTheme(theme);

  // Cross-fade to the canvas once its first frame has landed: no black gap and
  // no flash of an unpainted surface.
  await stage.play();
  document.documentElement.classList.add('is-webgl');
}

function startForegroundMotion() {
  heroIntro(reducedMotion);
  ticker(reducedMotion);
}

(async () => {
  await document.fonts.ready;

  // A failed chunk (offline, cache bust, blocked by an extension) must not
  // leave the visitor staring at the loader: the static photo is the fallback.
  try {
    await bootStage();
  } catch (error) {
    console.warn('Hero stage unavailable, falling back to the still:', error);
    document.documentElement.classList.remove('is-webgl');
  }

  loader.setProgress(0.92);
  await loader.finish(() => {
    document.documentElement.classList.add('is-ready');
  });

  startForegroundMotion();

  window.addEventListener(
    'pagehide',
    () => {
      stage?.dispose();
    },
    { once: true },
  );
})();
