import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import finalFrag from './shaders/final.frag.glsl?raw';

const asset = (file: string) => new URL(`./assets/${file}`, document.baseURI).href;

const FOV = 30;
/** World height the character is normalised to; framing math reads in these units. */
const MODEL_HEIGHT = 1;
/** Aspect at which the hero switches from a centred figure to a split layout. */
const SPLIT_ASPECT = 1.5;

const finalVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export type HeroStage = {
  /** Starts the idle loop and resolves once the first frame is on screen. */
  play: () => Promise<void>;
  /** Swaps the scene's backdrop and lighting for the active theme. */
  setTheme: (theme: 'dark' | 'light') => void;
  dispose: () => void;
};

export type StageOptions = {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  reducedMotion: boolean;
  onProgress?: (step: number, total: number) => void;
};

/**
 * The GLB ships as a single static mesh: no skeleton, no clips. The idle is
 * therefore applied to the whole figure — weight shift, breath, a slow turn —
 * which is what reads as a character standing there rather than a statue.
 */
export async function createHeroStage(options: StageOptions): Promise<HeroStage | null> {
  const { canvas, container, reducedMotion, onProgress } = options;

  /*
   * Portrait phones pin the figure behind the copy and never move it: no idle, no
   * turntable, no drag. The pose is frozen at the wave so it reads as a greeting
   * held while the text scrolls past. Recomputed on resize, so rotating the device
   * back to landscape restores the interactive desktop behaviour.
   */
  const portraitQuery = window.matchMedia('(max-width: 860px) and (orientation: portrait)');
  let still = portraitQuery.matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    stencil: false,
    powerPreference: 'high-performance',
  });

  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  onProgress?.(1, 3);

  const gltf = await new GLTFLoader().loadAsync(asset('emu.glb'));
  const root = gltf.scene;

  // Normalise: uniform scale to MODEL_HEIGHT, then recentre on the origin so the
  // framing never depends on how the asset happened to be authored.
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const modelScale = MODEL_HEIGHT / Math.max(size.y, 1e-5);
  root.scale.setScalar(modelScale);

  bounds.setFromObject(root);
  const center = bounds.getCenter(new THREE.Vector3());
  root.position.sub(center);

  /*
   * The GLB ships a single 2048² albedo and GLTFLoader leaves anisotropy at 1,
   * so the texture blurs the moment the surface tilts away from the camera —
   * seams, glasses arms, the folds in the hoodie. Maxing it (capped at 8) is a
   * free detail win; mipmaps stay on for the smaller mobile framing.
   */
  const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']) {
        const texture = (material as THREE.MeshStandardMaterial)[
          key as keyof THREE.MeshStandardMaterial
        ] as THREE.Texture | null | undefined;
        if (!texture) continue;
        texture.anisotropy = maxAnisotropy;
        texture.needsUpdate = true;
      }
      // A stylised 53k mesh shows facets under a hard key; a little more
      // environment fill keeps the form readable without flattening it.
      material.envMapIntensity = 1.15;
      material.needsUpdate = true;
    }
  });

  onProgress?.(2, 3);

  const scene = new THREE.Scene();
  /** Matches `--ink` in both themes so the canvas never shows a seam with the page. */
  const BACKDROP = { dark: 0x08090c, light: 0xf4efe6 } as const;
  scene.background = new THREE.Color(BACKDROP.dark);
  scene.add(root);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.42;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 40);

  // One cool key from the front-left, one accent rim from behind, and a dim
  // hemisphere so the shadow side never goes fully black.
  const key = new THREE.DirectionalLight(0xd8e4ff, 1.55);
  key.position.set(2.4, 3.2, 2.6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x93acff, 1.35);
  rim.position.set(-2.6, 1.8, -2.8);
  scene.add(rim);

  scene.add(new THREE.HemisphereLight(0x2a3a58, 0x05060a, 0.42));

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.1, 0.5, 0.95));
  composer.addPass(new OutputPass());

  const film = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uGrain: { value: 0.022 },
      uVignette: { value: 0.62 },
      uAberration: { value: 0 },
    },
    vertexShader: finalVert,
    fragmentShader: finalFrag,
  });
  composer.addPass(film);

  let frame = 0;
  let running = false;
  let visible = true;
  let baseY = 0;
  let baseX = 0;
  const startedAt = performance.now();
  /** Accumulated turntable angle; frozen while the user is inspecting. */
  let spinPhase = 0;
  let lastFrameAt = startedAt;
  let lastInteractionAt = 0;

  function draw() {
    composer.render();
  }

  /*
   * Drag to turn. The rotation the user sets is an offset added on top of the
   * idle, so the figure keeps breathing while you inspect it instead of freezing
   * like a turntable. Pitch is clamped: the mesh has no underside detail, and
   * past ~20° the neck seam becomes visible.
   */
  const drag = {
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startYaw: 0,
    startPitch: 0,
    yaw: 0,
    pitch: 0,
  };
  const DRAG_YAW_PER_PX = 0.011;
  const DRAG_PITCH_PER_PX = 0.004;
  /** Pitch stays limited: the mesh has no underside detail worth showing. */
  const PITCH_LIMIT = 0.32;
  /** Yaw is not limited — the model is complete enough to show the back. */
  const YAW_LIMIT = Math.PI;
  /** Radians per second for the idle turntable (~64 s per revolution). */
  const SPIN_SPEED = 0.098;
  /**
   * Resting orientation, turned toward the copy on the left. Negative yaw rotates
   * the front (+Z) toward −X, which is screen-left. Chosen so the very first frame
   * already reads as a three-quarter view instead of a passport photo.
   */
  const BASE_YAW = -0.95;
  /** The turntable waits this long after a drag, so the angle the user set sticks. */
  const SPIN_RESUME_MS = 6000;

  const onPointerDown = (event: PointerEvent) => {
    if (still) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    lastInteractionAt = performance.now();
    drag.active = true;
    drag.pointerId = event.pointerId;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.startYaw = drag.yaw;
    drag.startPitch = drag.pitch;
    canvas.setPointerCapture(event.pointerId);
    container.classList.add('is-dragging');
    // Under reduced motion there is no loop running, so start one for the drag.
    if (!frame) frame = requestAnimationFrame(idle);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag.active || event.pointerId !== drag.pointerId) return;
    lastInteractionAt = performance.now();
    const clamp = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v));
    drag.yaw = clamp(drag.startYaw + (event.clientX - drag.startX) * DRAG_YAW_PER_PX, YAW_LIMIT);
    drag.pitch = clamp(
      drag.startPitch + (event.clientY - drag.startY) * DRAG_PITCH_PER_PX,
      PITCH_LIMIT,
    );
    // Under reduced motion the loop is stopped; draw the new angle immediately.
    if (!frame) {
      applyPose((performance.now() - startedAt) / 1000, performance.now());
      draw();
    }
  };

  const endDrag = (event: PointerEvent) => {
    if (!drag.active || event.pointerId !== drag.pointerId) return;
    drag.active = false;
    container.classList.remove('is-dragging');
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  /** Writes the current pose to the model. `t` is seconds since load. */
  function applyPose(t: number, now: number) {
    /*
     * Frozen pose for portrait phones. `BASE_YAW` keeps the wave toward the lens and
     * the scale is the plain fit scale, so the silhouette matches the still frame
     * the visitor sees on load.
     */
    if (still) {
      root.position.set(baseX, baseY, 0);
      root.rotation.set(0, BASE_YAW, 0);
      root.scale.setScalar(modelScale);
      return;
    }

    if (reducedMotion) {
      root.position.set(baseX, baseY, 0);
      root.rotation.set(drag.pitch, BASE_YAW + drag.yaw, 0);
      root.scale.setScalar(modelScale);
      return;
    }

    // Advance the turntable only when nobody is looking closely: a spin that keeps
    // drifting while the user holds an angle makes the drag feel broken.
    const settled = now - lastInteractionAt > SPIN_RESUME_MS && !drag.active;
    const dt = Math.min((now - lastFrameAt) / 1000, 1 / 20);
    lastFrameAt = now;
    if (settled) spinPhase += dt * SPIN_SPEED;

    const sway = Math.sin(t * 0.42);
    const breath = Math.sin(t * 1.05);
    const turn = Math.sin(t * 0.23);

    root.position.x = baseX + sway * MODEL_HEIGHT * 0.022;
    root.position.y = baseY + Math.abs(breath) * MODEL_HEIGHT * 0.006;

    /*
     * Slow turntable on top of the idle and the drag. The asset faces the camera,
     * so a full turn shows the profile and the back of the hoodie at a pace that
     * reads as "look at the model" rather than "something is moving". Drag adds to
     * it; releasing does not reset, so the user's angle is preserved.
     */
    root.rotation.y = BASE_YAW + drag.yaw + turn * 0.16 + spinPhase;
    root.rotation.x = drag.pitch + Math.sin(t * 0.19) * 0.012;
    root.rotation.z = -sway * 0.028;

    // Breathing lives in scale: shoulders lift, the figure settles.
    const squash = breath * 0.007;
    root.scale.y = modelScale * (1 + squash);
    root.scale.x = modelScale * (1 - squash * 0.6);
    root.scale.z = modelScale * (1 - squash * 0.6);
  }

  const idle = (now: number) => {
    if (!running || !visible || document.hidden) {
      frame = 0;
      return;
    }
    const t = (now - startedAt) / 1000;

    // No motion beyond what the user asks for: draw the rest pose once and stop,
    // unless a drag is in progress. Portrait phones are always in this mode.
    if (reducedMotion || still) {
      applyPose(t, now);
      draw();
      frame = !still && drag.active ? requestAnimationFrame(idle) : 0;
      return;
    }
    frame = requestAnimationFrame(idle);

    applyPose(t, now);
    draw();
  };

  const fit = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, true);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);

    const buffer = film.uniforms.uResolution!.value as THREE.Vector2;
    buffer.set(width * pixelRatio, height * pixelRatio);

    const aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV) / 2);

    /*
     * Height of the visible frame at distance d is 2·d·tan(fov/2). Pick d so the
     * character fills `occupancy` of it, then anchor the feet at `feetAt` of the
     * frame, measured from the bottom.
     *
     * Portrait is the constrained case: the copy owns the left ~55% and the nav
     * owns the top ~8%, so the figure has to live in the upper-right sliver and
     * stay whole. `feetAt + occupancy` is where the head lands; 0.62 + 0.34 keeps
     * it under the nav without shrinking the emu into an icon.
     */
    const wide = aspect >= SPLIT_ASPECT;
    const landscape = aspect >= 1;

    /*
     * Portrait: the emu is a backdrop beside the copy, so it is sized to sit level
     * with the text block rather than fill the frame. `feetAt` is where the shoes
     * land; 0.34 + 0.4 puts the whole figure in the vertical band the copy occupies
     * (roughly 25%–75% of the viewport), and `centreX` keeps it off the left column.
     */
    const occupancy = wide ? 0.78 : landscape ? 0.62 : 0.4;
    const feetAt = wide ? 0.13 : landscape ? 0.07 : 0.34;
    const centreX = wide ? 0.175 : landscape ? 0 : 0.5;

    const distance = MODEL_HEIGHT / occupancy / (2 * tanHalf);
    const visibleHeight = 2 * tanHalf * distance;
    const visibleWidth = visibleHeight * aspect;

    // The mesh is centred on the origin, so its feet are half a body below it.
    baseY = -visibleHeight / 2 + visibleHeight * feetAt + MODEL_HEIGHT / 2;
    baseX = visibleWidth * centreX;
    root.position.set(baseX, baseY, 0);

    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    void draw();
  };

  const onPortraitChange = () => {
    still = portraitQuery.matches;
    fit();
    if (!frame) {
      applyPose((performance.now() - startedAt) / 1000, performance.now());
      draw();
    }
  };
  portraitQuery.addEventListener('change', onPortraitChange);

  const resizeObserver = new ResizeObserver(fit);
  resizeObserver.observe(container);
  fit();

  // The scene only animates while it is on screen and the tab is visible.
  const visibility = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible && running && !frame) frame = requestAnimationFrame(idle);
    },
    { threshold: 0 },
  );
  visibility.observe(container);

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (running && visible && !frame) {
      frame = requestAnimationFrame(idle);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  onProgress?.(3, 3);

  return {
    setTheme(theme) {
      /*
       * On paper the environment has to carry more of the lighting: a single hard
       * key that reads as cinematic against near-black looks like a hard shadow on
       * cream. Raising the fill and dropping the key keeps the figure modelled.
       */
      const light = theme === 'light';
      scene.background = new THREE.Color(light ? BACKDROP.light : BACKDROP.dark);
      scene.environmentIntensity = light ? 0.62 : 0.42;
      key.intensity = light ? 1.15 : 1.55;
      rim.intensity = light ? 0.7 : 1.35;
      renderer.toneMappingExposure = light ? 1 : 0.92;
      if (!frame) draw();
    },
    async play() {
      if (!running) {
        running = true;
        if (visible) frame = requestAnimationFrame(idle);
      }
      for (let i = 0; i < 2; i++) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
      renderer.getContext().finish();
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endDrag);
      canvas.removeEventListener('pointercancel', endDrag);
      portraitQuery.removeEventListener('change', onPortraitChange);
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((m) => m.dispose());
          else material.dispose();
        }
      });
      envRT.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}
