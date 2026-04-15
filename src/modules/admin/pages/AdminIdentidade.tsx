import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Eye,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Star,
  UserCog,
} from "lucide-react";
import {
  adminProfileGovernanceService,
  type AdminProfileFamilySummary,
  type AdminProfileIdentityDetail,
  type AdminProfileIdentityIssue,
  type AdminProfilePreferenceFieldSummary,
  type AdminProfilePreferenceScopeSummary,
  type AdminProfilePermissionGovernanceSummary,
  type AdminProfileReputationSourceSummary,
  type AdminProfileResidenceSummary,
} from "@/core/admin";
import {
  AdminDataState,
  AdminErrorState,
  AdminFiltersBar,
  AdminPageHeader,
  AdminPagination,
  AdminSectionCard,
  AdminStatsCard,
  AdminStatsGrid,
  AdminTable,
  type FilterOption,
} from "@/modules/admin/components";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function issueLabel(issue: AdminProfileIdentityIssue) {
  return {
    public_without_username: "Publico sem username",
    public_unverified: "Publico sem verificacao",
    suspended: "Suspenso",
    inactive: "Inativo",
    multi_profile: "Conta multi-profile",
    missing_preferences: "Sem preferencias",
  }[issue];
}

function issueBadge(issue: AdminProfileIdentityIssue) {
  if (issue === "public_without_username" || issue === "suspended") {
    return <Badge variant="destructive">{issueLabel(issue)}</Badge>;
  }

  if (issue === "public_unverified") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">{issueLabel(issue)}</Badge>;
  }

  return <Badge variant="secondary">{issueLabel(issue)}</Badge>;
}

function statusBadge(profile: {
  isPublic: boolean;
  isActive: boolean;
  isSuspended: boolean;
  isVerified: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {profile.isPublic ? (
        <Badge className="bg-sky-600 hover:bg-sky-600">Publico</Badge>
      ) : (
        <Badge variant="outline">Privado</Badge>
      )}
      {profile.isSuspended ? (
        <Badge variant="destructive">Suspenso</Badge>
      ) : profile.isActive ? (
        profile.isVerified ? (
          <Badge className="bg-emerald-600 hover:bg-emerald-600">Verificado</Badge>
        ) : (
          <Badge variant="outline">Ativo</Badge>
        )
      ) : (
        <Badge variant="secondary">Inativo</Badge>
      )}
    </div>
  );
}

function planBadge(plan: string) {
  if (plan === "premium" || plan === "enterprise") {
    return <Badge className="bg-violet-600 hover:bg-violet-600">{plan}</Badge>;
  }

  if (plan === "basic") {
    return <Badge variant="secondary">basic</Badge>;
  }

  return <Badge variant="outline">{plan}</Badge>;
}

function preferenceScopeBadge(scope: AdminProfilePreferenceScopeSummary) {
  if (scope.status === "configured") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Configurado</Badge>;
  }

  if (scope.status === "partial") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">Parcial</Badge>;
  }

  return <Badge variant="destructive">Sem cobertura</Badge>;
}

function preferenceFieldBadge(field: AdminProfilePreferenceFieldSummary) {
  if (field.state === "enabled") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">{field.label}</Badge>;
  }

  if (field.state === "disabled") {
    return <Badge variant="secondary">{field.label}</Badge>;
  }

  if (field.state === "unset") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">{field.label}</Badge>;
  }

  return <Badge variant="outline">{field.label}</Badge>;
}

function reputationSourceBadge(source: AdminProfileReputationSourceSummary) {
  if (source.status === "canonical") {
    return <Badge className="bg-sky-600 hover:bg-sky-600">Canonico</Badge>;
  }

  if (source.status === "legacy") {
    return <Badge className="bg-amber-600 hover:bg-amber-600">Legado controlado</Badge>;
  }

  if (source.status === "derived") {
    return <Badge variant="secondary">Derivado</Badge>;
  }

  return <Badge variant="outline">Sem sinal</Badge>;
}

function reputationVisibilityBadge(source: AdminProfileReputationSourceSummary) {
  if (source.visibility === "public") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Publico</Badge>;
  }

  if (source.visibility === "private") {
    return <Badge variant="secondary">Privado</Badge>;
  }

  return <Badge variant="outline">Interno</Badge>;
}

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return value.toFixed(1);
}

function residenceStatusBadge(residence: AdminProfileResidenceSummary | null) {
  if (!residence) {
    return <Badge variant="outline">Sem residencia canonica</Badge>;
  }

  if (residence.status === "verified") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Verificada</Badge>;
  }

  if (residence.status === "pending_verification") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">Verificacao pendente</Badge>;
  }

  return <Badge variant="secondary">Nao verificada</Badge>;
}

function familyStatusBadge(family: AdminProfileFamilySummary) {
  if (family.status === "available") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Coberto</Badge>;
  }

  if (family.status === "empty") {
    return <Badge variant="secondary">Sem vinculos</Badge>;
  }

  return <Badge className="bg-orange-500 hover:bg-orange-500">Nao modelado localmente</Badge>;
}

function permissionGovernanceBadge(
  permissionGovernance: AdminProfilePermissionGovernanceSummary | null,
) {
  if (!permissionGovernance) {
    return <Badge variant="outline">Sem snapshot</Badge>;
  }

  if (permissionGovernance.status === "active") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Ativo</Badge>;
  }

  if (permissionGovernance.status === "limited") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">Limitado</Badge>;
  }

  return <Badge variant="destructive">Bloqueado</Badge>;
}

function permissionActionBadge(
  status: AdminProfilePermissionGovernanceSummary["actionMatrix"][number]["status"],
) {
  if (status === "allowed") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">allowed</Badge>;
  }

  if (status === "requiresTarget") {
    return <Badge variant="secondary">requires target</Badge>;
  }

  return <Badge variant="outline">denied</Badge>;
}

function DetailView({
  detail,
  loading,
}: {
  detail: AdminProfileIdentityDetail | null | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Nao foi possivel carregar o detalhe desta identidade.
      </div>
    );
  }

  return (
    <div className="grid max-h-[75vh] gap-4 overflow-y-auto pr-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Identidade</CardTitle>
          <CardDescription>Leitura publica e privada do perfil selecionado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {statusBadge(detail.profile)}
          <div>
            <span className="text-muted-foreground">Nome:</span> {detail.profile.name}
          </div>
          <div>
            <span className="text-muted-foreground">Display:</span>{" "}
            {detail.profile.displayName || "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Tipo:</span>{" "}
            {label(detail.profile.profileType)}
          </div>
          <div>
            <span className="text-muted-foreground">Username:</span>{" "}
            {detail.profile.username ? `@${detail.profile.username}` : "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Rota publica:</span>{" "}
            {detail.profile.publicUrl || "Nao exposta"}
          </div>
          <div>
            <span className="text-muted-foreground">User ID:</span>{" "}
            <span className="font-mono text-xs">{detail.profile.userId}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Profile ID:</span>{" "}
            <span className="font-mono text-xs">{detail.profile.id}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span> {detail.auth?.email || "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Telefone:</span> {detail.auth?.phone || "-"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Governanca</CardTitle>
          <CardDescription>Snapshot efetivo da conta e cobertura administrativa atual.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {planBadge(detail.profile.activePlan)}
            <Badge variant="outline">{detail.profile.subscriptionStatus}</Badge>
            {detail.roles.map((role) => (
              <Badge key={role.id} variant="outline">
                {role.role}
              </Badge>
            ))}
          </div>
          <div>
            <span className="text-muted-foreground">Reputacao:</span>{" "}
            {detail.effectiveContext?.reputation.score ?? detail.profile.reputation}
          </div>
          <div>
            <span className="text-muted-foreground">Origens reputacionais:</span>{" "}
            {
              detail.reputationSources.filter(
                (source) =>
                  source.origin !== "profile_aggregate" && source.status !== "missing",
              ).length
            }
          </div>
          <div>
            <span className="text-muted-foreground">Escopos configurados:</span>{" "}
            {detail.preferenceScopes.filter((scope) => scope.status === "configured").length}/
            {detail.preferenceScopes.length}
          </div>
          <div>
            <span className="text-muted-foreground">Residencia canonica:</span>{" "}
            {detail.residence ? "sim" : "nao"}
          </div>
          <div>
            <span className="text-muted-foreground">Familia:</span>{" "}
            {detail.family.activeChildrenCount + detail.family.activeParentsCount}
            {" "}vinculo(s) ativo(s)
          </div>
          <div>
            <span className="text-muted-foreground">Perfis nesta conta:</span>{" "}
            {detail.siblingProfiles.length}
          </div>
          <div>
            <span className="text-muted-foreground">Entidades vinculadas:</span>{" "}
            {detail.linkedEntities.length}
          </div>
          <div>
            <span className="text-muted-foreground">Mudancas de username:</span>{" "}
            {detail.usernameHistory.length}
          </div>
          <div>
            <span className="text-muted-foreground">Permissoes:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {detail.effectiveContext ? (
              Object.entries(detail.effectiveContext.permissions).map(([key, value]) => (
                <Badge key={key} variant={value ? "secondary" : "outline"}>
                  {key}
                </Badge>
              ))
            ) : (
              <Badge variant="outline">Sem snapshot</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vinculos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {detail.linkedEntities.length ? (
            detail.linkedEntities.map((entity) => (
              <div key={`${entity.kind}-${entity.id}`} className="rounded-lg border p-3">
                <div className="font-medium">{entity.title}</div>
                <div className="text-muted-foreground">{entity.subtitle || label(entity.kind)}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{entity.status}</Badge>
                  {entity.metadata.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
              Nenhuma entidade vinculada.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historico de username</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            {detail.usernameHistory.length ? (
              detail.usernameHistory.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  @{item.old_username} {"->"} @{item.new_username}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
                Sem historico de username.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entidades secundarias</CardTitle>
          <CardDescription>Coverage atual de residencia canonica e family no centro de identidade.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="font-medium">Residencia</div>
                <div className="text-xs text-muted-foreground">
                  {detail.residence?.locationName || "Sem territorio principal"}
                </div>
              </div>
              {residenceStatusBadge(detail.residence)}
            </div>

            {detail.residence ? (
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div>{detail.residence.addressLine || "Endereco detalhado indisponivel"}</div>
                <div>
                  {detail.residence.postalCode || "CEP nao informado"} -{" "}
                  {detail.residence.country || "Pais nao informado"}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-xs text-muted-foreground">
                Nenhuma residencia primaria canonica vinculada ao usuario.
              </div>
            )}
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="font-medium">Family</div>
                <div className="text-xs text-muted-foreground">
                  {detail.family.activeChildrenCount} filho(s) ativos - {detail.family.activeParentsCount} responsavel(is)
                </div>
              </div>
              {familyStatusBadge(detail.family)}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">
                pendentes: {detail.family.pendingInvitesCount}
              </Badge>
              {detail.family.relationshipTypes.map((relationshipType) => (
                <Badge key={relationshipType} variant="secondary">
                  {relationshipType}
                </Badge>
              ))}
            </div>

            {detail.family.notes.length ? (
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {detail.family.notes.map((note) => (
                  <div key={note}>{note}</div>
                ))}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reputacao por origem</CardTitle>
          <CardDescription>Decomposicao canonicamente auditada no agregado admin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {detail.reputationSources.map((source) => (
            <div key={source.origin} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="font-medium">{source.label}</div>
                  <div className="text-xs text-muted-foreground">
                    Score {formatScore(source.score)} - volume {source.volume}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reputationSourceBadge(source)}
                  {reputationVisibilityBadge(source)}
                </div>
              </div>

              {source.notes.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {source.notes.map((note) => (
                    <Badge key={`${source.origin}-${note}`} variant="outline">
                      {note}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias por escopo</CardTitle>
          <CardDescription>Separacao entre perfil publico, vinculos, reputacao e notificacoes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {detail.preferenceScopes.map((scope) => (
            <div key={scope.scope} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="font-medium">{scope.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {scope.configuredFields}/{scope.applicableFields} campo(s) aplicaveis configurados
                  </div>
                </div>
                {preferenceScopeBadge(scope)}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {scope.fields.map((field) => (
                  <span key={`${scope.scope}-${field.key}`}>{preferenceFieldBadge(field)}</span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissoes efetivas</CardTitle>
          <CardDescription>Snapshot atual do AuthorizationEngine e das fontes administrativas do perfil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {permissionGovernanceBadge(detail.permissionGovernance)}
            {detail.permissionGovernance?.sourceRoles.map((role) => (
              <Badge key={`role-${role}`} variant="outline">
                {role}
              </Badge>
            ))}
            {detail.permissionGovernance?.sourceMembershipRoles.map((role) => (
              <Badge key={`membership-${role}`} variant="secondary">
                membership:{role}
              </Badge>
            ))}
          </div>

          {detail.permissionGovernance ? (
            <>
              <div className="text-xs text-muted-foreground">
                {detail.permissionGovernance.allowedActions} allowed -{" "}
                {detail.permissionGovernance.deniedActions} denied -{" "}
                {detail.permissionGovernance.targetDependentActions} dependem de target
              </div>

              <div className="space-y-2">
                {detail.permissionGovernance.actionMatrix.map((action) => (
                  <div
                    key={action.action}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="font-medium">{action.action}</div>
                    {permissionActionBadge(action.status)}
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                {detail.permissionGovernance.notes.map((note) => (
                  <div key={note}>{note}</div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
              Nao foi possivel carregar o snapshot de permissoes efetivas.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminIdentidade() {
  const [search, setSearch] = useState("");
  const [profileType, setProfileType] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const statsQuery = useQuery({
    queryKey: ["admin-profile-identity-stats"],
    queryFn: () => adminProfileGovernanceService.getStats(),
  });

  const profilesQuery = useQuery({
    queryKey: ["admin-profile-identity-list", page, search, profileType, visibility],
    queryFn: () =>
      adminProfileGovernanceService.getProfiles({
        page,
        limit: 20,
        search: search || undefined,
        profileType: profileType || undefined,
        visibility: visibility as "all" | "public" | "private",
      }),
  });

  const detailQuery = useQuery({
    queryKey: ["admin-profile-identity-detail", selectedProfileId],
    queryFn: () => adminProfileGovernanceService.getProfileDetail(selectedProfileId!),
    enabled: Boolean(selectedProfileId),
  });

  const filters = useMemo<FilterOption[]>(
    () => [
      {
        label: "Tipo",
        value: "profileType",
        placeholder: "Todos os tipos",
        options: [
          { label: "Pessoal", value: "personal" },
          { label: "Empresa", value: "business" },
          { label: "Profissional", value: "professional" },
          { label: "Motorista", value: "driver" },
        ],
      },
      {
        label: "Visibilidade",
        value: "visibility",
        placeholder: "Todos os perfis",
        options: [
          { label: "Publicos", value: "public" },
          { label: "Privados", value: "private" },
        ],
      },
    ],
    [],
  );

  const pageData = profilesQuery.data;
  const stats = statsQuery.data;
  const isRefreshing =
    statsQuery.isFetching || profilesQuery.isFetching || detailQuery.isFetching;
  const retryAll = () => {
    void statsQuery.refetch();
    void profilesQuery.refetch();
    if (selectedProfileId) {
      void detailQuery.refetch();
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Governanca de Identidade"
        description="Cobertura administrativa oficial para profile como centro de identidade do ecossistema."
        icon={UserCog}
        actions={
          <Button
            variant="outline"
            onClick={retryAll}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
        }
      />

      <AdminStatsGrid>
        <AdminStatsCard
          title="Perfis totais"
          value={statsQuery.isError ? "--" : stats?.totalProfiles || 0}
          subtitle={
            statsQuery.isError
              ? "Falha ao carregar snapshot"
              : `${stats?.publicProfiles || 0} publicos e ${stats?.privateProfiles || 0} privados`
          }
          icon={UserCog}
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Username em risco"
          value={statsQuery.isError ? "--" : stats?.publicWithoutUsername || 0}
          subtitle={
            statsQuery.isError
              ? "Falha ao carregar risco"
              : `${stats?.missingUsername || 0} perfis sem username`
          }
          icon={AlertTriangle}
          iconColor="text-red-600"
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Contas multi-profile"
          value={statsQuery.isError ? "--" : stats?.multiProfileUsers || 0}
          subtitle={
            statsQuery.isError
              ? "Falha ao carregar vinculos"
              : `${stats?.withLinkedEntities || 0} perfis com vinculos`
          }
          icon={ShieldCheck}
          iconColor="text-violet-600"
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Residencias auditaveis"
          value={statsQuery.isError ? "--" : stats?.withResidence || 0}
          subtitle={
            statsQuery.isError
              ? "Falha ao carregar residencias"
              : `${stats?.withVerifiedResidence || 0} verificadas`
          }
          icon={MapPin}
          iconColor="text-sky-600"
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Escopos configurados"
          value={statsQuery.isError ? "--" : stats?.withScopedPreferences || 0}
          subtitle={
            statsQuery.isError
              ? "Falha ao carregar preferencias"
              : `${stats?.withNotificationScope || 0} com notificacoes configuradas`
          }
          icon={ShieldCheck}
          iconColor="text-emerald-600"
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Reputacao rastreavel"
          value={statsQuery.isError ? "--" : stats?.withExternalReputation || 0}
          subtitle={
            statsQuery.isError
              ? "Falha ao carregar reputacao"
              : `${stats?.withMultiOriginReputation || 0} perfis com 2+ origens`
          }
          icon={Star}
          iconColor="text-amber-600"
          loading={statsQuery.isLoading}
        />
      </AdminStatsGrid>

      <AdminFiltersBar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Buscar por nome, username ou user_id"
        filters={filters}
        filterValues={{
          profileType,
          visibility: visibility === "all" ? "" : visibility,
        }}
        onFilterChange={(key, value) => {
          if (key === "profileType") {
            setProfileType(value);
          }

          if (key === "visibility") {
            setVisibility(value || "all");
          }

          setPage(1);
        }}
        onClear={() => {
          setSearch("");
          setProfileType("");
          setVisibility("all");
          setPage(1);
        }}
      />

      {statsQuery.isError ? (
        <AdminErrorState
          title="Falha ao carregar estatisticas de identidade"
          description="O agregado canonico de `profile` nao retornou o snapshot administrativo nesta tentativa."
          onRetry={() => {
            void statsQuery.refetch();
          }}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
        <AdminSectionCard
          title="Fila de identidade"
          description="Leitura administrativa canonica do dominio `profile`, cobrindo exposicao publica, governanca da conta e riscos estruturais."
          icon={UserCog}
        >
          {profilesQuery.isError ? (
            <AdminErrorState
              title="Falha ao carregar a fila de identidade"
              description="A leitura canonica de perfis nao ficou disponivel para o admin nesta tentativa."
              onRetry={() => {
                void profilesQuery.refetch();
              }}
            />
          ) : (
            <AdminDataState
              loading={profilesQuery.isLoading}
              isEmpty={!profilesQuery.isLoading && !pageData?.data.length}
              emptyTitle="Nenhum perfil encontrado"
              emptyDescription="Nenhum perfil corresponde aos filtros atuais."
            >
              <AdminTable
                footer={
                  <AdminPagination
                    currentPage={page}
                    totalPages={pageData?.totalPages || 1}
                    totalItems={pageData?.total || 0}
                    itemsPerPage={20}
                    onPageChange={setPage}
                  />
                }
              >
                <TableHeader>
                  <TableRow>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Governanca</TableHead>
                    <TableHead>Riscos</TableHead>
                    <TableHead className="text-right">Detalhe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData?.data.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="min-w-[260px]">
                        <div className="space-y-1">
                          <div className="font-medium">{profile.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {label(profile.profileType)}
                            {profile.username ? ` - @${profile.username}` : " - sem username"}
                          </div>
                          <div>{statusBadge(profile)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {planBadge(profile.activePlan)}
                            {profile.roles.map((role) => (
                              <Badge key={role} variant="outline">
                                {role}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {profile.accountProfileCount} perfil(is) - {profile.linkedEntityCount}{" "}
                            vinculo(s) - {profile.usernameHistoryCount} mudanca(s)
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="flex flex-wrap gap-2">
                          {profile.issues.length ? (
                            profile.issues.map((issue) => (
                              <span key={`${profile.id}-${issue}`}>{issueBadge(issue)}</span>
                            ))
                          ) : (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600">
                              Sem risco imediato
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProfileId(profile.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </AdminTable>
            </AdminDataState>
          )}
        </AdminSectionCard>

        <AdminSectionCard
          title="Leitura objetiva"
          description="Resumo do que esta coberto agora e do que ainda precisa entrar na governanca canonica."
          icon={ShieldCheck}
          contentClassName="space-y-2 text-sm text-muted-foreground"
        >
          <p>
            A superficie cobre identidade publica x privada, `username`, plano atual,
            roles, vinculos, reputacao por origem, preferencias por escopo,
            residencia canonica e snapshot de permissoes efetivas.
          </p>
          <p>
            O que ainda falta: hardening canonicamente documentado de `family`,
            derivados residuais de identidade e historico administrativo formal de permissoes.
          </p>
        </AdminSectionCard>
      </div>

      <Dialog
        open={Boolean(selectedProfileId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProfileId(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Governanca de identidade</DialogTitle>
          </DialogHeader>
          {detailQuery.isError ? (
            <AdminErrorState
              title="Falha ao carregar detalhe da identidade"
              description="O detalhe administrativo deste perfil nao foi retornado pelo dominio `profile`."
              onRetry={() => {
                void detailQuery.refetch();
              }}
            />
          ) : (
            <DetailView detail={detailQuery.data} loading={detailQuery.isLoading} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

