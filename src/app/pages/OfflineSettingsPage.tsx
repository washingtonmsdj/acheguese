import React from "react";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import {
  Download,
  Trash2,
  Phone,
  AlertTriangle,
  Building2,
  WifiOff,
  CheckCircle,
  XCircle,
  Lightbulb,
} from "lucide-react";
import { useOfflineMode } from "@/shared/hooks/useOfflineMode";
import { OfflineDataStatus } from "@/shared/components/offline/OfflineIndicator";
import { ConfirmActionDialog } from "@/shared/components/ConfirmActionDialog";
import { toast } from "sonner";

export default function OfflineSettingsPage() {
  const {
    isOnline,
    isServiceWorkerReady,
    hasCriticalData,
    cacheCriticalData,
    clearCache,
  } = useOfflineMode();

  const [emergencyContacts, setEmergencyContacts] = useState({
    portaria: "(27) 3333-4444",
    sindico: "(27) 9999-8888",
    emergencia: "190 / 193",
  });

  const [importantAlerts, setImportantAlerts] = useState([
    {
      id: "1",
      title: "Falta de água programada",
      content: "Manutenção na caixa d'água dia 15/03 das 8h às 12h",
      date: "15/03/2024",
      type: "maintenance",
    },
    {
      id: "2",
      title: "Reunião de condomínio",
      content: "Assembleia geral dia 20/03 às 19h no salão de festas",
      date: "20/03/2024",
      type: "event",
    },
  ]);

  const [buildingInfo, setBuildingInfo] = useState({
    name: "Edifício Vitória",
    address: "Rua das Flores, 123 - Praia do Canto",
    cep: "29055-000",
  });

  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);

  const handleSaveCriticalData = async () => {
    const success = await cacheCriticalData({
      emergencyContacts,
      importantAlerts,
      buildingInfo,
    });

    if (success) {
      toast.success("Dados salvos para modo offline!");
    }
  };

  const handleClearCache = async () => {
    const success = await clearCache();
    if (success) {
      toast.success("Cache limpo com sucesso");
      setClearCacheDialogOpen(false);
    }
  };

  return (
    <div className="bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Modo Offline</h1>
          <p className="text-muted-foreground">
            Configure quais informações estarão disponíveis sem internet
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WifiOff className="w-5 h-5" />
              Status do Modo Offline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-lg border ${isOnline ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isOnline ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-semibold">Conexão</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>

              <div
                className={`p-4 rounded-lg border ${isServiceWorkerReady ? "bg-green-500/10 border-green-500/30" : "bg-gray-500/10 border-gray-500/30"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isServiceWorkerReady ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="font-semibold">Service Worker</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isServiceWorkerReady ? "Ativo" : "Inactive"}
                </p>
              </div>

              <div
                className={`p-4 rounded-lg border ${hasCriticalData ? "bg-green-500/10 border-green-500/30" : "bg-gray-500/10 border-gray-500/30"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {hasCriticalData ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="font-semibold">Dados Salvos</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {hasCriticalData ? "Disponível" : "Não configurado"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <OfflineDataStatus />
            </div>
          </CardContent>
        </Card>

        {/* Contatos de Emergência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contatos de Emergência
            </CardTitle>
            <CardDescription>
              Números importantes que estarão disponíveis offline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portaria">Portaria</Label>
              <Input
                id="portaria"
                type="tel"
                value={emergencyContacts.portaria}
                onChange={(e) =>
                  setEmergencyContacts({
                    ...emergencyContacts,
                    portaria: e.target.value,
                  })
                }
                placeholder="(27) 3333-4444"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sindico">Síndico</Label>
              <Input
                id="sindico"
                type="tel"
                value={emergencyContacts.sindico}
                onChange={(e) =>
                  setEmergencyContacts({
                    ...emergencyContacts,
                    sindico: e.target.value,
                  })
                }
                placeholder="(27) 9999-8888"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencia">Emergência</Label>
              <Input
                id="emergencia"
                type="text"
                value={emergencyContacts.emergencia}
                onChange={(e) =>
                  setEmergencyContacts({
                    ...emergencyContacts,
                    emergencia: e.target.value,
                  })
                }
                placeholder="190 / 193"
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Avisos Importantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Avisos Importantes
            </CardTitle>
            <CardDescription>
              Avisos que ficarão disponíveis offline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {importantAlerts.map((alert) => (
              <div key={alert.id} className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {alert.date}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{alert.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <ConfirmActionDialog
          open={clearCacheDialogOpen}
          onOpenChange={setClearCacheDialogOpen}
          title="Limpar dados offline?"
          description="Esta ação remove os dados salvos para uso sem internet neste dispositivo. Você poderá salvar novamente depois."
          confirmLabel="Limpar dados"
          cancelLabel="Manter dados"
          onConfirm={handleClearCache}
        />

        {/* Informações do Prédio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Informações do Prédio
            </CardTitle>
            <CardDescription>Dados básicos do condomínio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Edifício</Label>
              <Input
                id="name"
                value={buildingInfo.name}
                onChange={(e) =>
                  setBuildingInfo({ ...buildingInfo, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={buildingInfo.address}
                onChange={(e) =>
                  setBuildingInfo({ ...buildingInfo, address: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={buildingInfo.cep}
                onChange={(e) =>
                  setBuildingInfo({ ...buildingInfo, cep: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-3">
          <Button
            onClick={handleSaveCriticalData}
            disabled={!isServiceWorkerReady}
            className="flex-1"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Salvar para Modo Offline
          </Button>

          <Button
            onClick={() => setClearCacheDialogOpen(true)}
            disabled={!hasCriticalData}
            variant="outline"
            size="lg"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Cache
          </Button>
        </div>
        <ConfirmActionDialog
          open={clearCacheDialogOpen}
          onOpenChange={setClearCacheDialogOpen}
          title="Limpar dados offline?"
          description="Esta ação remove os dados salvos para uso sem internet neste dispositivo. Você poderá salvar novamente depois."
          confirmLabel="Limpar dados"
          cancelLabel="Manter dados"
          onConfirm={handleClearCache}
        />

        {/* Informações */}
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <p className="flex items-start gap-2 text-sm text-blue-400">
            <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <strong>Dica:</strong> Salve os dados importantes para acessá-los
              mesmo sem internet. Ideal para consultar números de emergência ou
              avisos importantes quando estiver sem sinal.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
