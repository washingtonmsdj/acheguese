import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GameRunnerLayout } from "@/components/games/GameRunnerLayout";
import { StellarVanguardStandaloneView } from "@/games/stellar-vanguard/StandaloneView";
import { ArkVoxelNoahStandaloneView } from "@/games/ark-voxel-noah/StandaloneView";
import { VoxelSandboxThreeStandaloneView } from "@/games/voxel-sandbox-three/StandaloneView";
import { FloodTestView } from "@/games/voxel-sandbox-three/FloodTestView";
import { getLauncherItemById } from "@/games/launcher";

export default function GamePlay() {
  const params = useParams();
  const id = params.id;

  const [voxelCameraMode, setVoxelCameraMode] = useState<"fps" | "orbit">("fps");

  const item = useMemo(() => getLauncherItemById(id), [id]);

  const view = useMemo(() => {
    if (id === "stellar-vanguard") return <StellarVanguardStandaloneView />;
    if (id === "ark-voxel-noah") return <ArkVoxelNoahStandaloneView />;
    if (id === "voxel-sandbox-three")
      return <VoxelSandboxThreeStandaloneView cameraMode={voxelCameraMode} onCameraModeChange={setVoxelCameraMode} />;
    if (id === "flood-test") return <FloodTestView />;
    return (
      <div className="grid place-items-center px-6 py-16">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-foreground">Runner não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Não existe standalone runner para este id.</p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/games">Voltar para Launcher</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }, [id]);

  const rightActions = useMemo(() => {
    if (id !== "voxel-sandbox-three") return null;
    return (
      <Button
        size="sm"
        variant={voxelCameraMode === "fps" ? "secondary" : "outline"}
        onClick={() => setVoxelCameraMode((m) => (m === "fps" ? "orbit" : "fps"))}
      >
        {voxelCameraMode === "fps" ? "FPS" : "Orbit"}
      </Button>
    );
  }, [id, voxelCameraMode]);

  return (
    <GameRunnerLayout
      title={item?.title ?? "Game Runner"}
      subtitle={item?.tagline}
      rightActions={rightActions}
    >
      {view}
    </GameRunnerLayout>
  );
}
