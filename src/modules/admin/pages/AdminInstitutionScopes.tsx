import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  ExternalLink,
  Loader2,
  Network,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  adminBusinessService,
  type BusinessInstitutionScopeAdminModel,
  type GrantBusinessInstitutionScopeInput,
} from "@/core/admin";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";

type AuthorityKind = GrantBusinessInstitutionScopeInput["authorityKind"];

const AUTHORITY_KIND_LABELS: Record<AuthorityKind, string> = {
  maintainer: "Mantenedora",
  municipal_secretariat: "Secretaria municipal",
  state_secretariat: "Secretaria estadual",
  federal_authority: "Autoridade federal",
  education_network: "Rede de educação",
  public_agency: "Órgão público",
};

const AUTHORITY_KINDS = Object.keys(
  AUTHORITY_KIND_LABELS,
) as AuthorityKind[];

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
}

function suggestedKindForNetwork(
  network: string | null,
): AuthorityKind | null {
  if (network === "municipal") return "municipal_secretariat";
  if (network === "state") return "state_secretariat";
  if (network === "federal") return "federal_authority";
  return null;
}

export default function AdminInstitutionScopes() {
  const [model, setModel] =
    useState<BusinessInstitutionScopeAdminModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [authorityProfileId, setAuthorityProfileId] = useState("");
  const [targetProfileId, setTargetProfileId] = useState("");
  const [authorityKind, setAuthorityKind] =
    useState<AuthorityKind>("municipal_secretariat");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [revocationReasons, setRevocationReasons] = useState<
    Record<string, string>
  >({});

  const loadModel = useCallback(async () => {
    setLoading(true);
    const next = await adminBusinessService.getInstitutionScopeAdminModel();
    setModel(next);
    setLoading(false);

    if (!next) {
      toast.error("Não foi possível carregar as autoridades institucionais.");
    }
  }, []);

  useEffect(() => {
    void loadModel();
  }, [loadModel]);

  const activeScopes = useMemo(
    () => model?.scopes.filter((scope) => scope.is_active) ?? [],
    [model],
  );
  const revokedScopes = useMemo(
    () => model?.scopes.filter((scope) => !scope.is_active) ?? [],
    [model],
  );

  const selectedSchool = model?.schools.find(
    (school) => school.profile_id === targetProfileId,
  );

  const handleSchoolChange = (profileId: string) => {
    setTargetProfileId(profileId);
    const school = model?.schools.find(
      (candidate) => candidate.profile_id === profileId,
    );
    const suggested = suggestedKindForNetwork(school?.school_network ?? null);
    if (suggested) {
      setAuthorityKind(suggested);
    }
  };

  const canGrant =
    authorityProfileId.length > 0 &&
    targetProfileId.length > 0 &&
    authorityProfileId !== targetProfileId &&
    isHttpUrl(evidenceUrl.trim()) &&
    grantReason.trim().length >= 10 &&
    !processing;

  const handleGrant = async () => {
    if (!canGrant) return;

    setProcessing(true);
    const scopeId = await adminBusinessService.grantInstitutionScope({
      authorityProfileId,
      targetProfileId,
      authorityKind,
      evidenceUrl: evidenceUrl.trim(),
      grantReason: grantReason.trim(),
    });
    setProcessing(false);

    if (!scopeId) {
      toast.error(
        "Não foi possível conceder a autoridade. Revise a rede da escola e a evidência.",
      );
      return;
    }

    toast.success("Autoridade institucional concedida.");
    setTargetProfileId("");
    setEvidenceUrl("");
    setGrantReason("");
    await loadModel();
  };

  const handleRevoke = async (scopeId: string) => {
    const reason = revocationReasons[scopeId]?.trim() ?? "";
    if (reason.length < 10) {
      toast.error("Informe um motivo de revogação com pelo menos 10 caracteres.");
      return;
    }

    setProcessing(true);
    const ok = await adminBusinessService.revokeInstitutionScope(
      scopeId,
      reason,
    );
    setProcessing(false);

    if (!ok) {
      toast.error("Não foi possível revogar a autoridade institucional.");
      return;
    }

    toast.success("Autoridade institucional revogada.");
    setRevocationReasons((current) => {
      const next = { ...current };
      delete next[scopeId];
      return next;
    });
    await loadModel();
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Autoridade institucional
            </CardTitle>
            <CardDescription className="mt-1">
              Conceda a uma mantenedora, Prefeitura ou Secretaria gestão
              herdada e revogável sobre escolas públicas, sem duplicar pessoas
              e acessos em cada escola.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadModel()}
            disabled={loading || processing}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : !model ? (
          <p className="text-sm text-muted-foreground">
            O read model administrativo não está disponível.
          </p>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Autoridade</Label>
                <Select
                  value={authorityProfileId}
                  onValueChange={setAuthorityProfileId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a Prefeitura, Secretaria ou mantenedora" />
                  </SelectTrigger>
                  <SelectContent>
                    {model.authorities.map((authority) => (
                      <SelectItem
                        key={authority.profile_id}
                        value={authority.profile_id}
                      >
                        {authority.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {model.authorities.length} perfis empresariais elegíveis.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Escola pública</Label>
                <Select
                  value={targetProfileId}
                  onValueChange={handleSchoolChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {model.schools.map((school) => (
                      <SelectItem
                        key={school.profile_id}
                        value={school.profile_id}
                      >
                        {school.name}
                        {school.school_network
                          ? ` · ${school.school_network}`
                          : ""}
                        {school.inep_code ? ` · INEP ${school.inep_code}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {model.schools.length} escolas públicas disponíveis.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tipo de autoridade</Label>
                <Select
                  value={authorityKind}
                  onValueChange={(value) =>
                    setAuthorityKind(value as AuthorityKind)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTHORITY_KINDS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {AUTHORITY_KIND_LABELS[kind]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSchool?.school_network ? (
                  <p className="text-xs text-muted-foreground">
                    Rede da escola: {selectedSchool.school_network}.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution-evidence-url">
                  Fonte pública oficial
                </Label>
                <Input
                  id="institution-evidence-url"
                  value={evidenceUrl}
                  onChange={(event) => setEvidenceUrl(event.target.value)}
                  placeholder="https://..."
                  maxLength={2048}
                />
                <p className="text-xs text-muted-foreground">
                  Use uma página pública que comprove a relação institucional.
                  Não envie dados pessoais de alunos ou funcionários.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution-grant-reason">
                Justificativa da concessão
              </Label>
              <Textarea
                id="institution-grant-reason"
                value={grantReason}
                onChange={(event) => setGrantReason(event.target.value)}
                minLength={10}
                maxLength={1000}
                placeholder="Registre como a autoridade foi verificada e por que este escopo deve existir."
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Network className="h-4 w-4" />
                A concessão não transfere o proprietário estrutural da escola.
              </div>
              <Button onClick={() => void handleGrant()} disabled={!canGrant}>
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Conceder autoridade
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">
                  Autoridades ativas ({activeScopes.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Revogar corta a herança de gestão imediatamente.
                </p>
              </div>

              {activeScopes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhuma autoridade institucional concedida.
                </div>
              ) : (
                activeScopes.map((scope) => (
                  <div
                    key={scope.scope_id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {scope.authority_name}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span>{scope.target_name}</span>
                          <Badge variant="outline">
                            {AUTHORITY_KIND_LABELS[scope.authority_kind]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Concedida em {formatDate(scope.granted_at)}
                          {scope.inep_code ? ` · INEP ${scope.inep_code}` : ""}
                        </p>
                      </div>
                      <a
                        href={scope.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Evidência
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {scope.grant_reason}
                    </p>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={revocationReasons[scope.scope_id] ?? ""}
                        onChange={(event) =>
                          setRevocationReasons((current) => ({
                            ...current,
                            [scope.scope_id]: event.target.value,
                          }))
                        }
                        maxLength={1000}
                        placeholder="Motivo da revogação (mín. 10 caracteres)"
                      />
                      <Button
                        variant="destructive"
                        disabled={
                          processing ||
                          (revocationReasons[scope.scope_id]?.trim().length ??
                            0) < 10
                        }
                        onClick={() => void handleRevoke(scope.scope_id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Revogar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {revokedScopes.length > 0 ? (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">
                    Histórico revogado ({revokedScopes.length})
                  </h3>
                  {revokedScopes.slice(0, 20).map((scope) => (
                    <div
                      key={scope.scope_id}
                      className="rounded-lg border bg-muted/30 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">
                          {scope.authority_name}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span>{scope.target_name}</span>
                        <Badge variant="secondary">Revogada</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(scope.revoked_at)} ·{" "}
                        {scope.revocation_reason ?? "Sem motivo registrado"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
