import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Globe2,
  Settings,
  Store,
} from "lucide-react";

import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { Button } from "@/shared/components/ui/button";

function getStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Ativa";
    case "pending":
      return "Em análise";
    case "suspended":
      return "Suspensa";
    case "inactive":
      return "Inativa";
    default:
      return status;
  }
}

export default function BusinessOverviewPage() {
  const { businessId, business, publicUrl } =
    useActiveBusinessDashboardContext();

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-border bg-card">
        <div className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Store className="h-3.5 w-3.5" />
                Gestão da empresa
              </div>
              <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {business.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Atualize as informações da empresa e acompanhe como ela aparece para quem busca no bairro.
              </p>
            </div>

            {publicUrl ? (
              <Link to={publicUrl}>
                <Button className="w-full gap-2 sm:w-auto">
                  Ver página pública
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-px bg-border md:grid-cols-3">
          <div className="bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Situação
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {getStatusLabel(business.status)}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
          </div>

          <div className="bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Categoria
                </p>
                <p className="mt-2 truncate text-lg font-semibold capitalize text-foreground">
                  {business.category}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </span>
            </div>
          </div>

          <div className="bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Página pública
                </p>
                <p className="mt-2 truncate text-lg font-semibold text-foreground">
                  {business.slug ? `@${business.slug}` : "Ainda não configurada"}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                <Globe2 className="h-5 w-5" />
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-border bg-card p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground">Ações rápidas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mantenha sua empresa completa e pronta para ser encontrada.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Link
            to={businessManagementRoutes.dados(businessId)}
            className="group rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/25 hover:bg-primary/[0.03]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">Dados da empresa</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Nome, categoria, contato, endereço e informações públicas.
            </p>
          </Link>

          <Link
            to={businessManagementRoutes.configuracoes(businessId)}
            className="group rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/25 hover:bg-primary/[0.03]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Settings className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">Configurações</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Edição completa, equipe e permissões de acesso à empresa.
            </p>
          </Link>

          {publicUrl ? (
            <Link
              to={publicUrl}
              className="group rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/25 hover:bg-primary/[0.03] sm:col-span-2 xl:col-span-1"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Globe2 className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Página pública</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Veja a experiência que moradores encontram no Achegue-se.
              </p>
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
