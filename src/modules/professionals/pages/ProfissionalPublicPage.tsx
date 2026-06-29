/**
 * Pagina publica de profissional
 * Rota: /servicos/:state/:city/profissional/:slug
 *
 * Contrato publico seguro:
 * - nome publico, slug, bio/descricao
 * - avatar/imagem publica
 * - localizacao publica coarse
 * - categorias/servicos publicos
 * - sem ids internos, email ou telefone por padrao
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Briefcase, Clock, MapPin, Send } from "lucide-react";
import { professionalPublicRoutes } from "@/core/professional/routes/professionalPublicRoutes";
import { logPageNotFound } from "@/core/public-identity/utils/identity-logger";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ProfessionalLeadRequestDialog } from "../components/ProfessionalLeadRequestDialog";
import { useProfessionalBySlug } from "../hooks/useProfessionalBySlug";

export default function ProfissionalPublicPage() {
  const { state, city, slug } = useParams<{ state: string; city: string; slug: string }>();
  const navigate = useNavigate();
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);

  const { data: professional, isLoading, error } = useProfessionalBySlug({
    uf: state ?? "",
    cidade: city ?? "",
    slug: slug ?? "",
  });

  useEffect(() => {
    if (!isLoading && (error || !professional) && slug && state && city) {
      logPageNotFound({
        entityType: "professional",
        identifier: slug,
        attemptedUrl: professionalPublicRoutes.detail({
          state,
          city,
          slug,
        }),
      });
    }
  }, [city, error, isLoading, professional, slug, state]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto w-full max-w-3xl">
            <Skeleton className="h-10 w-40 rounded-full" />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-6">
          <div className="rounded-[28px] border bg-card p-5">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-32 w-full rounded-[28px]" />
          <Skeleton className="h-32 w-full rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <p className="mb-4 text-lg text-muted-foreground">Profissional nao encontrado.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const initials = professional.name
    .split(" ")
    .slice(0, 2)
    .map((namePart) => namePart[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Servicos locais
            </p>
            <h1 className="truncate text-base font-bold sm:text-lg">Perfil profissional</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-5">
        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Avatar className="h-24 w-24 border border-border shadow-sm">
              <AvatarImage src={professional.logo_url ?? undefined} alt={professional.name} />
              <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-bold leading-tight sm:text-2xl">{professional.name}</h2>
                {professional.is_verified ? (
                  <BadgeCheck className="h-5 w-5 text-sky-500" aria-label="Verificado" />
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {professional.category ? (
                  <Badge variant="secondary" className="capitalize">
                    {professional.subcategory ?? professional.category}
                  </Badge>
                ) : null}

                {professional.is_accepting_clients ? (
                  <Badge variant="outline" className="border-emerald-600 text-emerald-600">
                    Aceitando clientes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Nao aceitando clientes
                  </Badge>
                )}
              </div>

              {professional.city || professional.state ? (
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{[professional.city, professional.state].filter(Boolean).join(", ")}</span>
                </div>
              ) : null}
            </div>

            <div className="w-full max-w-md space-y-2 pt-1">
              <Button
                className="h-11 w-full"
                onClick={() => setLeadDialogOpen(true)}
                disabled={!professional.is_accepting_clients}
              >
                <Send className="mr-2 h-4 w-4" />
                Solicitar orcamento
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Pedido enviado para a central do profissional, sem expor contato publico.
              </p>
            </div>
          </div>
        </section>

        {professional.description ? (
          <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Sobre o profissional
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {professional.description}
            </p>
          </section>
        ) : null}

        <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Informacoes publicas
          </p>

          <div className="mt-4 grid gap-3">
            {professional.experience_years != null ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/70 px-4 py-3 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{professional.experience_years} anos de experiencia</span>
              </div>
            ) : null}

            {professional.price_range ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/70 px-4 py-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Faixa de preco: {professional.price_range}</span>
              </div>
            ) : null}
          </div>

          {professional.certifications && professional.certifications.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {professional.certifications.map((cert) => (
                <Badge key={cert} variant="outline" className="text-xs">
                  {cert}
                </Badge>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <ProfessionalLeadRequestDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        professionalId={professional.id}
        professionalName={professional.name}
        defaultService={professional.subcategory ?? professional.category}
        sourceChannel="public_profile"
      />
    </div>
  );
}
