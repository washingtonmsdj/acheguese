import { useMemo, useState } from "react";
import {
  Database,
  Loader2,
  PlayCircle,
  Shield,
  UploadCloud,
} from "lucide-react";
import { AdminPageHeader, AdminSectionCard, AdminStatsCard, AdminStatsGrid } from "@/modules/admin/components";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";

type ImportMode = "dry-run" | "apply";

type ApiResponse = {
  ok?: boolean;
  mode?: ImportMode;
  sample?: boolean;
  input_count?: number;
  plan_create_count?: number;
  plan_skip_count?: number;
  created_count?: number;
  generated_at?: string;
  error?: string;
};

export default function AdminGooglePlacesImport() {
  const { canModerate, isChecking } = useAdminGuard();
  const { toast } = useToast();

  const [token, setToken] = useState("");
  const [mode, setMode] = useState<ImportMode>("dry-run");
  const [sample, setSample] = useState(true);
  const [limit, setLimit] = useState("20");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [rawResponse, setRawResponse] = useState("");

  const parsedLimit = useMemo(() => {
    const value = Number.parseInt(limit, 10);
    if (!Number.isFinite(value) || value <= 0) return 20;
    return value;
  }, [limit]);

  async function runImport(nextMode: ImportMode) {
    if (!token.trim()) {
      toast({
        title: "Token obrigatório",
        description: "Informe IMPORT_ADMIN_TOKEN para executar a importação.",
        variant: "destructive",
      });
      return;
    }

    if (nextMode === "apply" && !ownerUserId.trim()) {
      toast({
        title: "ownerUserId obrigatório",
        description: "No modo apply, informe o UUID do usuário owner.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setMode(nextMode);

    try {
      const result = await fetch("/api/admin/google-places-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-import-admin-token": token.trim(),
        },
        body: JSON.stringify({
          mode: nextMode,
          sample,
          limit: parsedLimit,
          ownerUserId: ownerUserId.trim() || undefined,
        }),
      });

      const data = (await result.json()) as ApiResponse;
      setResponse(data);
      setRawResponse(JSON.stringify(data, null, 2));

      if (!result.ok || data.error) {
        toast({
          title: "Falha na importação",
          description: data.error || "Erro desconhecido no endpoint.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: nextMode === "dry-run" ? "Dry-run concluído" : "Apply concluído",
        description:
          nextMode === "dry-run"
            ? `${data.plan_create_count ?? 0} criação(ões) planejada(s)`
            : `${data.created_count ?? 0} empresa(s) criada(s)`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setResponse({ error: message });
      setRawResponse(message);
      toast({
        title: "Erro de execução",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  }

  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h1 className="mb-2 text-2xl font-bold text-white">Acesso Negado</h1>
          <p className="text-gray-400">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Import Google Places"
        description="Piloto para pré-popular empresas de Salvador com dry-run e apply."
        icon={Database}
      />

      <AdminStatsGrid>
        <AdminStatsCard
          title="Modo Atual"
          value={mode}
          subtitle={sample ? "Dataset sample" : "Dataset real"}
          icon={PlayCircle}
        />
        <AdminStatsCard
          title="Limite"
          value={String(parsedLimit)}
          subtitle="Itens por execução"
          icon={UploadCloud}
        />
        <AdminStatsCard
          title="Último Resultado"
          value={response?.ok ? "Sucesso" : response?.error ? "Erro" : "N/A"}
          subtitle={response?.generated_at ? new Date(response.generated_at).toLocaleString("pt-BR") : "Sem execução"}
          icon={Database}
        />
      </AdminStatsGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        <AdminSectionCard
          title="Configuração da execução"
          description="Defina token, modo e limites antes de disparar o endpoint."
          icon={Database}
          contentClassName="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="import-token">Token admin</Label>
            <Input
              id="import-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="IMPORT_ADMIN_TOKEN"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="import-limit">Limite</Label>
            <Input
              id="import-limit"
              type="number"
              min={1}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Usar dataset sample</p>
              <p className="text-xs text-muted-foreground">
                Quando ativo, não depende do arquivo de preview real.
              </p>
            </div>
            <Switch checked={sample} onCheckedChange={setSample} disabled={isRunning} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-user-id">Owner User ID (obrigatório em apply)</Label>
            <Input
              id="owner-user-id"
              value={ownerUserId}
              onChange={(event) => setOwnerUserId(event.target.value)}
              placeholder="UUID do usuário dono dos perfis importados"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={isRunning}
              onClick={() => {
                void runImport("dry-run");
              }}
            >
              {isRunning && mode === "dry-run" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              Executar Dry-run
            </Button>
            <Button
              disabled={isRunning}
              onClick={() => {
                void runImport("apply");
              }}
            >
              {isRunning && mode === "apply" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              Executar Apply
            </Button>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title="Resposta do endpoint"
          description="Inspeção rápida do payload retornado pela API."
          icon={Database}
          contentClassName="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Badge variant="outline">HTTP via /api/admin/google-places-import</Badge>
            {response?.ok ? <Badge className="bg-emerald-600">OK</Badge> : null}
            {response?.error ? <Badge variant="destructive">Erro</Badge> : null}
          </div>
          <Textarea value={rawResponse} readOnly className="min-h-[360px] font-mono text-xs" />
        </AdminSectionCard>
      </div>
    </div>
  );
}
