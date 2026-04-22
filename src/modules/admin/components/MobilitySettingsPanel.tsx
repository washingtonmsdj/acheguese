import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useToast } from "@/shared/hooks/use-toast";
import { Settings, MapPin, TrendingUp, Save, RefreshCw } from "lucide-react";
import { logger } from "@/shared/utils/logger";
import { useLocationContext } from "@/core/location";
import { mobilityRolloutService } from "@/shared/services/mobilityAdmin";

interface MobilitySettings {
  prioritize_destination_residents: {
    enabled: boolean;
    bonus_points: number;
  };
}

const DEFAULT_SETTINGS: MobilitySettings = {
  prioritize_destination_residents: {
    enabled: true,
    bonus_points: 10,
  },
};

export function MobilitySettingsPanel() {
  const { toast } = useToast();
  const { activeLocation } = useLocationContext();

  const activeLocationId = activeLocation?.id ?? null;
  const activeLocationName = activeLocation?.name ?? "Nenhuma localizacao selecionada";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [motoboyModeEnabled, setMotoboyModeEnabled] = useState(true);
  const [settings, setSettings] = useState<MobilitySettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    void loadSettings();
  }, [activeLocationId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      setSettings(DEFAULT_SETTINGS);

      if (!activeLocationId) {
        setMotoboyModeEnabled(false);
        return;
      }

      const enabled = await mobilityRolloutService.isMotoboyEnabled(activeLocationId);
      setMotoboyModeEnabled(enabled);
    } catch (error) {
      logger.error("Erro ao carregar configuracoes:", error);
      toast({
        title: "Erro",
        description: "Nao foi possivel carregar as configuracoes de mobilidade.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!activeLocationId) {
      toast({
        title: "Localizacao obrigatoria",
        description: "Selecione uma localizacao ativa para salvar o modo motoboy.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await mobilityRolloutService.setMotoboyEnabled(activeLocationId, motoboyModeEnabled);

      toast({
        title: "Configuracoes salvas",
        description: `Modo motoboy ${motoboyModeEnabled ? "ativado" : "desativado"} para ${activeLocationName}.`,
      });
    } catch (error) {
      logger.error("Erro ao salvar configuracoes:", error);
      toast({
        title: "Erro",
        description: "Nao foi possivel salvar as configuracoes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateDestinationPriority = (
    field: "enabled" | "bonus_points",
    value: boolean | number,
  ) => {
    setSettings((prev) => ({
      ...prev,
      prioritize_destination_residents: {
        ...prev.prioritize_destination_residents,
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Configuracoes de Mobilidade</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {activeLocationName}
            </Badge>
          </div>
          <CardDescription>
            Configure recursos operacionais por localizacao ativa.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Modo Motoboy</CardTitle>
          </div>
          <CardDescription>
            Ativa ou desativa novas solicitacoes de entrega por motoboy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="space-y-1">
              <Label htmlFor="motoboy-enabled" className="text-sm font-semibold">
                Permitir entregas por motoboy
              </Label>
              <p className="text-xs text-muted-foreground">
                Quando desligado, novas entregas sao bloqueadas no fluxo operacional.
              </p>
            </div>
            <Switch
              id="motoboy-enabled"
              checked={motoboyModeEnabled}
              onCheckedChange={setMotoboyModeEnabled}
              disabled={!activeLocationId}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Prioridade por Destino</CardTitle>
          </div>
          <CardDescription>
            Prioriza motoristas que moram no bairro de destino da corrida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="space-y-1">
              <Label
                htmlFor="destination-priority"
                className="text-sm font-semibold"
              >
                Ativar prioridade por destino
              </Label>
              <p className="text-xs text-muted-foreground">
                Motoristas que moram no destino recebem pontos extras no match.
              </p>
            </div>
            <Switch
              id="destination-priority"
              checked={settings.prioritize_destination_residents.enabled}
              onCheckedChange={(checked) =>
                updateDestinationPriority("enabled", checked)
              }
            />
          </div>

          {settings.prioritize_destination_residents.enabled && (
            <div className="space-y-3 p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between">
                <Label htmlFor="bonus-points" className="text-sm font-semibold">
                  Pontos de bonus
                </Label>
                <Badge variant="secondary" className="text-xs">
                  {settings.prioritize_destination_residents.bonus_points} pontos
                </Badge>
              </div>
              <Input
                id="bonus-points"
                type="range"
                min="0"
                max="20"
                step="1"
                value={settings.prioritize_destination_residents.bonus_points}
                onChange={(e) =>
                  updateDestinationPriority(
                    "bonus_points",
                    Number(e.target.value),
                  )
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 (desativado)</span>
                <span>10 (recomendado)</span>
                <span>20 (maximo)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Motoristas que moram no bairro de destino ganham {" "}
                {settings.prioritize_destination_residents.bonus_points} pontos extras no score de prioridade.
              </p>
            </div>
          )}

          <div className="p-4 rounded-lg border bg-accent/5 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-accent">
                Como funciona
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                - Passageiro pede corrida para <strong>Bairro A</strong>
              </p>
              <p>- Motorista 1 (mora Bairro B): 2km {'->'} Score: 85</p>
              <p>
                - Motorista 2 (mora Bairro A): 3km {'->'} Score: 90 (+
                {settings.prioritize_destination_residents.bonus_points} bonus)
              </p>
              <p className="text-accent font-semibold">
                Motorista 2 ganha (mora no destino)
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-primary/5 space-y-2">
            <span className="text-sm font-semibold text-primary">
              Vantagens
            </span>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Motorista termina corrida perto de casa</li>
              <li>Conhece melhor o bairro de destino</li>
              <li>Pode voltar para casa depois da corrida</li>
              <li>Mais seguranca (area conhecida)</li>
              <li>Menos corridas de retorno vazias</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={loadSettings} disabled={saving}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Recarregar
        </Button>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-primary hover:bg-primary/90"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Configuracoes"}
        </Button>
      </div>

      <Card className="border-warning/20 bg-warning/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> O toggle de motoboy e persistido em
            <code> module_rollouts.config </code>
            da localizacao ativa. A prioridade por destino permanece local ate o schema dedicado ser publicado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

