import type { MutableRefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InputDebugOverlay } from "@/components/ordax/InputDebugOverlay";
import { World, createAI, createPosition, createSize, createTag, createVelocity } from "@/lib/ordax/ecs";
import { useRunnerHotkeys } from "@/hooks/use-runner-hotkeys";

type AnimalKind =
  | "elefante"
  | "girafa"
  | "leao"
  | "zebra"
  | "camelo"
  | "boi"
  | "ovelha"
  | "cabra"
  | "cavalo"
  | "lobo";

type ArkGameState = {
  placed: Set<AnimalKind>;
  following: Set<AnimalKind>;
  hint: string;
};

const VOXEL = 1; // 1 unidade = 1 metro (cubo 1x1x1)

// Aproximação das dimensões bíblicas: 300x50x30 côvados (~135x22.5x13.5m).
// Para manter voxels inteiros e escala legível, arredondamos.
const ARK = {
  length: 140,
  width: 24,
  height: 14,
  decks: 3,
} as const;

const DECK_H = Math.floor(ARK.height / ARK.decks);

const ANIMALS: Array<{ kind: AnimalKind; label: string; size: { w: number; h: number; l: number } }> = [
  { kind: "girafa", label: "Girafa", size: { w: 2, h: 6, l: 3 } },
  { kind: "elefante", label: "Elefante", size: { w: 4, h: 4, l: 6 } },
  { kind: "leao", label: "Leão", size: { w: 2, h: 2, l: 3 } },
  { kind: "zebra", label: "Zebra", size: { w: 2, h: 2, l: 3 } },
  { kind: "camelo", label: "Camelo", size: { w: 2, h: 3, l: 4 } },
  { kind: "boi", label: "Boi", size: { w: 2, h: 2, l: 3 } },
  { kind: "ovelha", label: "Ovelha", size: { w: 1, h: 1, l: 2 } },
  { kind: "cabra", label: "Cabra", size: { w: 1, h: 1, l: 2 } },
  { kind: "cavalo", label: "Cavalo", size: { w: 2, h: 2, l: 3 } },
  { kind: "lobo", label: "Lobo", size: { w: 1, h: 1, l: 2 } },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function aabbContainsPoint(
  p: { x: number; z: number },
  aabb: { minX: number; maxX: number; minZ: number; maxZ: number },
) {
  return p.x >= aabb.minX && p.x <= aabb.maxX && p.z >= aabb.minZ && p.z <= aabb.maxZ;
}

function resolvePointAabbCollision(
  p: { x: number; z: number },
  prev: { x: number; z: number },
  aabb: { minX: number; maxX: number; minZ: number; maxZ: number },
): { x: number; z: number } {
  if (!aabbContainsPoint(p, aabb)) return p;
  // Resolve by pushing out on the smallest penetration axis.
  const penLeft = p.x - aabb.minX;
  const penRight = aabb.maxX - p.x;
  const penTop = p.z - aabb.minZ;
  const penBottom = aabb.maxZ - p.z;
  const minPen = Math.min(penLeft, penRight, penTop, penBottom);

  // Bias to go back towards previous position to reduce jitter.
  if (minPen === penLeft) p.x = aabb.minX - 0.01;
  else if (minPen === penRight) p.x = aabb.maxX + 0.01;
  else if (minPen === penTop) p.z = aabb.minZ - 0.01;
  else p.z = aabb.maxZ + 0.01;

  // If we pushed on an axis that disagrees with prev movement, snap closer to prev.
  // (prevents sticking at corners)
  const backX = prev.x - p.x;
  const backZ = prev.z - p.z;
  if (Math.abs(backX) + Math.abs(backZ) < 0.001) return p;

  return p;
}

function dist2(ax: number, az: number, bx: number, bz: number) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

function buildWorld() {
  const world = new World();

  const player = world.createEntity("player");
  world.addComponent(player, createTag("player"));
  world.addComponent(player, createPosition(0, -18)); // Position.x = X, Position.y = Z
  world.addComponent(player, createVelocity(0, 0));
  world.addComponent(player, createSize(2, 2)); // (w,h) no plano XZ

  for (let i = 0; i < ANIMALS.length; i++) {
    const a = ANIMALS[i];
    const e = world.createEntity(`animal:${a.kind}`);
    world.addComponent(e, createTag(`animal:${a.kind}`));
    world.addComponent(e, createPosition(-30 + i * 6, -6 + (i % 2) * 6));
    world.addComponent(e, createVelocity(0, 0));
    world.addComponent(e, createSize(a.size.w, a.size.l));
    world.addComponent(
      e,
      createAI("idle", 6 + (a.kind === "girafa" ? 7 : 4), 6),
    );
  }

  return world;
}

function ArkScene({
  stateRef,
  inputDebug,
}: {
  stateRef: MutableRefObject<ArkGameState>;
  inputDebug: boolean;
}) {
  const worldRef = useRef<World | null>(null);
  const [, setHudTick] = useState(0);

  // física simples do player (vertical)
  const pyRef = useRef(1); // altura do "pé" do player
  const pvyRef = useRef(0);
  const groundedRef = useRef(true);

  // câmera 3ª pessoa simples (yaw/pitch)
  const camRef = useRef({ yaw: Math.PI * 0.15, pitch: -0.45, dist: 18 });
  const dragRef = useRef<{ dragging: boolean; lx: number; ly: number }>({ dragging: false, lx: 0, ly: 0 });

  const keysRef = useRef({ w: false, a: false, s: false, d: false, e: false, space: false });
  const eLatchRef = useRef(false);
  const spaceLatchRef = useRef(false);

  useEffect(() => {
    worldRef.current = buildWorld();

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "w" || ev.key === "W" || ev.key === "ArrowUp") keysRef.current.w = true;
      if (ev.key === "a" || ev.key === "A" || ev.key === "ArrowLeft") keysRef.current.a = true;
      if (ev.key === "s" || ev.key === "S" || ev.key === "ArrowDown") keysRef.current.s = true;
      if (ev.key === "d" || ev.key === "D" || ev.key === "ArrowRight") keysRef.current.d = true;
      if (ev.key === "e" || ev.key === "E") keysRef.current.e = true;
      if (ev.key === " " || ev.key === "Spacebar") keysRef.current.space = true;
    };
    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.key === "w" || ev.key === "W" || ev.key === "ArrowUp") keysRef.current.w = false;
      if (ev.key === "a" || ev.key === "A" || ev.key === "ArrowLeft") keysRef.current.a = false;
      if (ev.key === "s" || ev.key === "S" || ev.key === "ArrowDown") keysRef.current.s = false;
      if (ev.key === "d" || ev.key === "D" || ev.key === "ArrowRight") keysRef.current.d = false;
      if (ev.key === "e" || ev.key === "E") keysRef.current.e = false;
      if (ev.key === " " || ev.key === "Spacebar") keysRef.current.space = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      worldRef.current?.clear();
      worldRef.current = null;
    };
  }, []);

  // câmera: arrastar SOMENTE dentro do canvas (evita sensação de câmera "possessa")
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const onPointerDown = (ev: PointerEvent) => {
      if (ev.button !== 0) return;
      dragRef.current = { dragging: true, lx: ev.clientX, ly: ev.clientY };
      el.setPointerCapture(ev.pointerId);
    };
    const onPointerUp = (ev: PointerEvent) => {
      dragRef.current.dragging = false;
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {
        // ignore
      }
    };
    const onPointerMove = (ev: PointerEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = ev.clientX - dragRef.current.lx;
      const dy = ev.clientY - dragRef.current.ly;
      dragRef.current.lx = ev.clientX;
      dragRef.current.ly = ev.clientY;
      camRef.current.yaw -= dx * 0.004;
      camRef.current.pitch = clamp(camRef.current.pitch - dy * 0.004, -1.0, -0.2);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointermove", onPointerMove);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointermove", onPointerMove);
    };
  }, [gl]);

  useFrame(({ camera }, dt) => {
    const world = worldRef.current;
    if (!world) return;
    const dts = Math.min(0.05, dt);

    // ----- Player movement (XZ) + colisão -----
    const playerId = world.entityManager.findEntityByName("player") ?? "entity_0";
    const p = world.getComponent<ReturnType<typeof createPosition>>(playerId, "Position");
    const v = world.getComponent<ReturnType<typeof createVelocity>>(playerId, "Velocity");
    if (!p || !v) return;

    const prev = { x: p.x, z: p.y };

    const inputX = (keysRef.current.d ? 1 : 0) - (keysRef.current.a ? 1 : 0);
    const inputZ = (keysRef.current.s ? 1 : 0) - (keysRef.current.w ? 1 : 0);
    const inputLen = Math.hypot(inputX, inputZ) || 1;

    const forwardX = Math.sin(camRef.current.yaw);
    const forwardZ = Math.cos(camRef.current.yaw);
    const rightX = Math.sin(camRef.current.yaw + Math.PI / 2);
    const rightZ = Math.cos(camRef.current.yaw + Math.PI / 2);

    const moveX = (forwardX * (-inputZ) + rightX * inputX) / inputLen;
    const moveZ = (forwardZ * (-inputZ) + rightZ * inputX) / inputLen;

    const speed = inputX !== 0 || inputZ !== 0 ? 8 : 0;
    v.vx = moveX * speed;
    v.vy = moveZ * speed;
    p.x += v.vx * dts;
    p.y += v.vy * dts;

    // limites do pátio (simples)
    p.x = clamp(p.x, -100, 100);
    p.y = clamp(p.y, -90, 70);

    // Colisão com a Arca (AABB) — com abertura/porta lateral na zona da rampa
    const arkAabb = {
      minX: -ARK.length / 2,
      maxX: ARK.length / 2,
      minZ: -ARK.width / 2,
      maxZ: ARK.width / 2,
    };
    const door = {
      sideX: -ARK.length / 2,
      zCenter: -ARK.width / 2 + 2,
      zHalf: 3,
    };
    const wantsInside = aabbContainsPoint({ x: p.x, z: p.y }, arkAabb);
    if (wantsInside) {
      const throughDoor = Math.abs(p.x - door.sideX) < 1.5 && Math.abs(p.y - door.zCenter) < door.zHalf;
      if (!throughDoor) {
        const resolved = resolvePointAabbCollision(
          { x: p.x, z: p.y },
          prev,
          {
            minX: arkAabb.minX + 0.6,
            maxX: arkAabb.maxX - 0.6,
            minZ: arkAabb.minZ + 0.6,
            maxZ: arkAabb.maxZ - 0.6,
          },
        );
        p.x = resolved.x;
        p.y = resolved.z;
      }
    }

    // ----- Pulo + colisão com chão/decks -----
    const isInside = aabbContainsPoint({ x: p.x, z: p.y }, arkAabb);

    // Ramp: aproximação de subida para o térreo da arca na área da porta
    const onRamp = p.x < -ARK.length / 2 + 8 && p.x > -ARK.length / 2 - 24 && p.y < -ARK.width / 2 + 8;
    const rampT = onRamp ? clamp((p.x - (-ARK.length / 2 - 24)) / 24, 0, 1) : 0;

    const baseGroundY = 1; // pé do player
    const deck0 = baseGroundY + 0;
    const deck1 = baseGroundY + DECK_H;
    const deck2 = baseGroundY + DECK_H * 2;

    // Deck ativo: simples por Z (3 corredores), dá sensação de 3 andares sem escadas complexas
    const deckByZ = p.y < -2 ? deck0 : p.y < 2 ? deck1 : deck2;
    const insideFloor = deckByZ;

    const groundY = isInside ? Math.max(insideFloor, deck0 + rampT * 4) : deck0;

    // jump trigger
    const wantsJump = keysRef.current.space;
    if (wantsJump && !spaceLatchRef.current && groundedRef.current) {
      spaceLatchRef.current = true;
      pvyRef.current = 10.5;
      groundedRef.current = false;
    }
    if (!wantsJump) spaceLatchRef.current = false;

    // gravity
    pvyRef.current += -22 * dts;
    pyRef.current += pvyRef.current * dts;

    // collide with ground
    if (pyRef.current <= groundY) {
      pyRef.current = groundY;
      if (pvyRef.current < 0) pvyRef.current = 0;
      groundedRef.current = true;
    }

    // ----- Interações: alternar follow no animal mais próximo -----
    const wantsE = keysRef.current.e;
    if (wantsE && !eLatchRef.current) {
      eLatchRef.current = true;

      let nearest: { kind: AnimalKind; d2: number } | null = null;
      for (const a of ANIMALS) {
        const eid = world.entityManager.findEntityByName(`animal:${a.kind}`);
        if (!eid) continue;
        const ap = world.getComponent<ReturnType<typeof createPosition>>(eid, "Position");
        if (!ap) continue;
        const dd = dist2(p.x, p.y, ap.x, ap.y);
        if (!nearest || dd < nearest.d2) nearest = { kind: a.kind, d2: dd };
      }

      if (nearest && nearest.d2 < 6 * 6) {
        const st = stateRef.current;
        if (st.placed.has(nearest.kind)) {
          st.hint = "Esse animal já está na baia.";
        } else if (st.following.has(nearest.kind)) {
          st.following.delete(nearest.kind);
          st.hint = "Ok — parou de seguir.";
        } else {
          st.following.add(nearest.kind);
          st.hint = "Ok — agora está seguindo.";
        }
      } else {
        stateRef.current.hint = "Chegue mais perto e pressione E.";
      }
    }
    if (!wantsE) eLatchRef.current = false;

    // ----- Animal follow + pen placement -----
    for (const a of ANIMALS) {
      const eid = world.entityManager.findEntityByName(`animal:${a.kind}`);
      if (!eid) continue;
      const ap = world.getComponent<ReturnType<typeof createPosition>>(eid, "Position");
      const av = world.getComponent<ReturnType<typeof createVelocity>>(eid, "Velocity");
      const ai = world.getComponent<ReturnType<typeof createAI>>(eid, "AI");
      if (!ap || !av || !ai) continue;

      const st = stateRef.current;
      const following = st.following.has(a.kind) && !st.placed.has(a.kind);
      ai.behavior = following ? "chase" : "idle";

      if (following) {
        const dx = p.x - ap.x;
        const dz = p.y - ap.y;
        const len = Math.hypot(dx, dz) || 1;
        const followDist = 3.5 + (a.kind === "elefante" ? 2.5 : a.kind === "girafa" ? 2 : 0);
        if (len > followDist) {
          av.vx = (dx / len) * ai.speed;
          av.vy = (dz / len) * ai.speed;
        } else {
          av.vx = 0;
          av.vy = 0;
        }
      } else {
        av.vx = 0;
        av.vy = 0;
      }

      ap.x += av.vx * dts;
      ap.y += av.vy * dts;

      // Baias: 10 boxes internas simples (3 decks). Aqui mapeamos baias por índice.
      const idx = ANIMALS.findIndex((x) => x.kind === a.kind);
      const deck = idx % 3; // 0..2
      const penX = -ARK.length / 2 + 18 + Math.floor(idx / 3) * 18;
      const penZ = 0 + (deck - 1) * 6;

      // Trigger: se animal estiver "dentro" (no plano XZ) marca como colocado.
      if (!st.placed.has(a.kind) && dist2(ap.x, ap.y, penX, penZ) < 3.2 * 3.2) {
        st.placed.add(a.kind);
        st.following.delete(a.kind);
        st.hint = `✓ ${a.label} na baia`;
      }
    }

    // câmera follow (suavizada)
    const camY = 6.5;
    const cx = p.x + Math.sin(camRef.current.yaw) * camRef.current.dist;
    const cz = p.y + Math.cos(camRef.current.yaw) * camRef.current.dist;
    const cy = camY + Math.sin(camRef.current.pitch) * 10;
    camera.position.set(cx, cy, cz);
    camera.lookAt(p.x, pyRef.current + 1.2, p.y);

    // força re-render leve do HUD (sem 60fps)
    if (Math.random() < 0.08) setHudTick((t) => t + 1);
  });

  const placedCount = stateRef.current.placed.size;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 40, 20]} intensity={1.2} />

      {/* chão (alinhado ao mundo) */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[240, 1, 200]} />
        <meshStandardMaterial color="hsl(38, 18%, 18%)" />
      </mesh>

      {/* Arca: caixa retangular massiva + 3 decks (visuais) */}
      <mesh position={[0, ARK.height / 2, 0]}>
        <boxGeometry args={[ARK.length, ARK.height, ARK.width]} />
        <meshStandardMaterial color="hsl(28, 30%, 18%)" />
      </mesh>

      {/* decks (linhas) */}
      {Array.from({ length: ARK.decks - 1 }).map((_, i) => (
        <mesh key={i} position={[0, (i + 1) * DECK_H, 0]}>
          <boxGeometry args={[ARK.length + 0.2, 0.4, ARK.width + 0.2]} />
          <meshStandardMaterial color="hsl(32, 22%, 10%)" />
        </mesh>
      ))}

      {/* rampa de acesso */}
      <mesh position={[-ARK.length / 2 - 10, 3, -ARK.width / 2 + 2]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[26, 1.2, 5]} />
        <meshStandardMaterial color="hsl(35, 35%, 30%)" />
      </mesh>

      {/* andaimes (simples) */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[-ARK.length / 2 + 8 + i * 14, 6, ARK.width / 2 + 6]}>
          <boxGeometry args={[10, 12, 3]} />
          <meshStandardMaterial color="hsl(35, 28%, 34%)" />
        </mesh>
      ))}

      {/* player: Noé (2m) */}
      <PlayerMesh worldRef={worldRef} yRef={pyRef} />

      {/* animais */}
      {ANIMALS.map((a) => (
        <AnimalMesh
          key={a.kind}
          kind={a.kind}
          size={a.size}
          worldRef={worldRef}
          placed={stateRef.current.placed.has(a.kind)}
        />
      ))}

      {/* UI */}
      <Html fullscreen>
        <div className="pointer-events-none absolute left-0 right-0 top-0 p-3">
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-md bg-card/70 backdrop-blur px-3 py-2 text-sm text-card-foreground shadow">
            <span className="font-mono">{placedCount}/10</span>
            <span className="text-muted-foreground">animais nas baias</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">WASD mover • Space pular • Mouse arrasta câmera • E interagir</span>
          </div>
          {stateRef.current.hint ? (
            <div className="mt-2 pointer-events-auto inline-flex rounded-md bg-card/70 backdrop-blur px-3 py-2 text-xs text-muted-foreground shadow">
              {stateRef.current.hint}
            </div>
          ) : null}
        </div>

        <InputDebugOverlay
          enabled={inputDebug}
          title="3D Input Debug"
          getLines={() => {
            const k = keysRef.current;
            const c = camRef.current;
            return [
              `keys: W${k.w ? 1 : 0} A${k.a ? 1 : 0} S${k.s ? 1 : 0} D${k.d ? 1 : 0} Space${k.space ? 1 : 0} E${k.e ? 1 : 0}`,
              `cam: yaw=${c.yaw.toFixed(2)} pitch=${c.pitch.toFixed(2)} dist=${c.dist.toFixed(1)}`,
            ];
          }}
        />
      </Html>
    </>
  );
}

function PlayerMesh({
  worldRef,
  yRef,
}: {
  worldRef: MutableRefObject<World | null>;
  yRef: MutableRefObject<number>;
}) {
  const groupRef = useRef<Group | null>(null);

  useFrame(() => {
    const w = worldRef.current;
    if (!w) return;
    const id = w.entityManager.findEntityByName("player") ?? "entity_0";
    const p = w.getComponent<any>(id, "Position");
    if (!p) return;
    if (groupRef.current) groupRef.current.position.set(p.x, yRef.current, p.y);
  });

  return (
    <group ref={groupRef} position={[0, 1, -18]}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 2, 0.6]} />
        <meshStandardMaterial color="hsl(35, 30%, 70%)" />
      </mesh>
      <mesh position={[0, 2.25, 0]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color="hsl(28, 25%, 55%)" />
      </mesh>
    </group>
  );
}

function AnimalMesh({
  kind,
  size,
  placed,
  worldRef,
}: {
  kind: AnimalKind;
  size: { w: number; h: number; l: number };
  placed: boolean;
  worldRef: MutableRefObject<World | null>;
}) {
  const meshRef = useRef<Mesh | null>(null);

  useFrame(() => {
    const w = worldRef.current;
    if (!w) return;
    const id = w.entityManager.findEntityByName(`animal:${kind}`);
    if (!id) return;
    const p = w.getComponent<any>(id, "Position");
    if (!p) return;
    if (meshRef.current) meshRef.current.position.set(p.x, size.h / 2, p.y);
  });

  // Cores em HSL (mantém consistência do projeto)
  const color = useMemo(() => {
    if (placed) return "hsl(142, 55%, 42%)";
    if (kind === "girafa") return "hsl(42, 85%, 55%)";
    if (kind === "elefante") return "hsl(210, 10%, 60%)";
    if (kind === "leao") return "hsl(28, 75%, 48%)";
    if (kind === "zebra") return "hsl(0, 0%, 85%)";
    return "hsl(35, 25%, 58%)";
  }, [kind, placed]);

  return (
    <mesh ref={meshRef} position={[0, size.h / 2, 0]}>
      <boxGeometry args={[size.w * VOXEL, size.h * VOXEL, size.l * VOXEL]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export function ArkVoxelNoahStandaloneView() {
  const stateRef = useRef<ArkGameState>({ placed: new Set(), following: new Set(), hint: "" });
  const [inputDebug, setInputDebug] = useState(false);

  useRunnerHotkeys({
    onToggleInputDebug: () => setInputDebug((v) => !v),
  });

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Arca de Noé (Voxel)</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Canteiro de obras na Mesopotâmia, antes do dilúvio — reúna 10 animais e organize nas baias em 3 andares.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Standalone 3D</Badge>
          </div>
        </div>
        <Separator className="mt-4" />
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 pb-10 lg:grid-cols-[1fr_320px]">
        <Card className="relative overflow-hidden">
          <div className="aspect-[4/3] w-full bg-muted">
            <Canvas
              camera={{ position: [16, 12, 12], fov: 55, near: 0.1, far: 600 }}
              dpr={[1, 1.5]}
            >
              <ArkScene stateRef={stateRef} inputDebug={inputDebug} />
            </Canvas>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Objetivo</div>
              <div className="text-xs text-muted-foreground">Coloque os 10 animais nas baias</div>
            </div>
            <Badge variant="outline">10 animais</Badge>
          </div>
          <Separator className="my-3" />

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">Input Debug</div>
              <div className="text-xs text-muted-foreground">keys + câmera</div>
            </div>
            <Button
              size="sm"
              variant={inputDebug ? "default" : "outline"}
              onClick={() => setInputDebug((v) => !v)}
            >
              {inputDebug ? "On" : "Off"}
            </Button>
          </div>

          <Separator className="my-3" />

          <div className="space-y-2">
            {ANIMALS.map((a) => (
              <div
                key={a.kind}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm text-foreground truncate">{a.label}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {a.size.w}×{a.size.h}×{a.size.l}m
                  </div>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {stateRef.current.placed.has(a.kind) ? "OK" : "—"}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-3" />
          <div className="text-xs text-muted-foreground">
            Referência bíblica (Gênesis 6:15–16): arca retangular, 3 andares, porta lateral e abertura (janela) de 1 côvado.
          </div>

          <div className="mt-4">
            <Button asChild variant="outline" className="w-full">
              <a href="/games">Voltar</a>
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
