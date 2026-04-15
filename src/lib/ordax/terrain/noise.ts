/**
 * Value Noise (determinístico) + FBM para heightmap procedural.
 */

import { TERRAIN_NOISE } from "../config";

export function hash2i(x: number, z: number, seed: number) {
  let h = x * 374761393 + z * 668265263 + seed * 1442695040888963407;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return (h >>> 0) / TERRAIN_NOISE.NORMALIZATION_DIVISOR;
}

export function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function valueNoise2D(x: number, z: number, seed: number) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;

  const a = hash2i(xi, zi, seed);
  const b = hash2i(xi + 1, zi, seed);
  const c = hash2i(xi, zi + 1, seed);
  const d = hash2i(xi + 1, zi + 1, seed);

  const u = smoothstep(xf);
  const v = smoothstep(zf);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

export function fbm(x: number, z: number, seed: number, octaves = 4) {
  let amp = 1;
  let freq = 0.06;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2D(x * freq, z * freq, seed + i * 101) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

export function heightAt(x: number, z: number, seed: number, maxH: number) {
  const n = fbm(x, z, seed, 4);
  const micro = valueNoise2D(x * 0.22, z * 0.22, seed + 999) * 0.35;
  const h = 2 + (n * 0.9 + micro) * (maxH - 4);
  return Math.max(1, Math.min(maxH, h));
}
