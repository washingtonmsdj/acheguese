import React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { Slider } from "@/shared/components/ui/slider";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Bell,
  MapPin,
  Clock,
  Dog,
  AlertTriangle,
  Calendar,
  MessageSquare,
  ThumbsUp,
  Shield,
} from "lucide-react";
import { usePushNotifications } from "@/shared/hooks/usePushNotifications";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { useSessionContext } from "@/core/session";
import { toast } from "sonner";
export function NotificationSettings() {
  const { activeProfile } = useSessionContext();
  const {
    preferences,
    loading,
    requestNotificationPermission,
    updatePreferences,
  } = usePushNotifications(activeProfile?.id);
  const {
    latitude,
    longitude,
    accuracy,
    permissionGranted,
    requestPermission,
    updateUserLocation,
  } = useGeolocation();

  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleSave = async () => {
    await updatePreferences(localPrefs);
  };

  const handleEnableNotifications = async () => {
    // 1. Solicitar permissão de notificações
    const notifGranted = await requestNotificationPermission();
    if (!notifGranted) return;

    // 2. Solicitar permissão de localização
    const locationGranted = await requestPermission();
    if (!locationGranted) {
      toast.error("Localização necessária para notificações geofenced");
      return;
    }

    // 3. Atualizar localização no banco
    if (activeProfile?.id) {
      await updateUserLocation(activeProfile.id);
    }

    toast.success(
      "Notificações ativadas! Você receiveá alertas de posts próximos.",
    );
  };

  const formatRadius = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Status das Notificações
          </CardTitle>
          <CardDescription>
            Configure notificações baseadas em localização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status de Permissões */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg border ${permissionGranted ? "bg-green-500/10 border-green-500/30" : "bg-gray-500/10 border-gray-500/30"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin
                  className={`w-5 h-5 ${permissionGranted ? "text-green-500" : "text-gray-500"}`}
                />
                <span className="font-semibold">Localização</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {permissionGranted ? (
                  <>
                    Ativa · Precisão:{" "}
                    {accuracy ? `${Math.round(accuracy)}m` : "N/A"}
                  </>
                ) : (
                  "Desativada"
                )}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${Notification.permission === "granted" ? "bg-green-500/10 border-green-500/30" : "bg-gray-500/10 border-gray-500/30"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Bell
                  className={`w-5 h-5 ${Notification.permission === "granted" ? "text-green-500" : "text-gray-500"}`}
                />
                <span className="font-semibold">Notificações Push</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {Notification.permission === "granted"
                  ? "Ativas"
                  : "Desativadas"}
              </p>
            </div>
          </div>

          {/* Botão de Ativar */}
          {(!permissionGranted || Notification.permission !== "granted") && (
            <Button onClick={handleEnableNotifications} className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Ativar Notificações Geofenced
            </Button>
          )}

          {/* Localização Atual */}
          {permissionGranted && latitude && longitude && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                Sua localização atual:
              </p>
              <p className="text-sm font-mono">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipos de Notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificações</CardTitle>
          <CardDescription>
            Escolha quais tipos de posts geram notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dog className="w-5 h-5 text-orange-500" />
              <div>
                <Label htmlFor="pet-perdido" className="font-semibold">
                  Pet Perdido
                </Label>
                <p className="text-xs text-muted-foreground">
                  Alertas de animais perdidos
                </p>
              </div>
            </div>
            <Switch
              id="pet-perdido"
              checked={localPrefs.notify_pet_perdido}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notify_pet_perdido: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <Label htmlFor="alerta" className="font-semibold">
                  Alertas
                </Label>
                <p className="text-xs text-muted-foreground">
                  Avisos importantes da comunidade
                </p>
              </div>
            </div>
            <Switch
              id="alerta"
              checked={localPrefs.notify_alerta}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notify_alerta: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <Label htmlFor="evento" className="font-semibold">
                  Eventos
                </Label>
                <p className="text-xs text-muted-foreground">
                  Eventos próximos a você
                </p>
              </div>
            </div>
            <Switch
              id="evento"
              checked={localPrefs.notify_evento}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notify_evento: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ThumbsUp className="w-5 h-5 text-teal-500" />
              <div>
                <Label htmlFor="recomendacao" className="font-semibold">
                  Recomendações
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recomendações de profissionais
                </p>
              </div>
            </div>
            <Switch
              id="recomendacao"
              checked={localPrefs.notify_recomendacao}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notify_recomendacao: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <div>
                <Label htmlFor="discussao" className="font-semibold">
                  Discussões
                </Label>
                <p className="text-xs text-muted-foreground">
                  Discussões da comunidade
                </p>
              </div>
            </div>
            <Switch
              id="discussao"
              checked={localPrefs.notify_discussao}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, notify_discussao: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Raio de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Raio de Notificação
          </CardTitle>
          <CardDescription>
            Receba notificações de posts dentro deste raio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Distância máxima</Label>
              <span className="text-sm font-bold text-teal-500">
                {formatRadius(localPrefs.radius_meters)}
              </span>
            </div>
            <Slider
              value={[localPrefs.radius_meters]}
              onValueChange={([value]) =>
                setLocalPrefs({ ...localPrefs, radius_meters: value })
              }
              min={100}
              max={5000}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>100m</span>
              <span>5km</span>
            </div>
          </div>

          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <p className="text-xs text-blue-400">
              💡 Quanto maior o raio, mais notificações você receiveá.
              Recomendamos 500m para áreas urbanas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Horário Silencioso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horário Silencioso
          </CardTitle>
          <CardDescription>
            Não receive notificações durante este período
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiet-start">Início</Label>
              <Input
                id="quiet-start"
                type="time"
                value={localPrefs.quiet_hours_start || ""}
                onChange={(e) =>
                  setLocalPrefs({
                    ...localPrefs,
                    quiet_hours_start: e.target.value || null,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-end">Fim</Label>
              <Input
                id="quiet-end"
                type="time"
                value={localPrefs.quiet_hours_end || ""}
                onChange={(e) =>
                  setLocalPrefs({
                    ...localPrefs,
                    quiet_hours_end: e.target.value || null,
                  })
                }
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Exemplo: 22:00 - 07:00 (não receive notificações durante a noite)
          </p>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <Button
        onClick={handleSave}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? "Saving..." : "Salvar Preferências"}
      </Button>
    </div>
  );
}
