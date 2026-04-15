import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InputDebugOverlay } from "@/components/ordax/InputDebugOverlay";
import { OrdaxThreeRuntime } from "@/lib/ordax/runtime3d/OrdaxThreeRuntime";
import { VoxelSandboxThreeGame } from "./VoxelSandboxThreeGame";
import { useRunnerHotkeys } from "@/hooks/use-runner-hotkeys";

export function VoxelSandboxThreeStandaloneView({
  cameraMode,
  onCameraModeChange,
}: {
  cameraMode: "fps" | "orbit";
  onCameraModeChange: (mode: "fps" | "orbit") => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [locked, setLocked] = useState(false);
  const [hint, setHint] = useState("Clique no mundo para travar o mouse (Pointer Lock)");
  const [inputDebug, setInputDebug] = useState(false);

  useRunnerHotkeys({
    onToggleInputDebug: () => setInputDebug((v) => !v),
  });

  const runtimeRef = useRef<OrdaxThreeRuntime | null>(null);
  const gameRef = useRef<VoxelSandboxThreeGame | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const game = new VoxelSandboxThreeGame({
      onLockChange: setLocked,
      onHint: setHint,
    });

    const runtime = new OrdaxThreeRuntime({
      canvas,
      container,
      createGame: () => game,
      fixedDtSeconds: 1 / 60,
      maxSubsteps: 8,
    });

    gameRef.current = game;
    runtimeRef.current = runtime;
    runtime.start();

    return () => {
      runtime.stop();
      runtime.dispose();
      runtimeRef.current = null;
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    gameRef.current?.setCameraMode(cameraMode);
  }, [cameraMode]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="relative overflow-hidden">
        <div ref={containerRef} className="aspect-[4/3] w-full bg-muted relative">
          <canvas ref={canvasRef} className="h-full w-full" />

          <InputDebugOverlay
            enabled={inputDebug}
            title="Ordax FPS Input"
            getLines={() => gameRef.current?.getInputDebugLines() ?? []}
          />

          <div className="pointer-events-none absolute left-0 right-0 top-0 p-3">
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-md bg-card/70 backdrop-blur px-3 py-2 text-sm text-card-foreground shadow">
              <span className="text-muted-foreground">{hint}</span>
            </div>
            {cameraMode === "fps" && !locked ? (
              <div className="mt-2 pointer-events-auto inline-flex rounded-md bg-card/70 backdrop-blur px-3 py-2 text-xs text-muted-foreground shadow">
                Dica: pressione ESC para sair do modo FPS.
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">MVP</div>
            <div className="text-xs text-muted-foreground">
              Planície aluvial (areia/barro/argila) + colisão
            </div>
          </div>
          <Badge variant="outline">Ordax runtime</Badge>
        </div>
        <Separator className="my-3" />

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-foreground">Input Debug</div>
            <div className="text-xs text-muted-foreground">locked/sprint/jump/move</div>
          </div>
          <Button size="sm" variant={inputDebug ? "default" : "outline"} onClick={() => setInputDebug((v) => !v)}>
            {inputDebug ? "On" : "Off"}
          </Button>
        </div>

        <Separator className="my-3" />

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-foreground">Câmera</div>
            <div className="text-xs text-muted-foreground">FPS (Pointer Lock) / Orbit</div>
          </div>
          <Button
            size="sm"
            variant={cameraMode === "fps" ? "secondary" : "outline"}
            onClick={() => onCameraModeChange(cameraMode === "fps" ? "orbit" : "fps")}
          >
            {cameraMode === "fps" ? "FPS" : "Orbit"}
          </Button>
        </div>

        <Separator className="my-3" />

        <div>
          <div className="text-sm font-medium text-foreground mb-2">Outros Jogos</div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => navigate("/games/play/flood-test")}
          >
            🌊 Flood Test (Dilúvio + Arca)
          </Button>
          <div className="text-xs text-muted-foreground mt-2">
            Tech demo com água, Arca de Noé e peixes
          </div>
        </div>

        <Separator className="my-3" />

        <div className="text-xs text-muted-foreground">
          Próximos passos: colocar bloco, quebrar bloco, colisão AABB, inventário e chunks.
        </div>
      </Card>
    </div>
  );
}
