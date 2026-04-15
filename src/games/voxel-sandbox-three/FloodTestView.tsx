import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { RuntimeDebugOverlay } from "@/components/ordax/RuntimeDebugOverlay";
import { InputDebugOverlay } from "@/components/ordax/InputDebugOverlay";

import { useRunnerHotkeys } from "@/hooks/use-runner-hotkeys";

import { OrdaxThreeRuntime } from "@/lib/ordax/runtime3d/OrdaxThreeRuntime";
import { FloodTestGame } from "./floodTestGame";

export function FloodTestView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isFlooding, setIsFlooding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [intensity, setIntensity] = useState<'calm' | 'moderate' | 'biblical'>('biblical');
  const [waterLevel, setWaterLevel] = useState(2);
  const [floodPhase, setFloodPhase] = useState<'before' | 'starting' | 'flooding'>('before');
  const [gameTime, setGameTime] = useState(0); // Tempo no jogo (em horas)
  const [timeOfDay, setTimeOfDay] = useState<string>("12:00"); // Hora do dia
  const [dayPeriod, setDayPeriod] = useState<string>("☀️ Tarde"); // Período do dia
  const [stability, setStability] = useState(0.5);
  const [timeControl, setTimeControl] = useState(12); // Controle manual do tempo (0-24)
  const [debug, setDebug] = useState(false);
  const [fpsCamera, setFpsCamera] = useState(false);
  const [inputDebug, setInputDebug] = useState(false);
  const [physicsDebug, setPhysicsDebug] = useState(false);
  const [floodDebug, setFloodDebug] = useState(false);
  
  // Estado para debug de física da Arca
  const [arkPhysics, setArkPhysics] = useState({
    buoyancy: 0,
    weight: 0,
    netForce: 0,
    submergedVolume: 0,
    submergedPercent: 0,
  });

  // Estado para debug completo do overlay 3D
  const [floodDebugData, setFloodDebugData] = useState<import("./utils/floodDebugOverlay").FloodDebugData | null>(null);

  useRunnerHotkeys({
    onToggleInputDebug: () => setInputDebug((v) => !v),
    onToggleRuntimeDebug: () => setDebug((v) => !v),
  });

  const runtimeRef = useRef<OrdaxThreeRuntime | null>(null);
  const gameRef = useRef<FloodTestGame | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const game = new FloodTestGame({
      onHud: (hud) => {
        setProgress(hud.progress);
        setWaterLevel(hud.waterLevel);
        setFloodPhase(hud.phase);
        setGameTime(hud.gameTime);
        setTimeOfDay(hud.timeOfDay || "12:00");
        setDayPeriod(hud.dayPeriod || "☀️ Tarde");
        
        // ✅ Atualizar debug de física da Arca
        if (hud.arkPhysics) {
          setArkPhysics(hud.arkPhysics);
        }
        // ✅ Atualizar dados do debug overlay 3D
        if (hud.floodDebug) {
          setFloodDebugData(hud.floodDebug);
        }
      },
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
    game.setIntensity(intensity);
    game.setStability(stability);

    return () => {
      runtime.stop();
      runtime.dispose();
      runtimeRef.current = null;
      gameRef.current = null;
    };
    // Intencionalmente []: o game runtime não deve ser recriado por toggles de UI.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aplicar mudanças de intensidade sem recriar Three.js
  useEffect(() => {
    gameRef.current?.setIntensity(intensity);
  }, [intensity]);

  // Aplicar mudanças de flooding sem recriar Three.js
  useEffect(() => {
    gameRef.current?.setFlooding(isFlooding);
  }, [isFlooding]);

  useEffect(() => {
    gameRef.current?.setStability(stability);
  }, [stability]);

  useEffect(() => {
    gameRef.current?.setCameraMode(fpsCamera ? "fps" : "orbit");
  }, [fpsCamera]);
  
  useEffect(() => {
    gameRef.current?.setFloodDebug(floodDebug);
  }, [floodDebug]);
  
  // Aplicar mudanças de tempo manualmente
  useEffect(() => {
    gameRef.current?.setTimeOfDay(timeControl);
  }, [timeControl]);

  const handleStartFlood = () => {
    setIsFlooding(true);
    setFloodPhase('starting');
    setGameTime(0); // Resetar tempo no jogo
    console.log('🌊 INICIANDO DILÚVIO - Água começará a subir...');
  };

  const handleStopFlood = () => {
    setIsFlooding(false);
  };

  const handleIntensityChange = (newIntensity: 'calm' | 'moderate' | 'biblical') => {
    setIntensity(newIntensity);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="relative overflow-hidden">
          <div ref={containerRef} className="aspect-[4/3] w-full bg-muted relative">
            <canvas ref={canvasRef} className="h-full w-full" />

            <RuntimeDebugOverlay
              enabled={debug}
              getStats={() => runtimeRef.current?.getDebugStats() as unknown as Record<string, unknown>}
            />

            <InputDebugOverlay
              enabled={inputDebug}
              title="Ordax FPS Input"
              getLines={() => gameRef.current?.getInputDebugLines() ?? []}
            />
            
            {/* HUD */}
            <div className="pointer-events-none absolute left-0 right-0 top-0 p-3">
              <div className="pointer-events-auto inline-flex flex-col gap-2">
                {/* 🔧 DEBUG DE FÍSICA DA ARCA */}
                {physicsDebug && (
                  <div className="rounded-md bg-card/90 backdrop-blur px-3 py-2 text-sm shadow border-2 border-yellow-500 w-80">
                    <div className="text-yellow-600 dark:text-yellow-400 font-semibold mb-3">
                      ⚙️ Debug de Física - Arca
                    </div>
                    
                    {/* 📊 INDICADOR VISUAL: Empuxo vs Peso */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          ↑ Empuxo: {(arkPhysics.buoyancy / 1000000).toFixed(2)}M N
                        </span>
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          Peso: {(arkPhysics.weight / 1000000).toFixed(2)}M N ↓
                        </span>
                      </div>
                      
                      {/* Barra de Comparação */}
                      <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                        {/* Barra de Peso (vermelho, da direita) */}
                        <div 
                          className="absolute right-0 top-0 h-full bg-red-500/70 transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (arkPhysics.weight / Math.max(arkPhysics.weight, arkPhysics.buoyancy, 1)) * 100)}%` 
                          }}
                        />
                        
                        {/* Barra de Empuxo (azul, da esquerda) */}
                        <div 
                          className="absolute left-0 top-0 h-full bg-blue-500/70 transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (arkPhysics.buoyancy / Math.max(arkPhysics.weight, arkPhysics.buoyancy, 1)) * 100)}%` 
                          }}
                        />
                        
                        {/* Linha Central */}
                        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/50" />
                        
                        {/* Texto Central */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-xs font-bold drop-shadow-md ${
                            arkPhysics.netForce > 100 ? 'text-green-600' :
                            arkPhysics.netForce < -100 ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {arkPhysics.netForce > 0 ? '↑' : arkPhysics.netForce < 0 ? '↓' : '⚖️'}
                            {' '}
                            {Math.abs(arkPhysics.netForce / 1000).toFixed(1)}k N
                          </span>
                        </div>
                      </div>
                      
                      {/* Legenda */}
                      <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                        <span>← Flutuando</span>
                        <span>Equilibrado</span>
                        <span>Afundando →</span>
                      </div>
                    </div>
                    
                    <div className="h-px bg-border my-2" />
                    
                    {/* Dados Numéricos */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Força Líquida:</span>
                        <span className={`font-mono font-semibold ${
                          arkPhysics.netForce > 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : arkPhysics.netForce < 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {arkPhysics.netForce > 0 ? '+' : ''}{(arkPhysics.netForce / 1000).toFixed(1)}k N
                          {arkPhysics.netForce > 0 && ' ↑'}
                          {arkPhysics.netForce < 0 && ' ↓'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Vol. Submerso:</span>
                        <span className="font-mono">
                          {arkPhysics.submergedVolume.toFixed(1)} m³
                        </span>
                      </div>
                      
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">% Submerso:</span>
                        <span className="font-mono">
                          {arkPhysics.submergedPercent.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="h-px bg-border my-1" />
                      
                      {/* Status com Emoji */}
                      <div className="text-xs font-semibold mt-2 text-center py-1 rounded-md" style={{
                        backgroundColor: arkPhysics.netForce > 100 ? 'rgba(34, 197, 94, 0.2)' :
                                       arkPhysics.netForce < -100 ? 'rgba(239, 68, 68, 0.2)' :
                                       'rgba(156, 163, 175, 0.2)'
                      }}>
                        {arkPhysics.netForce > 100 && '🔼 Flutuando (empuxo > peso)'}
                        {arkPhysics.netForce < -100 && '🔽 Afundando (peso > empuxo)'}
                        {Math.abs(arkPhysics.netForce) <= 100 && '⚖️ Equilibrado'}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 🌊 DEBUG OVERLAY 3D - Dados completos */}
                {floodDebug && floodDebugData && (
                  <div className="rounded-md bg-card/90 backdrop-blur px-3 py-2 text-sm shadow border-2 border-cyan-500 w-80">
                    <div className="text-cyan-600 dark:text-cyan-400 font-semibold mb-2">
                      🌊 Debug Overlay 3D
                    </div>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nível da água:</span>
                        <span className="text-cyan-400">{floodDebugData.waterLevel.toFixed(2)}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Arca Y:</span>
                        <span>{floodDebugData.arkPositionY.toFixed(2)}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Arca X/Z:</span>
                        <span>{floodDebugData.arkPositionX.toFixed(1)} / {floodDebugData.arkPositionZ.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dist. terreno:</span>
                        <span className={floodDebugData.distanceToTerrain < 0.2 ? "text-red-400" : "text-green-400"}>
                          {floodDebugData.distanceToTerrain.toFixed(2)}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pts submersos:</span>
                        <span className="text-blue-400">
                          {floodDebugData.submergedPoints}/{floodDebugData.totalPoints}
                          {" "}({floodDebugData.submergedPercent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Empuxo:</span>
                        <span className="text-blue-400">{(floodDebugData.buoyancy / 1e6).toFixed(2)}M N</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Peso:</span>
                        <span className="text-red-400">{(floodDebugData.weight / 1e6).toFixed(2)}M N</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Força líquida:</span>
                        <span className={floodDebugData.netForce > 0 ? "text-green-400" : "text-red-400"}>
                          {floodDebugData.netForce > 0 ? "+" : ""}{(floodDebugData.netForce / 1e6).toFixed(2)}M N
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dimensões:</span>
                        <span className="text-xs">
                          {floodDebugData.arkDimensions.x.toFixed(0)}×{floodDebugData.arkDimensions.y.toFixed(0)}×{floodDebugData.arkDimensions.z.toFixed(0)}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base casco (Y):</span>
                        <span className="font-mono text-yellow-400">{floodDebugData.meshBottomY.toFixed(2)}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Topo casco (Y):</span>
                        <span className="font-mono">{floodDebugData.meshTopY.toFixed(2)}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Empuxo ativo:</span>
                        <span className={floodDebugData.buoyancyActive ? "text-green-400 font-semibold" : "text-red-400"}>
                          {floodDebugData.buoyancyActive ? "✅ SIM" : "❌ NÃO"}
                        </span>
                      </div>
                      <div className="h-px bg-border my-1" />
                      <div className={`text-center font-semibold py-1 rounded ${
                        floodDebugData.rigidBodyState === "floating" ? "bg-green-500/20 text-green-400" :
                        floodDebugData.rigidBodyState === "on_ground" ? "bg-orange-500/20 text-orange-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {floodDebugData.rigidBodyState === "floating" && "🚢 FLUTUANDO"}
                        {floodDebugData.rigidBodyState === "on_ground" && "⛰️ NO CHÃO"}
                        {floodDebugData.rigidBodyState === "airborne" && "✈️ NO AR"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mostrar nível de água apenas quando dilúvio ativo e água acima do terreno */}
                {isFlooding && waterLevel > 1 && (
                  <div className="rounded-md bg-card/80 backdrop-blur px-3 py-2 text-sm shadow">
                    <div className="text-muted-foreground">Nível da Água</div>
                    <div className="text-lg font-semibold">{waterLevel.toFixed(1)}m</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {waterLevel < 5 ? "Inundando terreno baixo" : 
                       waterLevel < 10 ? "Inundação moderada" : 
                       waterLevel < 15 ? "Inundação severa" : 
                       "Dilúvio total"}
                    </div>
                  </div>
                )}
                
                {isFlooding && waterLevel <= 1 && (
                  <div className="rounded-md bg-card/80 backdrop-blur px-3 py-2 text-sm shadow">
                    <div className="text-muted-foreground">Status</div>
                    <div className="text-lg font-semibold">Água subindo...</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Nível atual: {waterLevel.toFixed(1)}m (abaixo do terreno)
                    </div>
                  </div>
                )}
                
                {isFlooding && (
                  <>
                    <div className="rounded-md bg-card/80 backdrop-blur px-3 py-2 text-sm shadow">
                      <div className="text-muted-foreground">Hora do Dia</div>
                      <div className="text-lg font-semibold">{timeOfDay}</div>
                      <div className="text-xs text-muted-foreground mt-1">{dayPeriod}</div>
                    </div>
                    
                    <div className="rounded-md bg-card/80 backdrop-blur px-3 py-2 text-sm shadow">
                      <div className="text-muted-foreground">Tempo no Jogo</div>
                      <div className="text-lg font-semibold">
                        {Math.floor(gameTime)}h {Math.floor((gameTime % 1) * 60)}min
                      </div>
                    </div>
                    
                    <div className="rounded-md bg-card/80 backdrop-blur px-3 py-2 text-sm shadow">
                      <div className="text-muted-foreground">Progresso</div>
                      <div className="text-lg font-semibold">{(progress * 100).toFixed(0)}%</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Versículo Bíblico */}
            <div className="pointer-events-none absolute left-0 right-0 bottom-0 p-3">
              <div className="rounded-md bg-card/70 backdrop-blur px-3 py-2 text-xs text-muted-foreground shadow">
                <strong>Gênesis 7:11-12:</strong> "...romperam-se todas as fontes do grande abismo,
                e as comportas dos céus se abriram, e houve chuva sobre a terra..."
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Gênesis 7:11-12</Badge>
              <Badge variant={isFlooding ? "destructive" : "outline"}>
                {floodPhase === 'before' && 'Antes do Dilúvio'}
                {floodPhase === 'starting' && 'Começando...'}
                {floodPhase === 'flooding' && 'Dilúvio Ativo'}
              </Badge>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-foreground mb-2">Controles</div>
            
            {!isFlooding ? (
              <Button onClick={handleStartFlood} className="w-full" variant="destructive">
                🌊 Iniciar Dilúvio
              </Button>
            ) : (
              <Button onClick={handleStopFlood} className="w-full" variant="outline">
                ⏸️ Pausar
              </Button>
            )}
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium text-foreground mb-2">Intensidade</div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={intensity === 'calm' ? 'default' : 'outline'}
                onClick={() => handleIntensityChange('calm')}
              >
                Calmo
              </Button>
              <Button
                size="sm"
                variant={intensity === 'moderate' ? 'default' : 'outline'}
                onClick={() => handleIntensityChange('moderate')}
              >
                Moderado
              </Button>
              <Button
                size="sm"
                variant={intensity === 'biblical' ? 'default' : 'outline'}
                onClick={() => handleIntensityChange('biblical')}
              >
                Bíblico
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium text-foreground mb-2">Estabilidade da Arca</div>
            <div className="space-y-2">
              <Slider
                value={[stability]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => setStability(v[0] ?? 0.5)}
              />
              <div className="text-xs text-muted-foreground">
                {stability < 0.34
                  ? "Cinemático (balança mais)"
                  : stability > 0.66
                    ? "Estável (balança menos)"
                    : "Equilibrado"}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium text-foreground mb-2">
              ⏰ Hora do Dia: {Math.floor(timeControl)}:{String(Math.floor((timeControl % 1) * 60)).padStart(2, '0')}
            </div>
            <div className="space-y-2">
              <Slider
                value={[timeControl]}
                min={0}
                max={24}
                step={0.25}
                onValueChange={(v) => setTimeControl(v[0] ?? 12)}
              />
              <div className="text-xs text-muted-foreground">
                {timeControl >= 6 && timeControl < 8 && "🌅 Nascer do sol"}
                {timeControl >= 8 && timeControl < 12 && "🌄 Manhã"}
                {timeControl >= 12 && timeControl < 18 && "☀️ Tarde"}
                {timeControl >= 18 && timeControl < 20 && "🌇 Pôr do sol"}
                {(timeControl >= 20 || timeControl < 6) && "🌙 Noite"}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">Debug</div>
              <div className="text-xs text-muted-foreground">FPS, dt, substeps, accumulator</div>
            </div>
            <Button size="sm" variant={debug ? "default" : "outline"} onClick={() => setDebug((v) => !v)}>
              {debug ? "On" : "Off"}
            </Button>
          </div>
          
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">Debug de Física</div>
              <div className="text-xs text-muted-foreground">Empuxo vs Peso da Arca</div>
            </div>
            <Button size="sm" variant={physicsDebug ? "default" : "outline"} onClick={() => setPhysicsDebug((v) => !v)}>
              {physicsDebug ? "On" : "Off"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">Debug Overlay 3D</div>
              <div className="text-xs text-muted-foreground">Gizmos: água, flutuação, bbox</div>
            </div>
            <Button size="sm" variant={floodDebug ? "default" : "outline"} onClick={() => setFloodDebug((v) => !v)}>
              {floodDebug ? "On" : "Off"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">Câmera FPS</div>
              <div className="text-xs text-muted-foreground">Pointer Lock + WASD + Space + Shift</div>
            </div>
            <Button size="sm" variant={fpsCamera ? "default" : "outline"} onClick={() => setFpsCamera((v) => !v)}>
              {fpsCamera ? "On" : "Off"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">Input Debug</div>
              <div className="text-xs text-muted-foreground">locked/sprint/jump/move</div>
            </div>
            <Button size="sm" variant={inputDebug ? "default" : "outline"} onClick={() => setInputDebug((v) => !v)}>
              {inputDebug ? "On" : "Off"}
            </Button>
          </div>

          <div>
            <div className="text-sm font-medium text-foreground mb-2">Features AAA</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>✅ Ondas Gerstner (4 camadas)</div>
              <div>✅ Normal mapping animado</div>
              <div>✅ Foam procedural (espuma)</div>
              <div>✅ Chuva torrencial (15k partículas)</div>
              <div>✅ Névoa volumétrica dinâmica</div>
              <div>✅ Iluminação Phong + Fresnel</div>
              <div>✅ Nível de água subindo</div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium text-foreground mb-2">Referências</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>🎮 Sea of Thieves (ondas)</div>
              <div>🎮 Assassin's Creed (oceano)</div>
              <div>🎮 Subnautica (água volumétrica)</div>
              <div>📖 Gênesis 7-8 (narrativa)</div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium text-foreground mb-2">Outros Jogos</div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/games/play/voxel-sandbox-three")}
            >
              🎮 Voxel Sandbox (Construção)
            </Button>
            <div className="text-xs text-muted-foreground mt-2">
              Jogo voxel com blocos, grama otimizada e LOD
            </div>
          </div>

          <Separator />

        </Card>
    </div>
  );
}
