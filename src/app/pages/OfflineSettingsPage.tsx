import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle,
  Download,
  Lightbulb,
  Phone,
  Trash2,
  WifiOff,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmActionDialog } from "@/shared/components/ConfirmActionDialog";
import { OfflineDataStatus } from "@/shared/components/offline/OfflineIndicator";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useOfflineMode } from "@/shared/hooks/useOfflineMode";

interface StatusTileProps {
  active: boolean;
  inactiveLabel: string;
  title: string;
  activeLabel: string;
  tone?: "success" | "danger" | "neutral";
}

function StatusTile({
  active,
  inactiveLabel,
  title,
  activeLabel,
  tone = "success",
}: StatusTileProps) {
  const palette =
    tone === "danger"
      ? {
          active: "border-amber-500/30 bg-amber-500/10 text-amber-200",
          inactive: "border-red-500/30 bg-red-500/10 text-red-200",
        }
      : tone === "neutral"
        ? {
            active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
            inactive: "border-slate-500/30 bg-slate-500/10 text-slate-200",
          }
        : {
            active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
            inactive: "border-slate-500/30 bg-slate-500/10 text-slate-200",
          };

  const Icon = active ? CheckCircle : XCircle;

  return (
    <div
      className={`rounded-2xl border p-4 ${active ? palette.active : palette.inactive}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{active ? activeLabel : inactiveLabel}</p>
    </div>
  );
}

export default function OfflineSettingsPage() {
  const navigate = useNavigate();
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

  const [importantAlerts] = useState([
    {
      id: "1",
      title: "Falta de agua programada",
      content: "Manutencao na caixa d'agua dia 15/03 das 8h as 12h.",
      date: "15/03/2024",
      type: "maintenance",
    },
    {
      id: "2",
      title: "Reuniao de condominio",
      content: "Assembleia geral dia 20/03 as 19h no salao de festas.",
      date: "20/03/2024",
      type: "event",
    },
  ]);

  const [buildingInfo, setBuildingInfo] = useState({
    name: "Edificio Vitoria",
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
      toast.success("Dados salvos para modo offline.");
      return;
    }

    toast.error("Nao foi possivel salvar os dados offline.");
  };

  const handleClearCache = async () => {
    const success = await clearCache();

    if (success) {
      toast.success("Cache offline limpo com sucesso.");
      setClearCacheDialogOpen(false);
      return;
    }

    toast.error("Nao foi possivel limpar o cache offline.");
  };

  return (
    <>
      <Helmet>
        <title>Modo offline</title>
      </Helmet>

      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_26%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.3))]">
        <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8">
          <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:rounded-3xl sm:border sm:bg-card/85 sm:px-5 sm:shadow-sm">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full"
                onClick={() => navigate(-1)}
                type="button"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Disponibilidade local
                </p>
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Modo offline
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Defina o que precisa continuar acessivel quando o sinal cair.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Leitura local
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Contatos, avisos e dados essenciais no aparelho
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                O modo offline guarda informacoes criticas do territorio e da operacao para consultas rapidas
                sem depender da rede.
              </p>
            </div>
          </section>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
            <div className="space-y-4">
              <Card className="rounded-3xl border-border/70 bg-card/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <WifiOff className="h-4 w-4" />
                    Status do modo offline
                  </CardTitle>
                  <CardDescription>
                    Valide conectividade, service worker e disponibilidade de dados locais.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <StatusTile
                      active={isOnline}
                      title="Conexao"
                      activeLabel="Rede ativa e sincronizacao disponivel."
                      inactiveLabel="Sem internet no momento."
                      tone="danger"
                    />
                    <StatusTile
                      active={isServiceWorkerReady}
                      title="Service worker"
                      activeLabel="Cache local pronto para uso."
                      inactiveLabel="Ainda nao inicializado."
                      tone="neutral"
                    />
                    <StatusTile
                      active={hasCriticalData}
                      title="Dados salvos"
                      activeLabel="Conteudo critico ja esta no dispositivo."
                      inactiveLabel="Nenhum pacote offline salvo."
                      tone="neutral"
                    />
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <OfflineDataStatus />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/70 bg-card/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="h-4 w-4" />
                    Contatos de emergencia
                  </CardTitle>
                  <CardDescription>
                    Numeros que precisam continuar acessiveis sem internet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="portaria">Portaria</Label>
                    <Input
                      id="portaria"
                      type="tel"
                      value={emergencyContacts.portaria}
                      onChange={(event) =>
                        setEmergencyContacts((current) => ({ ...current, portaria: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sindico">Sindico</Label>
                    <Input
                      id="sindico"
                      type="tel"
                      value={emergencyContacts.sindico}
                      onChange={(event) =>
                        setEmergencyContacts((current) => ({ ...current, sindico: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="emergencia">Emergencia publica</Label>
                    <Input
                      id="emergencia"
                      type="text"
                      value={emergencyContacts.emergencia}
                      disabled
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/70 bg-card/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4" />
                    Informacoes do edificio
                  </CardTitle>
                  <CardDescription>
                    Base local para localizacao, portaria e identificacao do condominio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="building-name">Nome do edificio</Label>
                    <Input
                      id="building-name"
                      value={buildingInfo.name}
                      onChange={(event) =>
                        setBuildingInfo((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="building-address">Endereco</Label>
                    <Input
                      id="building-address"
                      value={buildingInfo.address}
                      onChange={(event) =>
                        setBuildingInfo((current) => ({ ...current, address: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="building-cep">CEP</Label>
                    <Input
                      id="building-cep"
                      value={buildingInfo.cep}
                      onChange={(event) =>
                        setBuildingInfo((current) => ({ ...current, cep: event.target.value }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="rounded-3xl border-border/70 bg-card/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4" />
                    Avisos importantes
                  </CardTitle>
                  <CardDescription>
                    Conteudo critico que vale manter no aparelho para consulta imediata.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {importantAlerts.map((alert) => (
                    <div key={alert.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{alert.content}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{alert.date}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-primary/20 bg-primary/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Como usar bem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p>
                    Salve os dados offline quando estiver com internet boa, antes de deslocamentos ou dias com risco de instabilidade.
                  </p>
                  <p>
                    Priorize numeros de emergencia, avisos de agua, energia, seguranca e contatos do predio.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <section className="mt-5 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Pacote local do dispositivo</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Salve o conjunto atual ou limpe o cache quando precisar renovar os dados.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  className="w-full justify-center sm:w-auto"
                  onClick={() => setClearCacheDialogOpen(true)}
                  disabled={!hasCriticalData}
                  type="button"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar cache
                </Button>
                <Button
                  className="w-full justify-center sm:w-auto"
                  onClick={handleSaveCriticalData}
                  disabled={!isServiceWorkerReady}
                  type="button"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Salvar offline
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <ConfirmActionDialog
        open={clearCacheDialogOpen}
        onOpenChange={setClearCacheDialogOpen}
        title="Limpar dados offline?"
        description="Esta acao remove os dados salvos para uso sem internet neste dispositivo."
        confirmLabel="Limpar dados"
        cancelLabel="Manter dados"
        onConfirm={handleClearCache}
      />
    </>
  );
}
