import * as THREE from "three";

/**
 * Cria uma caixa sem face superior (open-top), útil para volumes de água.
 * Evita dupla superfície quando já existe um mesh dedicado para a água.
 */
export function createOpenTopBoxGeometry(
  width: number,
  height: number,
  depth: number,
): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(width, height, depth, 1, 1, 1);
  const index = geometry.getIndex();

  if (!index) {
    geometry.computeVertexNormals();
    return geometry;
  }

  const retained: number[] = [];
  for (const group of geometry.groups) {
    // BoxGeometry materialIndex:
    // 0:+X, 1:-X, 2:+Y(top), 3:-Y(bottom), 4:+Z, 5:-Z
    if (group.materialIndex === 2) continue;
    const groupStart = group.start;
    const groupEnd = group.start + group.count;
    for (let i = groupStart; i < groupEnd; i++) {
      retained.push(index.array[i] as number);
    }
  }

  geometry.setIndex(retained);
  geometry.clearGroups();
  geometry.addGroup(0, retained.length, 0);
  geometry.computeVertexNormals();
  return geometry;
}
