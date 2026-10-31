uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uTime;
uniform float uGrain;
uniform float uVignette;
uniform float uAberration;

varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = vUv;
  vec2 centered = uv - 0.5;
  float r2 = dot(centered, centered);

  /*
   * Chromatic aberration is off by default: on a dark frame it reads as blurry
   * colour smears along every edge, not as a lens. The uniform stays so it can be
   * dialled in for a still, but the scene ships with it at zero.
   */
  vec2 shift = centered * uAberration * (0.35 + r2);
  vec3 col;
  if (uAberration > 0.0001) {
    col.r = texture2D(tDiffuse, uv + shift).r;
    col.g = texture2D(tDiffuse, uv).g;
    col.b = texture2D(tDiffuse, uv - shift).b;
  } else {
    col = texture2D(tDiffuse, uv).rgb;
  }

  // Vignette.
  float vig = 1.0 - smoothstep(0.22, 1.02, r2 * 1.65);
  col *= mix(1.0, vig, uVignette);

  // Film grain, weighted toward the shadows.
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float g = hash(uv * uResolution + fract(uTime * 0.37) * 131.7) - 0.5;
  col += g * uGrain * (0.35 + 0.65 * (1.0 - lum));

  gl_FragColor = vec4(col, 1.0);
}
