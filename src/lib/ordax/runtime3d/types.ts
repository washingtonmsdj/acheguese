import * as THREE from "three";

export type OrdaxThreeContext = {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
};

export interface OrdaxThreeGame {
  init(ctx: OrdaxThreeContext): void | Promise<void>;
  update(dtSeconds: number, tSeconds: number): void;
  dispose(): void;
}
