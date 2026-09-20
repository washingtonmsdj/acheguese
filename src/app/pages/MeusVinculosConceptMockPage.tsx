import { useEffect, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Eye,
  FileText,
  Home,
  Info,
  Link2,
  LockKeyhole,
  MapPin,
  Megaphone,
  ShieldCheck,
  Store,
  UserRound,
  UsersRound,
} from "lucide-react";

import communityImage from "@/assets/bairro-nordeste.jpg";
import personalImage from "@/assets/persona-comerciante.jpg";
import { cn } from "@/shared/utils/cn";

const QUERY = "?concept-mock=1";
type LinkView = "confirmed" | "permissions" | "pending" | "unavailable" | "update" | "complement";

function href(path: string, view?: LinkView) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}concept-mock=1${view ? `&view=${view}` : ""}`;
}

function getInitialView(search: string): LinkView {
  const view = new URLSearchParams(search).get("view");
  return ["permissions", "pending", "unavailable", "update", "complement"].includes(view ?? "")
    ? (view as LinkView)
    : "confirmed";
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to={href("/")}
      aria-label="Achegue-se — início"
      className={cn(
        "whitespace-nowrap font-heading text-[1.55rem] font-bold tracking-[-0.06em]",
        light ? "text-white" : "text-territory-brand",
      )}
    >
      achegue-se<span className="text-territory-sun">.</span>
    </Link>
  );
}

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-territory-border bg-territory-surface", className)}>
      {children}
    </section>
  );
}

function StatusPill({ children, tone = "success" }: { children: ReactNode; tone?: "success" | "pending" | "muted" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "success" && "bg-emerald-100 text-emerald-800",
        tone === "pending" && "bg-amber-100 text-amber-900",
        tone === "muted" && "bg-territory-raised text-territory-muted",
      )}
    >
      {tone === "success" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {tone === "pending" ? <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

function ProfileSelector({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-2 rounded-xl border border-territory-border bg-territory-surface text-left",
        compact ? "px-3 py-2" : "w-full p-3",
      )}
      aria-label="Selecionar perfil"
    >
      <img src={personalImage} alt="" className={cn("rounded-full object-cover", compact ? "h-8 w-8" : "h-11 w-11")} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-territory-ink">Ana Oliveira</span>
        <span className="block text-xs text-territory-muted">Perfil pessoal</span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-territory-muted" aria-hidden="true" />
    </button>
  );
}

function CommunityIdentity({ pending = false, unavailable = false }: { pending?: boolean; unavailable?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src={communityImage} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <h2 className="font-heading text-base font-bold leading-tight text-territory-ink">Complexo do Nordeste de Amaralina</h2>
        <p className="mt-0.5 text-sm text-territory-muted">Salvador · BA</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-territory-ink">
          <MapPin className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
          Santa Cruz · Moradia
        </p>
        {pending ? <StatusPill tone="pending">Solicitação em análise</StatusPill> : null}
        {unavailable ? <StatusPill tone="muted">Confirmação indisponível</StatusPill> : null}
      </div>
      <ChevronDown className="h-5 w-5 shrink-0 text-territory-muted" aria-hidden="true" />
    </div>
  );
}

function PermissionRow({ icon: Icon, label, status, restricted = false }: { icon: typeof Eye; label: string; status: string; restricted?: boolean }) {
  return (
    <div className="flex min-h-11 items-center gap-3 border-b border-territory-border last:border-b-0">
      <Icon className="h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-sm text-territory-ink">{label}</span>
      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", restricted ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800")}>{status}</span>
    </div>
  );
}

function Capabilities({ compact = false }: { compact?: boolean }) {
  return (
    <Surface className={cn(compact ? "p-4" : "p-4 sm:p-5")}>
      {!compact ? <h2 className="font-heading text-base font-bold text-territory-ink">Sua participação neste perfil</h2> : null}
      <div className={compact ? undefined : "mt-3"}>
        <PermissionRow icon={Eye} label="Ler conteúdo público" status="Permitido" />
        <PermissionRow icon={Link2} label="Publicar e responder" status="Permitido" />
        <PermissionRow icon={BarChart3} label="Votar em enquetes" status="Permitido" />
        <PermissionRow icon={Megaphone} label="Comunicados oficiais" status="Restrito" restricted />
        <PermissionRow icon={UsersRound} label="Moderar conteúdo" status="Restrito" restricted />
      </div>
      {!compact ? <p className="mt-4 text-xs leading-4 text-territory-muted">Permissões dependem do perfil e da comunidade.</p> : null}
    </Surface>
  );
}

function ExploreNotice() {
  return (
    <div className="rounded-2xl bg-territory-raised p-4 text-sm text-territory-muted">
      <div className="flex items-start gap-3">
        <BookIcon />
        <div>
          <p className="font-semibold text-territory-ink">Explorar não altera seu vínculo</p>
          <p className="mt-1 leading-5">Você pode conhecer conteúdos públicos sem informar onde mora.</p>
        </div>
      </div>
      <Link to="/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina" className="mt-3 flex items-center justify-end gap-1 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline">
        Quero o Achegue-se na minha região <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function BookIcon() {
  return <FileText className="h-6 w-6 shrink-0 text-territory-brand" aria-hidden="true" />;
}

function BusinessProfile() {
  return (
    <Surface className="p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-territory-sun/25 text-territory-brand">
          <Store className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-territory-ink">Sabores da Ana · Negócio</p>
          <p className="mt-0.5 text-xs text-territory-muted">Confira as permissões deste perfil separadamente.</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-territory-muted" aria-hidden="true" />
      </div>
      <button type="button" className="mt-3 min-h-10 w-full rounded-xl border border-territory-brand px-3 text-sm font-semibold text-territory-brand">Ver permissões do negócio</button>
    </Surface>
  );
}

function MobileConfirmed({ onView }: { onView: (view: LinkView) => void }) {
  return (
    <div className="lg:hidden">
      <p className="text-xs font-semibold text-territory-brand">Conta</p>
      <h1 className="mt-1 font-heading text-[1.75rem] font-bold leading-tight tracking-[-0.045em]">Meus vínculos</h1>
      <Surface className="mt-4 p-3">
        <ProfileSelector />
        <div className="mt-3 rounded-xl border border-territory-border p-3">
          <CommunityIdentity />
          <StatusPill>Vínculo confirmado</StatusPill>
          <div className="mt-3 grid gap-2">
            <button type="button" onClick={() => onView("permissions")} className="min-h-11 rounded-xl bg-territory-brand px-4 text-sm font-bold text-white">Ver minha participação</button>
            <button type="button" onClick={() => onView("update")} className="min-h-11 rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand">Atualizar vínculo</button>
          </div>
        </div>
      </Surface>
      <h2 className="mt-5 font-heading text-base font-bold">O que você pode fazer</h2>
      <div className="mt-2"><Capabilities compact /></div>
      <div className="mt-4"><ExploreNotice /></div>
      <h2 className="mt-5 font-heading text-base font-bold">Outros perfis</h2>
      <div className="mt-2"><BusinessProfile /></div>
      <p className="mt-3 text-center text-xs text-territory-muted">Cada perfil tem suas próprias permissões.</p>
    </div>
  );
}

function DesktopConfirmed({ onView }: { onView: (view: LinkView) => void }) {
  return (
    <div className="hidden lg:block">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold text-territory-brand">Minha conta</p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-[-0.045em]">Meus vínculos e participação</h1>
          <p className="mt-1 text-base text-territory-muted">Acompanhe sua relação com a comunidade e o que cada perfil pode fazer.</p>
        </div>
        <div className="flex items-center gap-3 pt-2 text-sm text-territory-muted"><span>Perfil atual</span><ProfileSelector compact /></div>
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(13rem,.65fr)_minmax(19rem,1fr)]">
        <Surface className="p-5 lg:col-span-2">
          <div className="flex items-start gap-4">
            <img src={communityImage} alt="" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg font-bold">Complexo do Nordeste de Amaralina</h2>
              <p className="text-sm text-territory-muted">Salvador · BA</p>
              <div className="mt-2"><StatusPill>Confirmado</StatusPill></div>
              <p className="mt-3 flex items-center gap-2 text-sm"><Home className="h-5 w-5 text-territory-brand" />Moradia · Santa Cruz</p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button type="button" onClick={() => onView("pending")} className="text-sm font-semibold text-sky-700 underline-offset-4 hover:underline">Ver solicitação</button>
                <button type="button" onClick={() => onView("update")} className="min-h-10 rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand">Atualizar vínculo</button>
              </div>
            </div>
          </div>
        </Surface>
        <Surface className="p-5">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-territory-sun/30 text-territory-brand"><MapPin className="h-6 w-6" /></span>
          <h2 className="mt-4 font-heading text-base font-bold">Território explorado</h2>
          <p className="mt-1 text-sm leading-5 text-territory-muted">Explorar um lugar não altera sua residência.</p>
        </Surface>
        <div className="lg:row-span-2 lg:col-start-3 lg:row-start-1"><Capabilities /></div>
        <div className="lg:col-span-2"><BusinessProfile /></div>
      </div>
    </div>
  );
}

function PendingView({ onView }: { onView: (view: LinkView) => void }) {
  return (
    <div className="mx-auto max-w-[38rem]">
      <p className="text-xs font-semibold text-territory-brand">Meus vínculos</p>
      <h1 className="mt-1 max-w-[18rem] font-heading text-[1.75rem] font-bold leading-tight tracking-[-0.045em]">Estamos analisando seu vínculo</h1>
      <div className="mt-5 flex justify-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-territory-sun/25 text-territory-brand"><Clock3 className="h-9 w-9" /></span></div>
      <Surface className="mt-5 p-4"><CommunityIdentity pending /></Surface>
      <div className="mt-5 space-y-3">
        <div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-territory-brand text-white"><Check className="h-4 w-4" /></span><div><p className="text-sm font-bold">Solicitação recebida</p><p className="text-xs text-territory-muted">17 set.</p></div></div>
        <div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-territory-sun text-territory-ink"><Clock3 className="h-4 w-4" /></span><div><p className="text-sm font-bold">Análise pendente</p><p className="text-sm leading-5 text-territory-muted">Você será avisada quando houver uma atualização.</p></div></div>
      </div>
      <div className="mt-6 grid gap-2"><button type="button" onClick={() => undefined} className="min-h-12 rounded-xl bg-territory-brand px-4 text-sm font-bold text-white">Ver solicitação</button><button type="button" onClick={() => onView("confirmed")} className="min-h-11 rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand">Continuar explorando</button></div>
      <div className="mt-5 rounded-2xl bg-territory-raised p-3 text-sm leading-5 text-territory-muted"><Info className="mr-2 inline h-4 w-4 text-territory-brand" />Você pode acessar conteúdos públicos enquanto aguarda.</div>
      <p className="mt-4 text-center text-xs text-territory-muted"><LockKeyhole className="mr-1 inline h-4 w-4" />Dados da solicitação são privados.</p>
    </div>
  );
}

function PermissionsView({ onView }: { onView: (view: LinkView) => void }) {
  return (
    <div className="mx-auto max-w-[62rem]">
      <p className="text-xs font-semibold text-territory-brand">Meus vínculos</p>
      <h1 className="mt-1 font-heading text-[1.75rem] font-bold leading-tight tracking-[-0.045em] lg:text-3xl">Minha participação</h1>
      <p className="mt-1 text-sm text-territory-muted lg:text-base">As permissões variam conforme seu vínculo e as regras da comunidade.</p>
      <Surface className="mt-5 p-3 sm:p-4"><div className="flex items-center gap-3"><img src={personalImage} alt="" className="h-12 w-12 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="font-semibold">Ana Oliveira</p><p className="text-sm text-territory-muted">Perfil pessoal</p></div><StatusPill>Moradia confirmada</StatusPill></div><div className="mt-3 flex items-center gap-3 border-t border-territory-border pt-3"><img src={communityImage} alt="" className="h-12 w-12 rounded-xl object-cover" /><div><p className="text-sm font-bold">Complexo do Nordeste de Amaralina</p><p className="text-xs text-territory-muted">Salvador · Bahia · Santa Cruz</p></div></div></Surface>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]"><Capabilities /><Surface className="hidden p-4 lg:block"><h2 className="text-sm font-bold">Outros perfis</h2><p className="mt-1 text-sm leading-5 text-territory-muted">Cada perfil tem suas próprias permissões.</p><div className="mt-4"><BusinessProfile /></div></Surface></div>
      <div className="mt-4 rounded-2xl bg-territory-raised p-3 text-sm leading-5 text-territory-muted"><Info className="mr-2 inline h-4 w-4 text-territory-brand" />Seu vínculo não concede representação oficial.</div>
      <button type="button" onClick={() => onView("confirmed")} className="mt-4 min-h-11 w-full rounded-xl bg-territory-brand px-4 text-sm font-bold text-white lg:w-auto lg:px-6">Voltar para Meus vínculos</button>
    </div>
  );
}

function UnavailableView({ onView }: { onView: (view: LinkView) => void }) {
  return (
    <div className="mx-auto max-w-[38rem]">
      <p className="text-xs font-semibold text-territory-brand">Meus vínculos</p>
      <h1 className="mt-1 font-heading text-[1.75rem] font-bold leading-tight tracking-[-0.045em]">Confirmar vínculo</h1>
      <p className="mt-2 text-base leading-6 text-territory-muted">Selecione seu território e informe sua forma de residência.</p>
      <Surface className="mt-5 p-3"><CommunityIdentity unavailable /><div className="mt-3 grid gap-2"><button type="button" className="flex min-h-12 items-center gap-3 rounded-xl border border-territory-border px-3 text-left text-sm font-semibold"><MapPin className="h-5 w-5" />Santa Cruz<ChevronDown className="ml-auto h-4 w-4" /></button><button type="button" className="flex min-h-12 items-center gap-3 rounded-xl border border-territory-border px-3 text-left text-sm font-semibold"><Home className="h-5 w-5" />Moro aqui<ChevronDown className="ml-auto h-4 w-4" /></button></div></Surface>
      <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4"><p className="flex items-center gap-2 text-sm font-bold text-amber-950"><Info className="h-5 w-5" />Envio de comprovantes indisponível</p><p className="mt-1 text-sm leading-5 text-amber-950/80">Este método ainda não está disponível. Você pode continuar explorando a comunidade.</p></div>
      <button type="button" onClick={() => onView("confirmed")} className="mt-4 min-h-12 w-full rounded-xl bg-territory-brand px-4 text-sm font-bold text-white">Continuar explorando</button>
      <button type="button" className="mt-3 w-full py-2 text-sm font-semibold text-territory-brand underline">Preciso de ajuda</button>
      <div className="mt-5 rounded-2xl bg-territory-raised p-3 text-sm leading-5 text-territory-muted"><Info className="mr-2 inline h-4 w-4 text-territory-brand" />Quando disponível, seus dados serão usados apenas na análise autorizada.</div>
    </div>
  );
}

function UpdateView({ onView }: { onView: (view: LinkView) => void }) {
  return (
    <div className="mx-auto max-w-[48rem]">
      <p className="text-xs font-semibold text-territory-brand">Meus vínculos</p>
      <h1 className="mt-1 font-heading text-[1.75rem] font-bold leading-tight tracking-[-0.045em]">Atualizar vínculo</h1>
      <Surface className="mt-5 p-4 sm:p-5"><div className="flex items-center gap-3 border-b border-territory-border pb-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-territory-sun text-territory-ink">1</span><strong className="text-sm">Relação</strong><span className="h-px flex-1 bg-territory-border" /><span className="grid h-9 w-9 place-items-center rounded-full bg-territory-raised text-territory-muted">2</span><span className="text-sm text-territory-muted">Informações</span><span className="h-px flex-1 bg-territory-border" /><span className="grid h-9 w-9 place-items-center rounded-full bg-territory-raised text-territory-muted">3</span><span className="text-sm text-territory-muted">Revisão</span></div><label className="mt-5 block text-sm font-bold">Bairro<select className="mt-2 h-11 w-full rounded-xl border border-territory-border bg-territory-surface px-3 text-sm font-normal"><option>Santa Cruz</option></select></label><h2 className="mt-5 text-sm font-bold">Qual é sua relação com este território?</h2><div className="mt-3 grid gap-3 sm:grid-cols-3">{[[Home,"Moradia","Eu moro neste bairro."],[Building2,"Trabalho","Eu trabalho neste bairro."],[FileText,"Estudo","Eu estudo neste bairro."]].map(([Icon,label,caption], index)=><button type="button" key={String(label)} className={cn("rounded-xl border p-3 text-left",index===0?"border-amber-400 bg-amber-50":"border-territory-border")}><span className="flex items-center gap-2"><Icon className="h-5 w-5 text-territory-brand" /><strong className="text-sm">{String(label)}</strong></span><span className="mt-2 block text-xs text-territory-muted">{String(caption)}</span></button>)}</div><p className="mt-4 text-xs text-territory-muted"><Info className="mr-1 inline h-4 w-4" />Uma mudança pode exigir nova análise.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => onView("confirmed")} className="min-h-11 rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand">Cancelar</button><button type="button" onClick={() => onView("confirmed")} className="min-h-11 rounded-xl bg-territory-brand px-5 text-sm font-bold text-white">Continuar</button></div></Surface>
    </div>
  );
}

function ComplementView({ onView }: { onView: (view: LinkView) => void }) {
  return (
    <div className="mx-auto max-w-[40rem]"><p className="text-xs font-semibold text-territory-brand">Meus vínculos</p><h1 className="mt-1 font-heading text-[1.75rem] font-bold leading-tight tracking-[-0.045em]">Precisamos de mais informações</h1><div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4"><p className="font-bold text-amber-950">Complementação solicitada</p><p className="mt-1 text-sm text-amber-950/80">Para manter seu vínculo, precisamos de mais informações.</p></div><Surface className="mt-4 p-4"><p className="text-sm font-bold">Motivo</p><p className="mt-1 text-sm text-territory-muted">Confirme o bairro informado.</p><label className="mt-4 block text-sm font-bold">Bairro<select className="mt-2 h-11 w-full rounded-xl border border-territory-border bg-territory-surface px-3 text-sm font-normal"><option>Santa Cruz</option></select></label><div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => onView("update")} className="min-h-11 rounded-xl bg-territory-brand px-4 text-sm font-bold text-white">Revisar e reenviar</button><button type="button" onClick={() => onView("confirmed")} className="min-h-11 rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand">Ver orientação</button></div></Surface><p className="mt-4 text-xs text-territory-muted"><Info className="mr-1 inline h-4 w-4" />Envio disponível somente com método de confirmação habilitado.</p></div>
  );
}

function Shell({ view, children, onView }: { view: LinkView; children: ReactNode; onView: (view: LinkView) => void }) {
  const sideItems = [
    [UserRound, "Minha conta", "/conta"],
    [UsersRound, "Meus perfis", "/conta#perfis"],
    [Link2, "Meus vínculos", href("/conta/vinculos")],
    [ShieldCheck, "Privacidade", "/conta/privacidade"],
    [CircleHelp, "Ajuda", "#ajuda"],
  ] as const;
  return (
    <div className="min-h-[100dvh] bg-territory-canvas text-territory-ink">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1536px] lg:border-x lg:border-territory-border">
        <aside className="hidden w-[196px] shrink-0 bg-territory-brand px-3 py-5 text-white lg:block">
          <Brand light />
          <nav className="mt-8 space-y-1" aria-label="Navegação de conta">
            {sideItems.map(([Icon, label, target]) => <Link key={label} to={target} className={cn("relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/90 hover:bg-white/10", label === "Meus vínculos" && "bg-territory-sun font-semibold text-territory-ink")}><Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /><span>{label}</span></Link>)}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="hidden h-16 items-center justify-between border-b border-territory-border bg-territory-surface px-6 lg:flex"><span className="text-sm font-semibold">Complexo do Nordeste de Amaralina</span><div className="flex items-center gap-3 text-sm font-semibold"><Bell className="h-5 w-5 text-territory-muted" /><img src={personalImage} alt="" className="h-8 w-8 rounded-full object-cover" />Ana Oliveira<ChevronDown className="h-4 w-4" /></div></header>
          <header className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-center border-b border-territory-border bg-territory-surface/95 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur lg:hidden"><button type="button" onClick={() => onView("confirmed")} aria-label={view === "confirmed" ? "Voltar para Conta" : "Voltar para Meus vínculos"} className="absolute bottom-1 left-2 flex h-11 items-center gap-1 rounded-full px-2 text-sm text-territory-ink"><ArrowLeft className="h-5 w-5" /><span>{view === "confirmed" ? "Conta" : "Meus vínculos"}</span></button><Brand /></header>
          <main className="mx-auto w-full max-w-[1220px] px-4 pb-8 pt-5 sm:px-6 sm:pt-7 lg:px-7 lg:pt-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default function MeusVinculosConceptMockPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState<LinkView>(() => getInitialView(location.search));
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [view]);
  const onView = (next: LinkView) => { setView(next); navigate(href("/conta/vinculos", next), { replace: true }); };
  return (
    <>
      <Helmet><title>Meus vínculos e participação | Achegue-se</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <Shell view={view} onView={onView}>
        {view === "confirmed" ? <><MobileConfirmed onView={onView} /><DesktopConfirmed onView={onView} /></> : null}
        {view === "permissions" ? <PermissionsView onView={onView} /> : null}
        {view === "pending" ? <PendingView onView={onView} /> : null}
        {view === "unavailable" ? <UnavailableView onView={onView} /> : null}
        {view === "update" ? <UpdateView onView={onView} /> : null}
        {view === "complement" ? <ComplementView onView={onView} /> : null}
      </Shell>
    </>
  );
}
