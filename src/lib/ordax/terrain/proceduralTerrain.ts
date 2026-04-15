/**
 * Cria malha de terreno procedural (PlaneGeometry) com relevo FBM
 * e blend shader por inclinação/altura (bioma-agnóstico).
 *
 * Uso: import { createProceduralTerrain } from "@/lib/ordax/terrain";
 */

import * as THREE from "three";
import { heightAt } from "./noise";
import type { TerrainConfig } from "./types";

export function createProceduralTerrain(config: TerrainConfig): THREE.Mesh {
  const { seed, size, maxHeight, segments, textures, blend } = config;

  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightAt(x, z, seed, maxHeight);
    pos.setY(i, y);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    roughness: 1,
    metalness: 0,
  });

  // Load textures
  const loader = new THREE.TextureLoader();
  const texBase = loader.load(textures.base);
  const texMid = loader.load(textures.mid);
  const texHigh = loader.load(textures.high);
  for (const t of [texBase, texMid, texHigh]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    t.needsUpdate = true;
  }

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.tBase = { value: texBase };
    shader.uniforms.tMid = { value: texMid };
    shader.uniforms.tHigh = { value: texHigh };
    shader.uniforms.uTexScale = { value: blend.texScale };
    shader.uniforms.uSeaLevel = { value: blend.seaLevel };
    shader.uniforms.uRockHeight = { value: blend.rockHeight };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vN;`,
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>\nvec4 wp = modelMatrix * vec4(transformed, 1.0);\nvWorldPos = wp.xyz;\nvN = normalize(mat3(modelMatrix) * normal);`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\nuniform sampler2D tBase;\nuniform sampler2D tMid;\nuniform sampler2D tHigh;\nuniform float uTexScale;\nuniform float uSeaLevel;\nuniform float uRockHeight;\nvarying vec3 vWorldPos;\nvarying vec3 vN;`,
      )
      .replace(
        "#include <map_fragment>",
        `
        vec2 uvw = vWorldPos.xz * uTexScale;
        vec3 baseC = texture2D(tBase, uvw).rgb;
        vec3 midC  = texture2D(tMid,  uvw).rgb;
        vec3 highC = texture2D(tHigh, uvw).rgb;

        float height = vWorldPos.y;
        float slope = 1.0 - clamp(vN.y, 0.0, 1.0);

        float midW = smoothstep(uSeaLevel + 1.0, uSeaLevel - 0.2, height);
        float highBySlope = smoothstep(0.35, 0.75, slope);
        float highByHeight = smoothstep(uRockHeight, uRockHeight + 4.0, height);
        float highW = clamp(max(highBySlope, highByHeight), 0.0, 1.0);
        float baseW = 1.0 - clamp(midW + highW, 0.0, 1.0);

        float sumW = baseW + midW + highW + 1e-5;
        baseW /= sumW; midW /= sumW; highW /= sumW;

        vec3 blended = baseC * baseW + midC * midW + highC * highW;
        diffuseColor = vec4(blended, diffuseColor.a);
        `,
      );
  };

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;

  // Store dispose method
  (mesh as unknown as Record<string, () => void>).disposeTextures = () => {
    texBase.dispose();
    texMid.dispose();
    texHigh.dispose();
  };

  return mesh;
}
