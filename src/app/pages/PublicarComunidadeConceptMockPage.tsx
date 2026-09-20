import { useEffect, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  ImagePlus,
  Info,
  MapPin,
  MessageCircle,
  Megaphone,
  Search,
  Menu,
  ShieldCheck,
  Star,
  Tag,
  UsersRound,
  Wrench,
} from "lucide-react";

import personalImage from "@/assets/persona-comerciante.jpg";
import { cn } from "@/shared/utils/cn";

const QUERY = "?concept-mock=1";
type PublishView =
  | "participate"
  | "types"
  | "alert"
  | "problem"
  | "communication"
  | "review"
  | "module";
type PublishStatus = "verified" | "pending" | "none";

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to={`/${QUERY}`}
      className={cn(
        "whitespace-nowrap font-heading text-[1.5rem] font-bold tracking-[-0.06em]",
        light ? "text-white" : "text-territory-brand",
      )}
      aria-label="Achegue-se — início"
    >
      achegue-se<span className="text-territory-sun">.</span>
    </Link>
  );
}

function getInitial(location: { search: string }): {
  view: PublishView;
  status: PublishStatus;
} {
  const params = new URLSearchParams(location.search);
  const requested = params.get("view");
  const view: PublishView = [
    "types",
    "alert",
    "problem",
    "communication",
    "review",
    "module",
  ].includes(requested ?? "")
    ? (requested as PublishView)
    : "participate";
  const status: PublishStatus =
    params.get("status") === "pending"
      ? "pending"
      : params.get("status") === "verified"
        ? "verified"
        : "none";
  return { view, status };
}

function Shell({
  children,
  onView,
}: {
  children: ReactNode;
  onView: (next: PublishView) => void;
}) {
  const navItems = [
    {
      label: "Início",
      icon: MapPin,
      target: "/ba/salvador/complexo-do-nordeste-de-amaralina",
    },
    { label: "Publicar", icon: Star, target: `/novo-post${QUERY}` },
    {
      label: "Explorar",
      icon: Search,
      target: "/busca/ba/salvador/complexo-do-nordeste-de-amaralina",
    },
    { label: "Mensagens", icon: MessageCircle, target: `/mensagens${QUERY}` },
    {
      label: "Meu território",
      icon: UsersRound,
      target: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
    },
    { label: "Meu perfil", icon: UsersRound, target: `/conta${QUERY}` },
  ];
  return (
    <div className="min-h-[100dvh] bg-territory-canvas text-territory-ink">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1536px] lg:border-x lg:border-territory-border">
        <aside className="hidden w-[160px] shrink-0 bg-territory-surface px-2.5 py-5 lg:flex lg:flex-col">
          <Brand />
          <nav className="mt-8 space-y-1" aria-label="Navegação principal">
            {navItems.map(({ label, icon: Icon, target }) => (
              <Link
                key={label}
                to={target}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-2.5 text-[0.74rem] font-medium text-territory-ink hover:bg-territory-raised",
                  label === "Publicar" &&
                    "bg-territory-sun/35 font-semibold text-territory-brand",
                )}
              >
                <Icon
                  className="h-[17px] w-[17px] shrink-0"
                  aria-hidden="true"
                />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-1 border-t border-territory-border pt-3">
            <button
              type="button"
              className="flex min-h-10 w-full items-center gap-3 px-2.5 text-xs font-semibold text-territory-muted"
            >
              <CircleHelp className="h-4 w-4" />
              Ajuda
            </button>
            <button
              type="button"
              className="flex min-h-10 w-full items-center gap-3 px-2.5 text-xs font-semibold text-territory-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Sair
            </button>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="hidden h-16 items-center justify-between border-b border-territory-border bg-territory-surface px-6 lg:flex">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-territory-brand">
                Publicar
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              Ana Oliveira
              <img
                src={personalImage}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            </div>
          </header>
          <header className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-between border-b border-territory-border bg-territory-surface/95 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => onView("participate")}
              aria-label="Voltar"
              className="flex h-11 w-11 items-center justify-center rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Brand />
            <button
              type="button"
              aria-label="Abrir menu"
              className="flex h-11 w-11 items-center justify-center rounded-full"
            >
              <Menu className="h-5 w-5" />
            </button>
          </header>
          <main className="w-full px-4 pb-6 pt-5 sm:px-6 sm:pb-10 lg:max-w-[1200px] lg:px-6 lg:pt-7">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProfileIdentity({ status }: { status: PublishStatus }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={personalImage}
        alt=""
        className="h-12 w-12 rounded-full object-cover"
      />
      <div>
        <p className="font-semibold text-territory-ink">Ana Oliveira</p>
        <p className="text-sm text-territory-muted">Pessoal</p>
        {status === "verified" ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Vínculo confirmado
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Participate({
  status,
  onView,
}: {
  status: PublishStatus;
  onView: (next: PublishView) => void;
}) {
  return (
    <div className="mx-auto max-w-[34rem]">
      <h1 className="font-heading text-[1.8rem] font-bold leading-tight tracking-[-0.045em] sm:text-3xl">
        Participe da comunidade
      </h1>
      <div className="mt-6 rounded-2xl border border-territory-border bg-territory-surface p-4">
        <ProfileIdentity status={status} />
        <div className="mt-3 flex items-center gap-2 text-sm text-territory-muted">
          <MapPin className="h-4 w-4 text-territory-brand" />
          Complexo do Nordeste de Amaralina
        </div>
      </div>
      <div className="relative mx-auto my-8 h-36 max-w-[18rem] overflow-hidden rounded-2xl bg-territory-raised">
        <span className="absolute right-8 top-4 h-12 w-12 rounded-full bg-territory-sun" />
        <div className="absolute bottom-0 left-5 flex h-20 items-end gap-1">
          {[30, 48, 64, 42, 76, 56, 36, 68].map((height, index) => (
            <span
              key={index}
              style={{ height }}
              className="w-7 rounded-t bg-territory-brand"
            >
              <span className="mt-3 block h-2 w-2 bg-territory-sun/80" />
            </span>
          ))}
        </div>
      </div>
      <p className="text-center text-lg font-bold leading-6 text-territory-ink">
        Para publicar aqui, confirme seu vínculo com esta comunidade.
      </p>
      <button
        type="button"
        onClick={() => onView("types")}
        className="mt-5 min-h-12 w-full rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:brightness-95"
      >
        Solicitar vínculo
      </button>
      <button
        type="button"
        onClick={() => undefined}
        className="mt-2 min-h-12 w-full rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand"
      >
        Acompanhar minha solicitação
      </button>
      <button
        type="button"
        onClick={() => undefined}
        className="mt-3 w-full text-center text-sm font-semibold text-territory-brand underline-offset-4 hover:underline"
      >
        Continuar explorando
      </button>
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-territory-raised p-3 text-sm leading-5 text-territory-muted">
        <UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" />
        Sua conta também pode acessar negócios, serviços e anúncios.
      </div>
    </div>
  );
}

const publishTypes = [
  {
    label: "Discussão",
    caption: "Compartilhe uma ideia",
    icon: MessageCircle,
    view: "review" as PublishView,
  },
  {
    label: "Pergunta",
    caption: "Tire dúvidas",
    icon: CircleHelp,
    view: "review" as PublishView,
  },
  {
    label: "Enquete",
    caption: "Ouça a comunidade",
    icon: BarChart3,
    view: "review" as PublishView,
  },
  {
    label: "Recomendação",
    caption: "Indique lugares e serviços",
    icon: Star,
    view: "review" as PublishView,
  },
  {
    label: "Aviso",
    caption: "Comunique à comunidade",
    icon: Megaphone,
    view: "alert" as PublishView,
  },
  {
    label: "Alerta",
    caption: "Avise sobre situações importantes",
    icon: AlertTriangle,
    view: "problem" as PublishView,
  },
  {
    label: "Problema",
    caption: "Relate um problema",
    icon: Wrench,
    view: "problem" as PublishView,
  },
];

function Types({ onView }: { onView: (next: PublishView) => void }) {
  return (
    <>
      <div className="hidden text-sm font-semibold text-territory-muted lg:block">
        01 · Escolher destino
      </div>
      <h1 className="mt-0 max-w-[17rem] font-heading text-[1.8rem] font-bold leading-tight tracking-[-0.045em] sm:max-w-none sm:text-3xl lg:mt-1">
        O que você quer publicar?
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ProfileIdentity status="verified" />
        <span className="hidden text-sm text-territory-muted sm:inline">
          <MapPin className="mr-1 inline h-4 w-4" />
          Santa Cruz
        </span>
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
          <h2 className="text-base font-bold">Na comunidade</h2>
          <p className="mt-1 text-sm text-territory-muted">
            Compartilhe com as pessoas do seu território.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-2.5">
            {publishTypes.map(({ label, caption, icon: Icon, view }) => (
              <button
                type="button"
                key={label}
                onClick={() => onView(view)}
                className="group relative flex min-h-[6.4rem] flex-col items-center justify-center rounded-xl border border-territory-border bg-territory-canvas p-2 text-center hover:border-territory-brand hover:bg-territory-raised sm:min-h-28 sm:p-3 lg:items-start lg:justify-start lg:text-left"
              >
                <Icon className="h-5 w-5 text-territory-brand sm:h-6 sm:w-6" />
                <span className="mt-2 block text-xs font-bold leading-4 text-territory-ink sm:text-sm">
                  {label}
                </span>
                <span className="mt-1 block text-[0.65rem] leading-3 text-territory-muted sm:text-xs sm:leading-4">
                  {caption}
                </span>
                <ChevronRight className="absolute right-2 top-2 hidden h-4 w-4 text-territory-muted lg:block" />
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
          <h2 className="text-base font-bold">Em outros módulos</h2>
          <p className="mt-1 text-sm text-territory-muted">
            Acesse formulários específicos para outros tipos de conteúdo.
          </p>
          <div className="mt-3 divide-y divide-territory-border">
            {[
              [Tag, "Anunciar item", "Classificados"],
              [Wrench, "Oferecer serviço", "Serviços"],
              [BriefcaseBusiness, "Criar vaga", "Vagas"],
              [CalendarDays, "Evento, encontro ou mutirão", "Eventos"],
            ].map(([Icon, label, caption]) => (
              <button
                type="button"
                key={String(label)}
                onClick={() => onView("module")}
                className="flex min-h-14 w-full items-center gap-3 py-3 text-left"
              >
                <Icon className="h-5 w-5 shrink-0 text-territory-brand" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {String(label)}
                  </span>
                  <span className="block text-xs text-territory-muted">
                    {String(caption)} · Abre o formulário específico.
                  </span>
                </span>
              </button>
            ))}
            <div className="flex items-center gap-3 pt-3 text-sm text-territory-muted">
              <UsersRound className="h-5 w-5 shrink-0" />
              <span>
                <strong className="block text-sm text-territory-ink">
                  Comunicado de organização
                </strong>
                Exige perfil autorizado.
              </span>
            </div>
          </div>
        </section>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-territory-muted">
        <Info className="h-4 w-4" />
        Cada ação abre o formulário do destino indicado.
      </p>
    </>
  );
}

function Field({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-territory-ink">
      {label}
      {multiline ? (
        <textarea
          defaultValue={value}
          className="mt-2 min-h-28 w-full resize-y rounded-xl border border-territory-border bg-territory-surface p-3 text-sm font-normal focus:border-territory-brand focus:outline-none focus:ring-2 focus:ring-territory-brand/15"
        />
      ) : (
        <input
          defaultValue={value}
          className="mt-2 h-11 w-full rounded-xl border border-territory-border bg-territory-surface px-3 text-sm font-normal focus:border-territory-brand focus:outline-none focus:ring-2 focus:ring-territory-brand/15"
        />
      )}
    </label>
  );
}

function AlertForm({
  onView,
  communication = false,
}: {
  onView: (next: PublishView) => void;
  communication?: boolean;
}) {
  return (
    <>
      <h1 className="font-heading text-[1.7rem] font-bold tracking-[-0.04em]">
        {communication ? "Comunicado da organização" : "Aviso comunitário"}
      </h1>
      <div className="mt-4 rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
        <ProfileIdentity status={communication ? "verified" : "none"} />
        <div className="mt-5 grid gap-4">
          <Field
            label={
              communication
                ? "Organização (somente perfis autorizados)"
                : "Bairro / Local"
            }
            value={
              communication
                ? "Associação comunitária · Representante autorizado"
              : "Santa Cruz"
            }
          />
          {!communication ? (
            <p className="-mt-2 text-xs text-territory-muted">
              No Complexo do Nordeste de Amaralina.
            </p>
          ) : null}
          <Field
            label={communication ? "Título" : "Texto do aviso"}
            value={
              communication
                ? "Mudança no horário de atendimento"
                : "O encontro de leitura foi transferido para a sala da associação. Consulte os organizadores para mais informações."
            }
            multiline={true}
          />
          {!communication ? (
            <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-territory-border p-3 text-center text-sm text-territory-muted">
              <ImagePlus className="h-5 w-5 text-territory-brand" />
              <span>Adicionar imagens</span>
              <span className="text-xs">Opcional</span>
            </div>
          ) : null}
          <Field
            label={
              communication
                ? "Território de abrangência"
                : "Até quando este aviso é válido? (opcional)"
            }
            value={
              communication
                ? "Complexo do Nordeste de Amaralina"
                : "Selecionar data"
            }
          />
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-territory-raised p-3 text-xs leading-4 text-territory-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {communication
            ? "A autorização identifica o emissor; não representa comunicado da plataforma."
            : "Aviso da comunidade · Não é comunicado oficial."}
        </p>
        {!communication ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-territory-raised p-3 text-xs leading-4 text-territory-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Texto salvo neste dispositivo; imagens precisam ser adicionadas
            novamente ao retomar.
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => undefined}
            className="min-h-11 rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand"
          >
            Salvar rascunho
          </button>
          <button
            type="button"
            onClick={() => onView(communication ? "review" : "review")}
            className="min-h-11 rounded-xl bg-territory-sun px-5 text-sm font-bold text-territory-ink"
          >
            {communication ? "Revisar comunicado" : "Revisar"}
          </button>
        </div>
      </div>
    </>
  );
}

function ProblemForm({ onView }: { onView: (next: PublishView) => void }) {
  return (
    <>
      <h1 className="font-heading text-[1.7rem] font-bold tracking-[-0.04em]">
        Problema do bairro
      </h1>
      <div className="mt-4 rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
        <ProfileIdentity status="none" />
        <div className="mt-5 grid gap-4">
          <Field label="Categoria" value="Iluminação" />
          <Field label="Local de referência" value="Praça da comunidade" />
          <Field
            label="Frequência / Recorrente"
            value="Acontece várias vezes"
          />
          <Field
            label="Descreva o problema"
            value="Os postes próximos à praça estão apagados há algumas noites."
            multiline
          />
          <div className="flex min-h-16 items-center gap-3 rounded-xl border border-dashed border-territory-border p-3 text-sm text-territory-muted">
            <ImagePlus className="h-5 w-5 text-territory-brand" />
            Foto (opcional) · Adicionar imagem
          </div>
        </div>
        <p className="mt-4 text-xs text-territory-muted">
          O registro permite acompanhamento, mas não garante atendimento por
          órgão público.
        </p>
        <button
          type="button"
          onClick={() => onView("review")}
          className="mt-5 min-h-11 w-full rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink"
        >
          Revisar problema
        </button>
      </div>
    </>
  );
}

function Review({
  onView,
  kind,
}: {
  onView: (next: PublishView) => void;
  kind: "review" | "module";
}) {
  if (kind === "module")
    return (
      <>
        <h1 className="font-heading text-[1.7rem] font-bold tracking-[-0.04em]">
          Criar anúncio em Classificados
        </h1>
        <div className="mt-4 rounded-2xl border border-territory-border bg-territory-surface p-5">
          <div className="flex items-start gap-3">
            <Tag className="h-6 w-6 text-territory-brand" />
            <div>
              <h2 className="font-bold">
                Você continuará no formulário de Classificados
              </h2>
              <p className="mt-2 text-sm leading-5 text-territory-muted">
                Seu anúncio será publicado no módulo próprio, com as informações
                que preencher no próximo passo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => undefined}
            className="mt-5 min-h-11 rounded-xl bg-territory-sun px-5 text-sm font-bold"
          >
            Continuar em Classificados
          </button>
        </div>
      </>
    );
  return (
    <>
      <h1 className="font-heading text-[1.7rem] font-bold tracking-[-0.04em]">
        Confira antes de publicar
      </h1>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
          <h2 className="text-sm font-bold">Resumo da publicação</h2>
          <div className="mt-3 space-y-3 text-sm">
            <p>
              <strong>Autora</strong>
              <span className="ml-5 text-territory-muted">
                Ana Oliveira (Pessoal)
              </span>
            </p>
            <p>
              <strong>Local</strong>
              <span className="ml-7 text-territory-muted">Santa Cruz</span>
            </p>
            <p>
              <strong>Destino</strong>
              <span className="ml-4 text-territory-muted">Comunidade</span>
            </p>
            <p>
              <strong>Tipo</strong>
              <span className="ml-6 inline-flex rounded-full bg-territory-sun px-2 py-1 text-xs font-bold">
                Aviso comunitário
              </span>
            </p>
          </div>
          <div className="mt-5 rounded-2xl bg-territory-raised p-4">
            <ProfileIdentity status="none" />
            <p className="mt-4 text-sm leading-5">
              O encontro de leitura foi transferido para a sala da associação.
              Consulte os organizadores para mais informações.
            </p>
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-territory-raised p-3 text-xs leading-4 text-territory-muted">
            <Info className="h-4 w-4 shrink-0" />
            Publicação pública conforme as regras desta comunidade. Publicar não
            envia uma notificação para todo o território.
          </p>
          <button
            type="button"
            onClick={() => undefined}
            className="mt-5 min-h-12 w-full rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink"
          >
            Publicar aviso
          </button>
          <button
            type="button"
            onClick={() => onView("alert")}
            className="mt-2 min-h-11 w-full rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand"
          >
            Voltar e editar
          </button>
        </div>
        <div className="hidden rounded-2xl bg-territory-raised p-4 lg:block">
          <h2 className="text-sm font-bold">Diretrizes da comunidade</h2>
          <p className="mt-2 text-sm leading-5 text-territory-muted">
            Revise o contexto e publique somente informações pertinentes ao
            território.
          </p>
        </div>
      </div>
    </>
  );
}

export default function PublicarComunidadeConceptMockPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = getInitial(location);
  const [view, setViewState] = useState<PublishView>(initial.view);
  const [status] = useState<PublishStatus>(initial.status);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);
  const setView = (next: PublishView) => {
    setViewState(next);
    const params = new URLSearchParams(QUERY.slice(1));
    params.set("view", next);
    if (status !== "none") params.set("status", status);
    navigate(`/novo-post?${params.toString()}`, { replace: true });
  };
  return (
    <>
      <Helmet>
        <title>Publicar na comunidade | Achegue-se</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Shell onView={setView}>
        {view === "participate" ? (
          <Participate status={status} onView={setView} />
        ) : view === "types" ? (
          <Types onView={setView} />
        ) : view === "alert" ? (
          <AlertForm onView={setView} />
        ) : view === "problem" ? (
          <ProblemForm onView={setView} />
        ) : view === "communication" ? (
          <AlertForm onView={setView} communication />
        ) : (
          <Review
            onView={setView}
            kind={view === "module" ? "module" : "review"}
          />
        )}
      </Shell>
    </>
  );
}
