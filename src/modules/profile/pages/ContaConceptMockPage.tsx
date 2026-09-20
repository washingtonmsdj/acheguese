import { useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  FileClock,
  KeyRound,
  Laptop,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  MonitorSmartphone,
  Pencil,
  Settings2,
  Shield,
  ShieldCheck,
  Smartphone,
  Tag,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import personalImage from "@/assets/persona-comerciante.jpg";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/utils/cn";

const CONCEPT_QUERY = "?concept-mock=1";

type AccountView =
  | "overview"
  | "access"
  | "security"
  | "mfa"
  | "notifications"
  | "privacy"
  | "export"
  | "deletion"
  | "profiles";

const navItems = [
  { label: "Visão geral", path: "/conta", icon: UserRound, view: "overview" as const },
  { label: "Dados de acesso", path: "/conta/seguranca", hash: "#acesso", icon: KeyRound, view: "access" as const },
  { label: "Segurança", path: "/conta/seguranca", icon: LockKeyhole, view: "security" as const },
  { label: "Notificações", path: "/conta/notificacoes", icon: Bell, view: "notifications" as const },
  { label: "Privacidade e dados", path: "/conta/privacidade", icon: Shield, view: "privacy" as const },
  { label: "Meus perfis", path: "/conta", hash: "#perfis", icon: UsersRound, view: "profiles" as const },
];

function href(path: string, hash = "") {
  return `${path}${CONCEPT_QUERY}${hash}`;
}

function getView(pathname: string, hash: string): AccountView {
  if (pathname === "/conta/seguranca") {
    if (hash === "#acesso" || hash === "#email") return "access";
    if (hash === "#mfa") return "mfa";
    return "security";
  }
  if (pathname === "/conta/notificacoes") return "notifications";
  if (pathname === "/conta/privacidade") {
    if (hash === "#exportar") return "export";
    if (hash === "#exclusao") return "deletion";
    return "privacy";
  }
  if (hash === "#perfis") return "profiles";
  return "overview";
}

function Brand() {
  return (
    <Link
      to={href("/")}
      className="font-heading text-[1.55rem] font-bold tracking-[-0.06em] text-territory-brand"
      aria-label="Achegue-se — início"
    >
      achegue-se<span className="text-territory-sun">.</span>
    </Link>
  );
}

function AccountMockShell({ view, children }: { view: AccountView; children: ReactNode }) {
  const navigate = useNavigate();
  const activeItem = navItems.find((item) => item.view === view) ?? navItems[0];

  return (
    <div className="territory-vivo min-h-[100dvh] bg-territory-canvas text-territory-ink">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1536px] bg-territory-canvas lg:border-x lg:border-territory-border">
        <aside className="hidden w-[196px] shrink-0 bg-territory-brand px-3 py-5 text-white lg:sticky lg:top-0 lg:block lg:h-[100dvh]">
          <Link to={href("/")} className="mb-8 inline-flex px-3 font-heading text-[1.55rem] font-bold tracking-[-0.06em] text-white" aria-label="Achegue-se — início">
            achegue-se<span className="text-territory-sun">.</span>
          </Link>
          <nav aria-label="Configurações da conta" className="space-y-1">
            {navItems.map(({ label, path, hash, icon: Icon, view: itemView }) => {
              const active = activeItem.view === itemView;
              return (
                <Link
                  key={label}
                  to={href(path, hash)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.82rem] font-medium text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-sun",
                    active && "bg-white/15 font-semibold text-white",
                  )}
                >
                  {active ? <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-territory-sun" aria-hidden="true" /> : null}
                  <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-territory-sun")} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="hidden h-16 items-center justify-end border-b border-territory-border bg-territory-surface px-6 lg:flex xl:px-8">
            <Link to={href("/conta", "#perfis")} className="flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-semibold text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand" aria-label="Abrir Meus perfis">
              <img src={personalImage} alt="" className="h-8 w-8 rounded-full object-cover" />
              <span>Ana Oliveira</span>
              <ChevronRight className="h-4 w-4 rotate-90 text-territory-muted" aria-hidden="true" />
            </Link>
          </header>

          <div className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-center border-b border-territory-border bg-territory-surface/95 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur lg:hidden">
            <button type="button" aria-label="Voltar para Minha conta" onClick={() => navigate(href("/conta"))} className="absolute bottom-1 left-2 flex h-11 w-11 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <Brand />
          </div>

          <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1100px] px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-12 sm:pt-6 lg:px-7 lg:pt-7 xl:px-8">
            {children}
          </main>
        </div>
      </div>

      <nav aria-label="Navegação principal mobile" className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-territory-border bg-territory-surface px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {[
          { label: "Início", target: "/ba/salvador/complexo-do-nordeste-de-amaralina", Icon: MapPin },
          { label: "Explorar", target: "/busca/ba/salvador/complexo-do-nordeste-de-amaralina", Icon: Download },
          { label: "Comunidade", target: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina", Icon: UsersRound },
          { label: "Conversas", target: `/mensagens${CONCEPT_QUERY}`, Icon: Bell },
          { label: "Conta", target: href("/conta"), Icon: UserRound },
        ].map(({ label, target, Icon }) => {
          const active = label === "Conta";
          return (
            <Link key={label} to={target} aria-current={active ? "page" : undefined} className={cn("flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[0.625rem] font-medium text-territory-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand", active && "font-semibold text-territory-brand")}>
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function PageHeading({ title, mobileTitle, description, mobileDescription, eyebrow = "Minha conta" }: { title: string; mobileTitle?: string; description?: string; mobileDescription?: string; eyebrow?: string }) {
  return (
    <div className="mb-4 lg:mb-5">
      <p className="mb-1 text-xs font-medium text-territory-brand lg:text-[0.7rem]">{eyebrow}</p>
      <h1 className="font-heading text-[1.7rem] font-bold leading-tight tracking-[-0.045em] text-territory-ink sm:text-3xl"><span className={mobileTitle ? "lg:hidden" : undefined}>{mobileTitle ?? title}</span>{mobileTitle ? <span className="hidden lg:inline">{title}</span> : null}</h1>
      {description || mobileDescription ? <p className="mt-1 text-sm leading-5 text-territory-muted lg:text-[0.9rem]"><span className={mobileDescription !== undefined ? "lg:hidden" : undefined}>{mobileDescription ?? description}</span>{mobileDescription !== undefined ? <span className="hidden lg:inline">{description}</span> : null}</p> : null}
    </div>
  );
}

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-territory-border bg-territory-surface", className)}>{children}</section>;
}

function OverviewRow({ icon: Icon, title, description, onClick, showDescriptionOnMobile = false }: { icon: typeof UserRound; title: string; description?: string; onClick: () => void; showDescriptionOnMobile?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="group flex min-h-[3.85rem] w-full items-center gap-3 border-b border-territory-border px-3 text-left last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:min-h-[4rem] sm:px-4">
      <Icon className="h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-territory-ink">{title}</span>
        {description ? <span className={cn("mt-0.5 text-xs leading-4 text-territory-muted sm:text-sm", showDescriptionOnMobile ? "block" : "hidden sm:block")}>{description}</span> : null}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-territory-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </button>
  );
}

function AccountOverview({ onView }: { onView: (view: AccountView) => void }) {
  return (
    <>
      <PageHeading title="Minha conta" />
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-4">
        <img src={personalImage} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-territory-ink">Ana Oliveira</h2>
          <p className="text-sm text-territory-muted">ana@example.com</p>
        </div>
      </div>
      <p className="mb-4 px-1 text-xs leading-4 text-territory-muted sm:text-sm">Estas configurações valem para toda a sua conta.</p>

      <Surface className="px-0">
        <OverviewRow icon={KeyRound} title="Dados de acesso" description="E-mail, nome de usuário e métodos de entrada." onClick={() => onView("access")} />
        <OverviewRow icon={LockKeyhole} title="Senha e segurança" description="Senha, recuperação e autenticação em duas etapas." onClick={() => onView("security")} />
        <OverviewRow icon={Bell} title="Notificações" description="Canais, tipos de aviso e horário de silêncio." onClick={() => onView("notifications")} />
        <OverviewRow icon={Shield} title="Privacidade e dados" description="Consentimentos, exportação e exclusão." onClick={() => onView("privacy")} />
        <OverviewRow icon={Settings2} title="Preferências do aplicativo" description="Ajustes pessoais da sua experiência." onClick={() => onView("overview")} />
      </Surface>

      <Surface className="mt-4 px-0">
        <OverviewRow icon={UsersRound} title="Meus perfis" description="Identidades, equipes e visibilidade pública." showDescriptionOnMobile onClick={() => onView("profiles")} />
      </Surface>

      <Surface className="mt-4 px-0">
        <OverviewRow icon={CircleHelp} title="Ajuda" onClick={() => undefined} />
      </Surface>

      <button type="button" onClick={() => undefined} className="mt-4 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-red-300 bg-territory-surface px-4 text-left text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
        <LogOut className="h-5 w-5" aria-hidden="true" />
        Sair da conta
      </button>
    </>
  );
}

function AccessView({ onView }: { onView: (view: AccountView) => void }) {
  return (
    <>
      <PageHeading title="Dados de acesso" mobileDescription="" description="Revise como você entra e identifica sua conta." />
      <div className="grid gap-3 lg:grid-cols-2">
        <Surface className="p-4 sm:p-5"><AccessItem icon={Mail} title="E-mail de acesso" value="ana@example.com" meta="Confirmado" action="Alterar e-mail" /><p className="mt-3 rounded-xl bg-territory-raised px-3 py-2 text-xs leading-4 text-territory-muted">A mudança precisa ser confirmada.</p></Surface>
        <Surface className="p-4 sm:p-5"><AccessItem icon={UserRound} title="Nome de usuário" value="@ana.oliveira" action="Editar" /></Surface>
        <Surface className="p-4 sm:p-5"><AccessItem icon={KeyRound} title="Senha" value="Acesso por senha configurado" action="Alterar senha" onAction={() => onView("security")} /></Surface>
        <Surface className="p-4 sm:p-5">
          <AccessItem icon={GoogleMark} title="Acesso com Google" value="Gerencie seus métodos de entrada." meta="Conectado" action="Ver opções" />
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-territory-raised px-3 py-2 text-xs leading-4 text-territory-muted"><ShieldCheck className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />Não remova seu único método de acesso.</p>
        </Surface>
      </div>
      <Surface className="mt-4 px-4 sm:px-5"><button type="button" className="flex min-h-16 w-full items-center gap-3 text-left"><Pencil className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-territory-ink">Editar nome e foto em Meus perfis</span><span className="mt-1 hidden text-sm text-territory-muted lg:block">Esses dados pertencem ao perfil e não às credenciais.</span></span><ChevronRight className="h-5 w-5 text-territory-muted" aria-hidden="true" /></button></Surface>
    </>
  );
}

function GoogleMark({ className = "" }: { className?: string }) {
  return <span className={cn("font-heading text-xl font-bold text-[#4285f4]", className)} aria-hidden="true">G</span>;
}

function AccessItem({ icon: Icon, title, value, meta, action, onAction }: { icon: typeof Mail | typeof GoogleMark; title: string; value: string; meta?: string; action: string; onAction?: () => void }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center text-territory-ink"><Icon className="h-5 w-5" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-territory-ink">{title}</h2>{meta ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{meta}</span> : null}</div>
        <p className="mt-1 text-sm text-territory-muted">{value}</p>
        <button type="button" onClick={onAction} className="mt-3 inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline">{action}<ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </div>
  );
}

function SecurityView({ onView }: { onView: (view: AccountView) => void }) {
  return (
    <>
      <PageHeading title="Senha e segurança" description="Mantenha sua conta protegida." mobileDescription="" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="p-4 sm:p-5">
          <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center text-territory-ink lg:rounded-xl lg:bg-territory-brand/10 lg:text-territory-brand"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold text-territory-ink">Autenticação em duas etapas</h2><span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Não ativada</span></div><p className="mt-2 text-sm leading-5 text-territory-muted">Confirme o acesso com um aplicativo autenticador.</p></div></div>
          <button type="button" onClick={() => onView("mfa")} className="mt-5 min-h-11 w-full rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Configurar autenticação</button>
          <div className="mt-5 border-t border-territory-border pt-4"><button type="button" onClick={() => undefined} className="flex min-h-11 w-full items-center gap-3 text-left"><KeyRound className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-territory-ink">Alterar senha</span><span className="mt-0.5 hidden text-xs text-territory-muted lg:block">Mantenha sua senha segura e atualizada.</span></span><ChevronRight className="h-5 w-5 text-territory-muted" aria-hidden="true" /></button></div>
        </Surface>
        <Surface className="p-4 sm:p-5"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center text-territory-ink lg:rounded-xl lg:bg-territory-brand/10 lg:text-territory-brand"><Laptop className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-sm font-bold text-territory-ink lg:text-base">Acessos à conta</h2><p className="mt-2 text-sm leading-5 text-territory-muted">A lista de dispositivos não está disponível agora.</p></div></div><div className="mt-4 flex items-center gap-3 rounded-xl bg-territory-raised p-3 text-sm text-territory-muted"><Laptop className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />A lista de dispositivos não está disponível agora.</div><button type="button" onClick={() => undefined} className="mt-4 min-h-11 w-full rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand hover:bg-territory-brand/5">Sair dos outros dispositivos</button><button type="button" onClick={() => undefined} className="mt-3 w-full text-center text-xs font-semibold text-territory-brand hover:underline">Sair de todos os dispositivos</button><p className="mt-2 text-center text-xs text-territory-muted">Você pode precisar entrar novamente.</p></Surface>
      </div>
      <Surface className="mt-4 px-4 sm:px-5"><button type="button" onClick={() => undefined} className="flex min-h-14 w-full items-center gap-3 text-left"><CircleHelp className="h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-territory-ink">Não reconhece um acesso?</span><span className="mt-1 block text-sm text-territory-brand">Preciso de ajuda <ChevronRight className="inline h-4 w-4" aria-hidden="true" /></span></span></button></Surface>
    </>
  );
}

function MfaView({ onView }: { onView: (view: AccountView) => void }) {
  return (
    <>
      <PageHeading title="Configurar autenticação" description="Use um aplicativo autenticador para proteger novos acessos." />
      <Surface className="p-4 sm:p-5">
        <ol className="space-y-4 text-sm text-territory-ink">
          <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-territory-brand text-xs font-bold text-white">1</span><span><strong className="block">Abra seu aplicativo autenticador</strong><span className="mt-1 block text-territory-muted">Escaneie o QR code ou informe a chave manualmente.</span></span></li>
          <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-territory-brand text-xs font-bold text-white">2</span><span><strong className="block">Leia o QR code</strong><span className="mt-1 block text-territory-muted">Este código é demonstrativo até a confirmação do serviço.</span></span></li>
        </ol>
        <div className="mx-auto mt-5 flex h-40 w-40 items-center justify-center rounded-xl border border-territory-border bg-white p-3" aria-label="QR code demonstrativo"><div className="grid h-full w-full grid-cols-9 gap-1 opacity-90">{Array.from({ length: 81 }, (_, index) => <span key={index} className={cn("rounded-[1px]", (index * 17 + index * index) % 7 < 3 ? "bg-territory-ink" : "bg-white")} />)}</div></div>
        <p className="mt-2 text-center text-[0.7rem] text-territory-muted">QR code de demonstração</p>
        <label className="mt-5 block text-sm font-semibold text-territory-ink" htmlFor="mfa-code">Digite o código de seis dígitos</label><input id="mfa-code" inputMode="numeric" maxLength={6} placeholder="000000" className="mt-2 h-11 w-full rounded-xl border border-territory-border bg-territory-surface px-3 text-center text-lg tracking-[0.35em] text-territory-ink focus:border-territory-brand focus:outline-none focus:ring-2 focus:ring-territory-brand/15" />
        <button type="button" onClick={() => onView("security")} className="mt-5 min-h-11 w-full rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:brightness-95">Confirmar ativação</button>
      </Surface>
      <Surface className="mt-4 px-4 sm:px-5"><button type="button" onClick={() => undefined} className="flex min-h-14 w-full items-center gap-3 text-left"><CircleHelp className="h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" /><span className="flex-1 text-sm font-semibold text-territory-brand">Precisa de ajuda? <ChevronRight className="inline h-4 w-4" aria-hidden="true" /></span></button></Surface>
    </>
  );
}

function NotificationView() {
  const [email, setEmail] = useState(true);
  const [inApp, setInApp] = useState(true);
  const [social, setSocial] = useState(true);
  const [system, setSystem] = useState(true);
  const [marketing, setMarketing] = useState(false);
  return (
    <>
      <PageHeading title="Controle o que chega até você" mobileTitle="Notificações" description="Escolha como e sobre o que deseja ser notificado." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="px-4 py-3 sm:px-5 sm:py-4"><h2 className="text-sm font-bold text-territory-ink lg:text-base">Canais<span className="hidden lg:inline"> de notificação</span></h2><div className="mt-1"><ToggleRow icon={Mail} label="E-mail" description="Receba avisos no seu e-mail." checked={email} onChange={setEmail} /><ToggleRow icon={Smartphone} label="No aplicativo" description="Receba avisos dentro do Achegue-se." checked={inApp} onChange={setInApp} /></div><div className="mt-3 border-t border-territory-border pt-3"><div className="flex items-start gap-3"><MonitorSmartphone className="h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" /><div><h3 className="text-sm font-bold text-territory-ink">Neste dispositivo</h3><p className="mt-1 text-xs leading-4 text-territory-muted">Push bloqueado no navegador</p><button type="button" onClick={() => undefined} className="mt-2 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline">Como permitir <ChevronRight className="inline h-4 w-4" aria-hidden="true" /></button></div></div></div></Surface>
        <Surface className="px-4 py-3 sm:px-5 sm:py-4"><h2 className="text-sm font-bold text-territory-ink lg:text-base">Tipos de aviso<span className="hidden lg:inline"> / notificação</span></h2><div className="mt-1"><ToggleRow icon={Bell} label="Pedidos e atendimentos" description="Atualizações sobre seus pedidos." checked onChange={() => undefined} /><ToggleRow icon={UsersRound} label="Interações da comunidade" description="Comentários e interações." checked={social} onChange={setSocial} /><ToggleRow icon={Settings2} label="Atualizações do sistema" description="Avisos importantes." checked={system} onChange={setSystem} /><ToggleRow icon={Tag} label="Ofertas e novidades" description="Promoções e conteúdos especiais." checked={marketing} onChange={setMarketing} /></div></Surface>
      </div>
      <Surface className="mt-4 px-4 py-3 sm:px-5 sm:py-4"><div className="flex items-center gap-3"><Clock3 className="h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" /><div className="min-w-0 flex-1"><h2 className="text-sm font-bold text-territory-ink">Horário de silêncio</h2><p className="mt-1 text-sm text-territory-ink">22:00 — 08:00</p><p className="text-xs text-territory-muted">Horário de Salvador.</p></div><button type="button" onClick={() => undefined} className="hidden min-h-11 rounded-xl bg-territory-sun px-5 text-sm font-bold text-territory-ink hover:brightness-95 lg:inline-flex">Salvar preferências</button><ChevronRight className="h-4 w-4 shrink-0 text-territory-muted lg:hidden" aria-hidden="true" /></div><button type="button" onClick={() => undefined} className="mt-4 min-h-12 w-full rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:brightness-95 lg:hidden">Salvar preferências</button></Surface>
    </>
  );
}

function ToggleRow({ icon: Icon, label, description, checked, onChange }: { icon: typeof Bell; label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex min-h-[3.25rem] items-center gap-3 border-b border-territory-border py-2.5 last:border-b-0"><Icon className="h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-territory-ink">{label}</p><p className="hidden text-xs leading-4 text-territory-muted lg:block">{description}</p></div><Switch checked={checked} onCheckedChange={onChange} aria-label={label} className="data-[state=checked]:bg-territory-brand" /></div>;
}

function PrivacyView({ onView }: { onView: (view: AccountView) => void }) {
  const [usage, setUsage] = useState(false);
  const [offers, setOffers] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <>
      <PageHeading title="Suas escolhas, seus dados" mobileTitle="Privacidade e dados" description="Você no controle da sua privacidade." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="p-4 sm:p-5"><h2 className="text-sm font-bold text-territory-ink lg:text-base">Preferências de dados</h2><ToggleRow icon={Bell} label="Medição de uso" description="Ajuda a melhorar o Achegue-se." checked={usage} onChange={setUsage} /><ToggleRow icon={Tag} label="Ofertas e novidades" description="Permite sugestões mais relevantes." checked={offers} onChange={setOffers} /><div className="mt-3 space-y-2 border-t border-territory-border pt-3"><button type="button" onClick={() => undefined} className="block text-sm font-semibold text-blue-700 underline-offset-4 hover:underline">Cookies e permissões <ChevronRight className="inline h-4 w-4" aria-hidden="true" /></button><button type="button" onClick={() => undefined} className="block text-sm font-semibold text-blue-700 underline-offset-4 hover:underline">Histórico de consentimentos <ChevronRight className="inline h-4 w-4" aria-hidden="true" /></button></div></Surface>
        <div className="grid gap-4"><Surface className="p-4 sm:p-5"><div className="flex items-start gap-3"><Download className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><div className="min-w-0 flex-1"><h2 className="text-sm font-bold text-territory-ink">Exportar meus dados</h2><p className="mt-1 text-sm leading-5 text-territory-muted">Baixe uma cópia dos dados disponíveis para sua conta.</p></div></div><button type="button" onClick={() => onView("export")} className="mt-4 min-h-11 w-full rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand hover:bg-territory-brand/5">Exportar</button></Surface><Surface className="p-4 sm:p-5"><div className="flex items-start gap-3"><UserRound className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><div><h2 className="text-sm font-bold text-territory-ink">Visibilidade dos perfis</h2><p className="mt-1 text-sm leading-5 text-territory-muted">Defina o que aparece em cada identidade.</p></div></div><button type="button" onClick={() => onView("profiles")} className="mt-4 min-h-11 w-full rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:brightness-95">Abrir Meus perfis</button></Surface></div>
      </div>
      <Surface className="mt-4 px-4 sm:px-5"><button type="button" onClick={() => undefined} className="flex min-h-14 w-full items-center gap-3 text-left"><FileClock className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><span className="flex-1 text-sm font-semibold text-territory-ink">Falar sobre meus dados</span><ChevronRight className="h-5 w-5 text-territory-muted" aria-hidden="true" /></button></Surface>
      <div className="mt-4 border-t border-territory-border pt-4"><button type="button" onClick={() => setDeleteOpen(true)} className="flex min-h-12 w-full items-center justify-start gap-2 rounded-2xl bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100 lg:w-auto lg:bg-transparent"><Trash2 className="h-5 w-5" aria-hidden="true" />Solicitar exclusão da conta</button></div>
      {deleteOpen ? <DeleteDialog onClose={() => setDeleteOpen(false)} onConfirm={() => { setDeleteOpen(false); onView("deletion"); }} /> : null}
    </>
  );
}

function DeleteDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [acknowledged, setAcknowledged] = useState(false);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-territory-surface p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="delete-title" className="font-heading text-xl font-bold text-territory-ink">Solicitar exclusão da sua conta?</h2><p className="mt-1 text-sm text-territory-muted">Confira o impacto antes de continuar.</p></div><button type="button" onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-territory-raised"><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-3 text-sm text-territory-muted"><p>Você perderá o acesso após a conclusão.</p><p>Revise os perfis e equipes que administra.</p><p>Alguns registros podem ser mantidos conforme as condições aplicáveis.</p></div><button type="button" onClick={() => undefined} className="mt-4 text-sm font-semibold text-blue-700 underline-offset-4 hover:underline">Exportar meus dados antes</button><label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-territory-ink"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-territory-border" /><span>Entendi as consequências da solicitação.</span></label><div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand">Manter minha conta</button><button type="button" onClick={onConfirm} disabled={!acknowledged} className="min-h-11 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Solicitar exclusão</button></div></section></div>;
}

function ExportView({ onView }: { onView: (view: AccountView) => void }) {
  const [started, setStarted] = useState(false);
  return <><PageHeading title="Uma cópia dos seus dados" description="Escolha o que deseja consultar ou exportar." /><Surface className="p-4 sm:p-5"><div className="flex items-start gap-3"><Download className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><div><h2 className="text-sm font-bold text-territory-ink">Dados disponíveis</h2><p className="mt-1 text-sm leading-5 text-territory-muted">O arquivo inclui informações da conta, perfis, preferências e registros compatíveis com a solicitação.</p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-2"><span className="rounded-xl bg-territory-raised p-3 text-sm text-territory-ink">Dados de acesso</span><span className="rounded-xl bg-territory-raised p-3 text-sm text-territory-ink">Perfis e vínculos</span><span className="rounded-xl bg-territory-raised p-3 text-sm text-territory-ink">Preferências</span><span className="rounded-xl bg-territory-raised p-3 text-sm text-territory-ink">Histórico disponível</span></div>{started ? <div className="mt-4 flex items-center gap-3 rounded-xl bg-territory-raised p-3 text-sm text-territory-muted" role="status"><Clock3 className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />Preparando arquivo...</div> : <button type="button" onClick={() => setStarted(true)} className="mt-5 min-h-11 w-full rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:brightness-95">Exportar meus dados</button>}</Surface><Surface className="mt-4 px-4 sm:px-5"><button type="button" onClick={() => onView("privacy")} className="flex min-h-14 w-full items-center gap-3 text-left"><CircleHelp className="h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" /><span className="flex-1 text-sm font-semibold text-territory-brand">Preciso de ajuda <ChevronRight className="inline h-4 w-4" aria-hidden="true" /></span></button></Surface></>;
}

function DeletionView({ onView }: { onView: (view: AccountView) => void }) {
  return <><div className="mb-4 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 className="h-8 w-8" aria-hidden="true" /></span><h1 className="mt-4 font-heading text-[1.45rem] font-bold leading-tight tracking-[-0.035em] text-territory-ink">Exclusão da conta solicitada</h1><p className="mt-1 text-sm leading-5 text-territory-muted">Consulte o andamento e as opções disponíveis.</p></div><div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />Solicitação registrada</div><Surface className="mt-4 p-4 sm:p-5"><h2 className="text-base font-bold text-territory-ink">Antes da conclusão</h2><p className="mt-2 text-sm leading-5 text-territory-muted">A exclusão será processada conforme as condições apresentadas na solicitação.</p><div className="mt-4 rounded-xl bg-territory-raised p-3 text-sm leading-5 text-territory-muted">Você pode cancelar a solicitação enquanto o cancelamento for permitido.</div></Surface><button type="button" onClick={() => onView("privacy")} className="mt-4 min-h-12 w-full rounded-xl bg-territory-brand px-4 text-sm font-bold text-white hover:bg-territory-brand/90">Cancelar solicitação</button><button type="button" onClick={() => onView("export")} className="mt-2 min-h-11 w-full text-sm font-semibold text-territory-brand hover:underline"><Download className="mr-2 inline h-4 w-4" aria-hidden="true" />Exportar meus dados</button><Surface className="mt-4 px-4 sm:px-5"><button type="button" onClick={() => undefined} className="flex min-h-14 w-full items-center gap-3 text-left"><CircleHelp className="h-5 w-5 shrink-0" aria-hidden="true" /><span className="flex-1 text-sm font-semibold text-territory-brand">Preciso de ajuda <ChevronRight className="inline h-4 w-4" aria-hidden="true" /></span></button></Surface></>;
}

function ProfilesView({ onView }: { onView: (view: AccountView) => void }) {
  return <><PageHeading title="Meus perfis" description="Identidades, equipes e visibilidade pública." /><Surface className="p-4 sm:p-5"><div className="flex items-center gap-3"><img src={personalImage} alt="" className="h-14 w-14 rounded-full object-cover" /><div><h2 className="font-heading text-base font-bold text-territory-ink">Ana Oliveira</h2><p className="text-sm text-territory-muted">Perfil pessoal · Salvador, BA</p></div></div><button type="button" onClick={() => onView("overview")} className="mt-5 min-h-11 w-full rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand">Voltar para Minha conta</button></Surface></>;
}

export default function ContaConceptMockPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const view = getView(location.pathname, location.hash);
  const setView = (nextView: AccountView) => {
    const target = navItems.find((item) => item.view === nextView);
    if (target) {
      navigate(href(target.path, target.hash));
      return;
    }
    if (nextView === "mfa") navigate(href("/conta/seguranca", "#mfa"));
    if (nextView === "export") navigate(href("/conta/privacidade", "#exportar"));
    if (nextView === "deletion") navigate(href("/conta/privacidade", "#exclusao"));
  };
  const title = view === "overview" ? "Minha conta" : view === "access" ? "Dados de acesso" : view === "security" ? "Senha e segurança" : view === "mfa" ? "Configurar autenticação" : view === "notifications" ? "Notificações" : view === "privacy" ? "Privacidade e dados" : view === "export" ? "Uma cópia dos seus dados" : view === "deletion" ? "Exclusão da conta solicitada" : "Meus perfis";

  return <><Helmet><title>{title} | Achegue-se</title><meta name="robots" content="noindex, nofollow" /></Helmet><AccountMockShell view={view}>{view === "overview" ? <AccountOverview onView={setView} /> : view === "access" ? <AccessView onView={setView} /> : view === "security" ? <SecurityView onView={setView} /> : view === "mfa" ? <MfaView onView={setView} /> : view === "notifications" ? <NotificationView /> : view === "privacy" ? <PrivacyView onView={setView} /> : view === "export" ? <ExportView onView={setView} /> : view === "deletion" ? <DeletionView onView={setView} /> : <ProfilesView onView={setView} />}</AccountMockShell></>;
}
