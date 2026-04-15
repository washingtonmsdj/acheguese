import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Settings,
  Eye,
  Code2,
  Activity,
  Dna,
} from "lucide-react";
import type { OrdaxSpec } from "@/lib/ordax/types";
import { OrdaxCanvas, type OrdaxCanvasHandle } from "@/components/ordax/OrdaxCanvas";
import { RemixButton } from "@/components/ordax/RemixButton";
import { GenomeViewer } from "@/components/ordax/GenomeViewer";
import { extractGenome } from "@/lib/ordax/game-genome";
import { toast } from "sonner";
import { StellarVanguardStudioRunner } from "@/games/stellar-vanguard/StudioRunner";

// ============================================================================
// TYPES
// ============================================================================

type Props = {
  spec?: OrdaxSpec;
  gameId?: string;
  onRemixComplete?: (remixedSpec: OrdaxSpec, remixId: string) => void;
};

type EngineMode = "json" | "code";

interface DebugInfo {
  systems: {
    physics?: boolean;
    collision?: boolean;
    particles?: boolean;
    particleCount?: number;
    score?: boolean;
    ai?: boolean;
    camera?: boolean;
    audio?: boolean;
    animation?: boolean;
    ui?: boolean;
  };
  entities: {
    total: number;
    spawned: number;
  };
  player?: {
    health: number;
    x: number;
    y: number;
  };
  score?: {
    current: number;
    multiplier: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LABELS = {
  TABS: {
    PREVIEW: "Game Preview",
    VISUAL: "Visual Editor",
    GENOME: "Genome",
  },
  ENGINE_MODE: {
    CODE: "Code",
    JSON: "JSON",
  },
  BUTTONS: {
    PLAY: "Play",
    PAUSE: "Pause",
    RESET: "Reset",
    FULLSCREEN: "Fullscreen",
    SETTINGS: "Settings",
    NEW_GAME: "New Game",
  },
  BUILD_STATUS: {
    OK: "Build OK",
    WAITING: "Waiting",
  },
  EMPTY_STATE: {
    TITLE: "Descreva seu jogo no chat",
    DESCRIPTION: "A IA vai responder sua descrição e gerar o jogo automaticamente",
    EXAMPLES_TITLE: "Exemplos:",
    EXAMPLE_1: "• \"Quero um jogo de nave espacial com asteroides\"",
    EXAMPLE_2: "• \"Crie um platformer 2D com moedas\"",
    EXAMPLE_3: "• \"Jogo de corrida top-down\"",
  },
  CODE_PREVIEW: {
    TITLE: "Code-first preview",
    NO_RUNNER: "Nenhum runner registrado para este gameId.",
  },
  GAME_OVER: {
    TITLE: "Game Over",
    MESSAGE: "Sua nave foi destruída. Quer começar um novo jogo?",
  },
  NEW_GAME: {
    TITLE: "New Game",
    MESSAGE: "Iniciando automaticamente…",
  },
  DEBUG: {
    TITLE: "Debug Info",
    ENTITIES: "Entities",
    HEALTH: "Health",
    POSITION: "Position",
    SCORE: "Score",
  },
  SYSTEMS: {
    PHYSICS: "✓ Physics",
    COLLISION: "✓ Collision",
    PARTICLES: "✓ Particles",
    SCORE: "✓ Score",
    AI: "✓ AI",
    CAMERA: "✓ Camera",
    AUDIO: "✓ Audio",
    ANIMATION: "✓ Animation",
    UI: "✓ UI",
  },
  INFO_BAR: {
    RESOLUTION: "Resolução:",
    FPS: "FPS",
    ENGINE: "Engine: Ordax 1.0",
  },
} as const;

const MESSAGES = {
  SUCCESS: {
    RESET: "Jogo resetado!",
  },
  INFO: {
    RESET_CODE: "Reset do runner Code-first: em desenvolvimento",
    NEW_GAME_CODE: "New Game do runner Code-first: em desenvolvimento",
    FULLSCREEN: "Fullscreen em desenvolvimento",
    SETTINGS: "Settings em desenvolvimento",
  },
  ERROR: {
    CANVAS_NOT_FOUND: "Canvas não encontrado",
    RESET_FAILED: "Falha ao resetar o jogo",
    DEBUG_INFO_FAILED: "Falha ao obter informações de debug",
  },
} as const;

const DEFAULTS = {
  FPS: 60,
  RESOLUTION: {
    WIDTH: 800,
    HEIGHT: 600,
  },
  ENGINE_VERSION: "1.0",
  GAME_ID: "unknown",
  INITIAL_TAB: "preview" as const,
  INITIAL_ENGINE_MODE: "json" as const,
} as const;

const VALIDATION = {
  HEALTH: {
    MIN: 0,
    MAX: 1000,
  },
  FPS: {
    MIN: 0,
    MAX: 240,
  },
  INTERVAL: {
    MIN: 16,
    MAX: 1000,
  },
  TIMEOUT: {
    MIN: 0,
    MAX: 10000,
  },
} as const;

const LAYOUT = {
  HEADER_HEIGHT: 12,
  TABS_HEIGHT: 8,
  CONTROLS_HEIGHT: 10,
  DEBUG_PANEL_HEIGHT: 32,
  DEBUG_SCROLL_HEIGHT: 24,
  BADGE_HEIGHT: 6,
  BUTTON_HEIGHT: 7,
} as const;

const TIMING = {
  DEBUG_INFO_INTERVAL: 100,
  START_OVERLAY_TIMEOUT: 1200,
} as const;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validateDebugInfo(info: unknown): info is DebugInfo {
  if (!info || typeof info !== "object") return false;
  if (!info.systems || typeof info.systems !== "object") return false;
  if (!info.entities || typeof info.entities !== "object") return false;
  if (typeof info.entities.total !== "number") return false;
  if (typeof info.entities.spawned !== "number") return false;
  return true;
}

function validateHealth(health: unknown): number {
  if (typeof health !== "number") return 0;
  if (isNaN(health) || !isFinite(health)) return 0;
  if (health < VALIDATION.HEALTH.MIN) return VALIDATION.HEALTH.MIN;
  if (health > VALIDATION.HEALTH.MAX) return VALIDATION.HEALTH.MAX;
  return health;
}

function validateFps(fps: unknown): number {
  if (typeof fps !== "number") return DEFAULTS.FPS;
  if (isNaN(fps) || !isFinite(fps)) return DEFAULTS.FPS;
  if (fps < VALIDATION.FPS.MIN) return VALIDATION.FPS.MIN;
  if (fps > VALIDATION.FPS.MAX) return VALIDATION.FPS.MAX;
  return fps;
}

function validateInterval(interval: unknown): number {
  if (typeof interval !== "number") return TIMING.DEBUG_INFO_INTERVAL;
  if (isNaN(interval) || !isFinite(interval)) return TIMING.DEBUG_INFO_INTERVAL;
  if (interval < VALIDATION.INTERVAL.MIN) return VALIDATION.INTERVAL.MIN;
  if (interval > VALIDATION.INTERVAL.MAX) return VALIDATION.INTERVAL.MAX;
  return interval;
}

function validateTimeout(timeout: unknown): number {
  if (typeof timeout !== "number") return TIMING.START_OVERLAY_TIMEOUT;
  if (isNaN(timeout) || !isFinite(timeout)) return TIMING.START_OVERLAY_TIMEOUT;
  if (timeout < VALIDATION.TIMEOUT.MIN) return VALIDATION.TIMEOUT.MIN;
  if (timeout > VALIDATION.TIMEOUT.MAX) return VALIDATION.TIMEOUT.MAX;
  return timeout;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StudioPreviewPanel({ spec, gameId, onRemixComplete }: Props) {
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "visual" | "genome">(DEFAULTS.INITIAL_TAB);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showStartOverlay, setShowStartOverlay] = useState(false);
  const canvasRef = useRef<OrdaxCanvasHandle>(null);

  const [engineMode, setEngineMode] = useState<EngineMode>(() => 
    (gameId === "stellar-vanguard" ? "code" : DEFAULTS.INITIAL_ENGINE_MODE)
  );

  // Sync engine mode with gameId
  useEffect(() => {
    setEngineMode(gameId === "stellar-vanguard" ? "code" : DEFAULTS.INITIAL_ENGINE_MODE);
  }, [gameId]);

  // HUD info with validation
  const hud = useMemo(
    () => ({ 
      fps: running ? validateFps(DEFAULTS.FPS) : 0, 
      build: spec ? LABELS.BUILD_STATUS.OK : LABELS.BUILD_STATUS.WAITING 
    }),
    [running, spec]
  );

  // Update debug info periodically
  useEffect(() => {
    if (!running) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const validatedInterval = validateInterval(TIMING.DEBUG_INFO_INTERVAL);
    const interval = setInterval(() => {
      try {
        const info = canvas.getDebugInfo();
        if (info && validateDebugInfo(info)) {
          setDebugInfo(info);
        }
      } catch (error) {
        console.error(MESSAGES.ERROR.DEBUG_INFO_FAILED, error);
      }
    }, validatedInterval);

    return () => clearInterval(interval);
  }, [running, spec]);

  // Auto-start when a new spec arrives
  useEffect(() => {
    if (!spec || engineMode === "code") {
      setRunning(false);
      setDebugInfo(null);
      setShowStartOverlay(false);
      return;
    }

    // 🔍 DEBUG: Log da spec para investigar tela vazia
    console.log('[StudioPreviewPanel] 🔍 Spec recebida:', {
      gameType: spec.gameType,
      title: spec.title,
      entitiesCount: spec.scene?.entities?.length || 0,
      entities: spec.scene?.entities?.map(e => ({ 
        id: e.id, 
        type: e.type, 
        x: e.x, 
        y: e.y, 
        w: e.w, 
        h: e.h,
        visual: e.visual 
      })) || [],
      systems: spec.systems || [],
      player: spec.player || {},
      spawners: spec.spawners || {},
    });
    
    // 🔍 DEBUG: Log completo da spec
    console.log('[StudioPreviewPanel] 🔍 Spec COMPLETA:', JSON.stringify(spec, null, 2));

    setRunning(true);
    setShowStartOverlay(true);
    const validatedTimeout = validateTimeout(TIMING.START_OVERLAY_TIMEOUT);
    const id = window.setTimeout(() => setShowStartOverlay(false), validatedTimeout);
    return () => window.clearTimeout(id);
  }, [spec, engineMode]);

  // Check game over with validation
  const isGameOver = useMemo(() => {
    if (!debugInfo?.player) return false;
    const health = validateHealth(debugInfo.player.health);
    return health <= VALIDATION.HEALTH.MIN;
  }, [debugInfo]);

  // Stop game when game over
  useEffect(() => {
    if (isGameOver) {
      setRunning(false);
    }
  }, [isGameOver]);

  // Handler: Reset game
  const handleReset = useCallback(() => {
    if (engineMode === "json") {
      try {
        setRunning(false);
        const canvas = canvasRef.current;
        if (!canvas) {
          toast.error(MESSAGES.ERROR.CANVAS_NOT_FOUND);
          return;
        }
        canvas.reset();
        toast.success(MESSAGES.SUCCESS.RESET);
      } catch (error) {
        console.error(MESSAGES.ERROR.RESET_FAILED, error);
        toast.error(MESSAGES.ERROR.RESET_FAILED);
      }
      return;
    }
    toast.info(MESSAGES.INFO.RESET_CODE);
  }, [engineMode]);

  // Handler: New game
  const handleNewGame = useCallback(() => {
    if (engineMode === "json") {
      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          toast.error(MESSAGES.ERROR.CANVAS_NOT_FOUND);
          return;
        }
        canvas.reset();
        setRunning(true);
        setShowStartOverlay(false);
      } catch (error) {
        console.error(MESSAGES.ERROR.RESET_FAILED, error);
        toast.error(MESSAGES.ERROR.RESET_FAILED);
      }
      return;
    }
    toast.info(MESSAGES.INFO.NEW_GAME_CODE);
  }, [engineMode]);

  // Handler: Toggle play/pause
  const handleTogglePlay = useCallback(() => {
    setRunning((v) => !v);
  }, []);

  // Handler: Fullscreen
  const handleFullscreen = useCallback(() => {
    toast.info(MESSAGES.INFO.FULLSCREEN);
  }, []);

  // Handler: Settings
  const handleSettings = useCallback(() => {
    toast.info(MESSAGES.INFO.SETTINGS);
  }, []);

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header with Tabs */}
      <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 bg-card/60">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EngineMode)}>
          <TabsList className="h-8 bg-transparent border border-border/50">
            <TabsTrigger value="preview" className="text-xs gap-2 h-7" aria-label={LABELS.TABS.PREVIEW}>
              <Eye className="h-3 w-3" />
              {LABELS.TABS.PREVIEW}
            </TabsTrigger>
            <TabsTrigger value="visual" className="text-xs gap-2 h-7" aria-label={LABELS.TABS.VISUAL}>
              <Code2 className="h-3 w-3" />
              {LABELS.TABS.VISUAL}
            </TabsTrigger>
            {spec?.runtime && (
              <TabsTrigger value="genome" className="text-xs gap-2 h-7" aria-label={LABELS.TABS.GENOME}>
                <Dna className="h-3 w-3" />
                {LABELS.TABS.GENOME}
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {gameId === "stellar-vanguard" && (
            <Tabs value={engineMode} onValueChange={(v) => setEngineMode(v as EngineMode)}>
              <TabsList className="h-8 bg-transparent border border-border/50">
                <TabsTrigger value="code" className="text-xs h-7" aria-label={LABELS.ENGINE_MODE.CODE}>
                  {LABELS.ENGINE_MODE.CODE}
                </TabsTrigger>
                <TabsTrigger value="json" className="text-xs h-7" aria-label={LABELS.ENGINE_MODE.JSON}>
                  {LABELS.ENGINE_MODE.JSON}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          {spec && (
            <>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary text-xs h-6"
                aria-label={hud.build}
              >
                {hud.build}
              </Badge>
              {running && (
                <Badge
                  variant="outline"
                  className="border-neon-green/30 bg-neon-green/10 text-neon-green text-xs h-6 animate-pulse"
                  aria-label={`${hud.fps} ${LABELS.INFO_BAR.FPS}`}
                >
                  {hud.fps} {LABELS.INFO_BAR.FPS}
                </Badge>
              )}
            </>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      {spec && engineMode === "json" && (
        <div className="h-10 border-b border-border/50 flex items-center justify-between px-4 bg-card/60">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-2"
              onClick={handleTogglePlay}
              aria-label={running ? LABELS.BUTTONS.PAUSE : LABELS.BUTTONS.PLAY}
            >
              {running ? (
                <>
                  <Pause className="h-3 w-3" />
                  {LABELS.BUTTONS.PAUSE}
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  {LABELS.BUTTONS.PLAY}
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-2"
              onClick={handleReset}
              aria-label={LABELS.BUTTONS.RESET}
            >
              <RotateCcw className="h-3 w-3" />
              {LABELS.BUTTONS.RESET}
            </Button>

            <div className="h-4 w-px bg-border/50 mx-1" role="separator"></div>

            <RemixButton
              currentSpec={spec?.runtime as OrdaxSpec | null}
              gameId={gameId || DEFAULTS.GAME_ID}
              onRemixComplete={(remixedSpec, remixId) => {
                onRemixComplete?.(remixedSpec, remixId);
              }}
            />

            <div className="h-4 w-px bg-border/50 mx-1" role="separator"></div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-2"
              onClick={handleFullscreen}
              aria-label={LABELS.BUTTONS.FULLSCREEN}
            >
              <Maximize2 className="h-3 w-3" />
              {LABELS.BUTTONS.FULLSCREEN}
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs gap-2"
              onClick={handleSettings}
              aria-label={LABELS.BUTTONS.SETTINGS}
            >
              <Settings className="h-3 w-3" />
              {LABELS.BUTTONS.SETTINGS}
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{LABELS.INFO_BAR.RESOLUTION} {DEFAULTS.RESOLUTION.WIDTH}x{DEFAULTS.RESOLUTION.HEIGHT}</span>
            <span>•</span>
            <span>{DEFAULTS.FPS} {LABELS.INFO_BAR.FPS}</span>
            <span>•</span>
            <span>{LABELS.INFO_BAR.ENGINE}</span>
          </div>
        </div>
      )}

      {/* Preview Area */}
      <div className="relative flex-1 bg-background flex flex-col">
        {activeTab === "genome" && spec?.runtime ? (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <GenomeViewer genome={extractGenome(spec.runtime)} />
            </div>
          </div>
        ) : !spec && engineMode === "json" ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-border/50">
                <Eye className="h-10 w-10 text-primary/50" />
              </div>
              <div>
                <h3 className="text-xl font-bold neon-text mb-2">
                  {LABELS.EMPTY_STATE.TITLE}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {LABELS.EMPTY_STATE.DESCRIPTION}
                </p>
              </div>
              <div className="pt-4 space-y-2">
                <div className="text-xs text-muted-foreground font-semibold">
                  {LABELS.EMPTY_STATE.EXAMPLES_TITLE}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>{LABELS.EMPTY_STATE.EXAMPLE_1}</div>
                  <div>{LABELS.EMPTY_STATE.EXAMPLE_2}</div>
                  <div>{LABELS.EMPTY_STATE.EXAMPLE_3}</div>
                </div>
              </div>
            </div>
          </div>
        ) : engineMode === "code" ? (
          <div className="flex-1 p-4">
            <div className="w-full h-full rounded-lg overflow-hidden border border-border/50 bg-background">
              {gameId === "stellar-vanguard" ? (
                <StellarVanguardStudioRunner />
              ) : (
                <div className="h-full w-full grid place-items-center p-8 text-center">
                  <div>
                    <div className="text-sm font-medium text-foreground">{LABELS.CODE_PREVIEW.TITLE}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {LABELS.CODE_PREVIEW.NO_RUNNER}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Canvas */}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="w-full h-full rounded-lg overflow-hidden border border-border/50 bg-background">
                <OrdaxCanvas ref={canvasRef} spec={spec} running={running} />
              </div>
            </div>

            {/* Game State Overlays */}
            {(showStartOverlay || isGameOver) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto rounded-xl border border-border/50 bg-background/80 backdrop-blur px-6 py-5 text-center max-w-sm" role="dialog" aria-live="polite">
                  {isGameOver ? (
                    <>
                      <div className="text-lg font-bold mb-1">{LABELS.GAME_OVER.TITLE}</div>
                      <div className="text-xs text-muted-foreground mb-4">{LABELS.GAME_OVER.MESSAGE}</div>
                      <div className="flex items-center justify-center gap-2">
                        <Button size="sm" onClick={handleNewGame} aria-label={LABELS.BUTTONS.NEW_GAME}>
                          {LABELS.BUTTONS.NEW_GAME}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleReset} aria-label={LABELS.BUTTONS.RESET}>
                          {LABELS.BUTTONS.RESET}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-bold mb-1">{LABELS.NEW_GAME.TITLE}</div>
                      <div className="text-xs text-muted-foreground">{LABELS.NEW_GAME.MESSAGE}</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Debug Panel */}
            {debugInfo && (
              <div className="h-32 border-t border-border/50 bg-card/60">
                <div className="h-8 border-b border-border/50 flex items-center px-3">
                  <Activity className="h-3.5 w-3.5 text-primary mr-2" />
                  <span className="text-xs font-semibold">{LABELS.DEBUG.TITLE}</span>
                </div>
                <ScrollArea className="h-24">
                  <div className="p-3 space-y-2">
                    {/* Systems */}
                    <div className="flex flex-wrap gap-2" role="list" aria-label="Active Systems">
                      {debugInfo.systems.physics && (
                        <Badge variant="outline" className="text-[10px] h-5 border-primary/30 bg-primary/10 text-primary" role="listitem">
                          {LABELS.SYSTEMS.PHYSICS}
                        </Badge>
                      )}
                      {debugInfo.systems.collision && (
                        <Badge variant="outline" className="text-[10px] h-5 border-accent/30 bg-accent/10 text-accent" role="listitem">
                          {LABELS.SYSTEMS.COLLISION}
                        </Badge>
                      )}
                      {debugInfo.systems.particles && (
                        <Badge variant="outline" className="text-[10px] h-5 border-secondary/30 bg-secondary/10 text-secondary" role="listitem">
                          {LABELS.SYSTEMS.PARTICLES} ({debugInfo.systems.particleCount || 0})
                        </Badge>
                      )}
                      {debugInfo.systems.score && (
                        <Badge variant="outline" className="text-[10px] h-5 border-primary/30 bg-primary/10 text-primary" role="listitem">
                          {LABELS.SYSTEMS.SCORE}
                        </Badge>
                      )}
                      {debugInfo.systems.ai && (
                        <Badge variant="outline" className="text-[10px] h-5 border-secondary/30 bg-secondary/10 text-secondary" role="listitem">
                          {LABELS.SYSTEMS.AI}
                        </Badge>
                      )}
                      {debugInfo.systems.camera && (
                        <Badge variant="outline" className="text-[10px] h-5 border-primary/30 bg-primary/10 text-primary" role="listitem">
                          {LABELS.SYSTEMS.CAMERA}
                        </Badge>
                      )}
                      {debugInfo.systems.audio && (
                        <Badge variant="outline" className="text-[10px] h-5 border-accent/30 bg-accent/10 text-accent" role="listitem">
                          {LABELS.SYSTEMS.AUDIO}
                        </Badge>
                      )}
                      {debugInfo.systems.animation && (
                        <Badge variant="outline" className="text-[10px] h-5 border-secondary/30 bg-secondary/10 text-secondary" role="listitem">
                          {LABELS.SYSTEMS.ANIMATION}
                        </Badge>
                      )}
                      {debugInfo.systems.ui && (
                        <Badge variant="outline" className="text-[10px] h-5 border-accent/30 bg-accent/10 text-accent" role="listitem">
                          {LABELS.SYSTEMS.UI}
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-3 text-[10px]">
                      <div className="space-y-0.5">
                        <div className="text-muted-foreground">{LABELS.DEBUG.ENTITIES}</div>
                        <div className="text-primary font-mono">{debugInfo.entities.total + debugInfo.entities.spawned}</div>
                      </div>
                      {debugInfo.player && (
                        <>
                          <div className="space-y-0.5">
                            <div className="text-muted-foreground">{LABELS.DEBUG.HEALTH}</div>
                            <div className="text-primary font-mono">{validateHealth(debugInfo.player.health)}</div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-muted-foreground">{LABELS.DEBUG.POSITION}</div>
                            <div className="text-primary font-mono">
                              {Math.round(debugInfo.player.x)},{Math.round(debugInfo.player.y)}
                            </div>
                          </div>
                        </>
                      )}
                      {debugInfo.score && (
                        <div className="space-y-0.5">
                          <div className="text-muted-foreground">{LABELS.DEBUG.SCORE}</div>
                          <div className="text-primary font-mono">
                            {debugInfo.score.current}
                            {debugInfo.score.multiplier > 1 && (
                              <span className="text-secondary ml-1">x{debugInfo.score.multiplier.toFixed(1)}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
