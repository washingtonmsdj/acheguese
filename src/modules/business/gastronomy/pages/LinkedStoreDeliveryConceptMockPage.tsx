import { useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bike,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CloudAlert,
  Clock3,
  FileText,
  Handshake,
  Home,
  Info,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MoreVertical,
  Navigation,
  Package,
  RefreshCw,
  Store,
  Truck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MiniMap } from "@/shared/components/maps/MiniMap";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";
import driverImage from "@/assets/persona-prestador.jpg";

type LinkedView =
  | "offer"
  | "pickup"
  | "start"
  | "delivery"
  | "recipient"
  | "problem"
  | "offline"
  | "complete";

type ProofMethod = "recipient" | "authorized" | "location";

const LINKED_ROUTE: Array<[number, number]> = [
  [-38.4937, -12.9788],
  [-38.4915, -12.9778],
  [-38.489, -12.976],
  [-38.486, -12.9748],
  [-38.4821, -12.9714],
];

const storeData = {
  name: "Sabores da Ana",
  address: "Rua Exemplo, 80",
  city: "Santa Cruz · Salvador",
};

const recipientData = {
  name: "Ana Oliveira",
  address: "Rua Exemplo, 120 · Casa 2",
  city: "Nordeste de Amaralina · Salvador · BA",
  reference: "portão azul",
};

function SurfaceCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[#d8e1df] bg-white shadow-[0_1px_2px_rgba(5,45,49,0.04)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function Notice({
  children,
  tone = "blue",
  className,
}: {
  children: ReactNode;
  tone?: "blue" | "yellow" | "green" | "red";
  className?: string;
}) {
  const tones = {
    blue: "bg-[#edf5fb] text-[#164873]",
    yellow: "bg-[#fff4d3] text-[#604900]",
    green: "bg-[#e8f7ef] text-[#075842]",
    red: "bg-[#fff0ef] text-[#8f2828]",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2 text-xs leading-snug",
        tones[tone],
        className,
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function StatusPill({
  children,
  tone = "green",
  className,
}: {
  children: ReactNode;
  tone?: "green" | "yellow" | "blue";
  className?: string;
}) {
  const toneClass = {
    green: "bg-[#dff5e9] text-[#075c45]",
    yellow: "bg-[#fff0b8] text-[#614600]",
    blue: "bg-[#e1efff] text-[#14559c]",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-bold leading-none",
        toneClass,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function StoreIdentity({ compact = false, showAddress = false, hideSubtitle = false }: { compact?: boolean; showAddress?: boolean; hideSubtitle?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <img
        src={foodImage}
        alt=""
        className={cn(
          "shrink-0 rounded-xl object-cover",
          compact ? "h-10 w-10" : "h-11 w-11",
        )}
      />
      <div className="min-w-0">
        <p className={cn("truncate font-bold", compact ? "text-sm max-[340px]:text-xs" : "text-base")}>
          {storeData.name}
        </p>
        {!hideSubtitle && <p className="truncate text-xs text-territory-muted">Comida caseira</p>}
        {showAddress && <>
          <p className="truncate text-xs text-territory-muted">{storeData.address}</p>
          <p className="truncate text-xs text-territory-muted">{storeData.city}</p>
        </>}
      </div>
    </div>
  );
}

function ProfileChip({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <img
        src={driverImage}
        alt="Carlos Santos"
        className={cn(
          "shrink-0 rounded-full object-cover",
          mobile ? "h-8 w-8" : "h-7 w-7",
        )}
      />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-xs font-bold">Carlos Santos</p>
        <p className="truncate text-[0.62rem] text-territory-muted">Motoboy</p>
      </div>
      {!mobile && <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
    </div>
  );
}

const desktopNav: Array<{ label: string; icon: LucideIcon; active?: boolean }> = [
  { label: "Início", icon: Home },
  { label: "Minhas lojas", icon: Store },
  { label: "Entregas", icon: Truck, active: true },
  { label: "Ganhos", icon: ClipboardList },
  { label: "Perfil", icon: UserRound },
  { label: "Ajuda", icon: CircleHelp },
];

function DesktopShell({
  children,
  onNavigate,
}: {
  children: ReactNode;
  onNavigate: (view: LinkedView) => void;
}) {
  return (
    <div className="hidden h-[100dvh] min-h-0 overflow-hidden bg-[#fbfaf7] text-territory-ink md:flex">
      <aside className="flex h-full w-40 shrink-0 flex-col bg-[#064e4d] px-2 py-4 text-white">
        <div className="px-2 pb-5 font-heading text-[1.05rem] font-extrabold tracking-[-0.05em]">
          achegue-se<span className="text-territory-sun">.</span>
        </div>
        <nav className="space-y-1.5">
          {desktopNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => item.label === "Entregas" && onNavigate("offer")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[0.68rem] font-semibold transition-colors",
                  item.active
                    ? "bg-territory-sun text-territory-ink"
                    : "text-white/90 hover:bg-white/10",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto px-2 text-[0.56rem] leading-tight text-white/75">
          <p>Mais entregas.</p>
          <p>Mais oportunidades</p>
          <p>para a sua jornada.</p>
          <span className="mt-2 block h-0.5 w-7 bg-territory-sun" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-10 shrink-0 items-center justify-between border-b border-[#d8e1df] bg-white px-4">
          <span className="inline-flex items-center gap-2 rounded-md bg-[#e3f4ed] px-2.5 py-1 text-[0.68rem] font-semibold text-[#075842]">
            <Users className="h-3.5 w-3.5" />
            Equipe da loja integrada
          </span>
          <ProfileChip />
        </header>
        <main className="min-h-0 flex-1 overflow-hidden p-4">{children}</main>
      </div>
    </div>
  );
}

function MobileShell({
  children,
  title,
  onBack,
  darkHeader = false,
}: {
  children: ReactNode;
  title: string;
  onBack: () => void;
  darkHeader?: boolean;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#fbfaf7] text-territory-ink md:hidden">
      <header className={cn("flex h-12 shrink-0 items-center justify-between border-b px-4 max-[340px]:px-3", darkHeader ? "border-[#064e4d] bg-[#064e4d] text-white" : "border-[#d8e1df] bg-white")}>
        <button
          type="button"
          onClick={onBack}
          className="grid h-8 w-8 place-items-center rounded-full"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="truncate px-3 text-base font-extrabold">{title}</p>
        <button
          type="button"
          onClick={() => toast.info("Mais ações ficarão disponíveis conforme o status da entrega.")}
          className="grid h-8 w-8 place-items-center rounded-full"
          aria-label="Mais ações"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-3 pt-3 max-[340px]:px-3 max-[340px]:pb-2">
        {children}
      </main>
    </div>
  );
}

function RouteSummary({ mobile = false, includePackage = false }: { mobile?: boolean; includePackage?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-[#d8e1df] bg-white", mobile ? "p-3 max-[340px]:p-2.5" : "p-4")}>
      <div className="grid grid-cols-[1.2rem_1fr] gap-x-2.5 gap-y-3 max-[340px]:gap-y-2">
        <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#e6f7f0] text-[#08765a]">
          <MapPin className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-xs font-bold">Coleta</p>
          <p className="text-xs text-territory-muted">{storeData.name}</p>
          <p className="text-xs text-territory-muted">
            {storeData.address} · {storeData.city}
          </p>
        </div>
        <span className="relative mt-[-0.5rem] ml-[0.55rem] h-5 w-px border-l border-dashed border-[#0c6c5d]" />
        <div>
          <p className="text-xs font-bold">Destino</p>
          <p className="text-xs text-territory-muted">{recipientData.name}</p>
          <p className="text-xs text-territory-muted">
            {recipientData.address} · {recipientData.city}
          </p>
        </div>
      </div>
      {includePackage && (
        <div className="mt-3 border-t border-[#d8e1df]">
          <PackageSummary compact />
        </div>
      )}
    </div>
  );
}

function PackageSummary({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", compact ? "p-3" : "p-4")}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f0f5f7] text-territory-ink">
        <Package className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-bold">Pacote</p>
        <p className="text-xs text-territory-muted">Refeição · 1 sacola</p>
      </div>
    </div>
  );
}

function MapWithLabels({
  height,
  markerOnly = false,
  className,
}: {
  height: string;
  markerOnly?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <MiniMap
        latitude={-12.9751}
        longitude={-38.487}
        routeCoordinates={markerOnly ? undefined : LINKED_ROUTE}
        routeStartColor="#fbbf24"
        routeEndColor="#064e3b"
        title="Entrega #1043"
        description="Acompanhamento autorizado"
        height={height}
        showControls={false}
        interactive={false}
      />
      <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[0.62rem] font-semibold text-territory-muted shadow-sm">
        <RefreshCw className="h-3 w-3" /> Atualizado há 15 s
      </span>
      <span className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-white/95 px-2 py-1 text-[0.62rem] leading-tight text-territory-ink shadow-sm">
        <b className="block">Santa Cruz</b>
        <span className="text-territory-muted">Coleta</span>
      </span>
      <span className="pointer-events-none absolute bottom-2 right-2 rounded-lg bg-white/95 px-2 py-1 text-right text-[0.62rem] leading-tight text-territory-ink shadow-sm">
        <b className="block">Nordeste de Amaralina</b>
        <span className="text-territory-muted">Destino</span>
      </span>
    </div>
  );
}

function DesktopPageTitle({
  title,
  subtitle,
  status,
}: {
  title: string;
  subtitle?: string;
  status?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#d8e1df] pb-2">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-extrabold tracking-[-0.04em]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-territory-muted">{subtitle}</p>}
      </div>
      {status}
    </div>
  );
}

function DesktopOffer({ onNavigate }: { onNavigate: (view: LinkedView) => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <DesktopPageTitle title="Nova entrega #1043" subtitle={storeData.name} />
      <SurfaceCard className="p-4">
        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(15rem,.85fr)] gap-3">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#d8e1df] pb-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e1f5ed] text-[#075c45]"><Users className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-bold">Equipe da loja integrada</p>
                <p className="text-xs text-territory-muted">Solicitação para um entregador vinculado à loja.</p>
              </div>
            </div>
            <RouteSummary />
          </div>
          <div className="space-y-3">
            <SurfaceCard className="p-3"><p className="text-xs font-bold">Itens da entrega</p><div className="mt-3 flex items-center gap-2 text-xs"><Package className="h-5 w-5 shrink-0" /><span>Refeição · 1 sacola</span></div></SurfaceCard>
            <SurfaceCard className="p-3"><p className="text-xs font-bold">Remuneração</p><div className="mt-3 flex items-center gap-2 text-xs"><Handshake className="h-5 w-5 shrink-0" /><span>Conforme acordo com a loja</span></div></SurfaceCard>
          </div>
        </div>
        <div className="mt-4">
          <div className="grid grid-cols-[1fr_1.35fr_1fr] gap-2">
            <Button type="button" variant="outline" onClick={() => toast.info("Conversa aberta na demonstração.")} className="h-9 !min-h-0 border-territory-border bg-white px-2 text-xs text-territory-ink"><MessageCircle className="h-4 w-4" />Falar com a loja</Button>
            <Button type="button" onClick={() => onNavigate("pickup")} className="h-9 !min-h-0 bg-territory-sun px-2 text-xs text-territory-ink hover:bg-territory-sun/85"><Check className="h-4 w-4" />Aceitar entrega</Button>
            <Button type="button" variant="outline" onClick={() => toast.info("Solicitação recusada na demonstração.")} className="h-9 !min-h-0 border-territory-border bg-white px-2 text-xs text-territory-ink"><X className="h-4 w-4" />Recusar</Button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1 text-[0.66rem] text-territory-muted"><Info className="h-3.5 w-3.5" />Recusar a solicitação não cancela o pedido do cliente.</p>
        </div>
      </SurfaceCard>
    </div>
  );
}

function DesktopProgress({ onNavigate }: { onNavigate: (view: LinkedView) => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <DesktopPageTitle title="Entrega #1043" subtitle="Siga o roteiro e conclua com segurança." status={<StatusPill tone="blue">Em entrega</StatusPill>} />
      <div className="grid grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)] gap-3">
        <SurfaceCard className="flex min-h-0 flex-col p-3">
          <MapWithLabels height="clamp(19rem, calc(100dvh - 26rem), 25rem)" />
        </SurfaceCard>
        <SurfaceCard className="flex min-h-0 flex-col p-3">
          <div className="flex items-start gap-3 border-b border-[#d8e1df] pb-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#edf2f5] text-territory-ink"><UserRound className="h-5 w-5" /></span>
            <div><p className="text-sm font-bold">{recipientData.name}</p><p className="text-xs text-territory-muted">{recipientData.address}</p><p className="text-xs text-territory-muted">{recipientData.city}</p><p className="mt-1 text-xs text-territory-muted">Referência: {recipientData.reference}</p></div>
          </div>
          <div className="my-4 grid grid-cols-3 items-start text-center text-[0.65rem]">
            <div><span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-territory-brand text-white"><Check className="h-3.5 w-3.5" /></span><b className="mt-1 block">Coleta</b><span className="text-territory-muted">Concluída</span></div>
            <div className="relative before:absolute before:left-[-50%] before:right-1/2 before:top-3 before:border-t-2 before:border-territory-brand"><span className="relative mx-auto grid h-6 w-6 place-items-center rounded-full border-2 border-territory-brand bg-white"><span className="h-2 w-2 rounded-full bg-territory-brand" /></span><b className="mt-1 block">Entrega</b><span className="text-blue-700">Em andamento</span></div>
            <div className="relative before:absolute before:left-0 before:right-1/2 before:top-3 before:border-t-2 before:border-[#d3dcdf]"><span className="relative mx-auto grid h-6 w-6 place-items-center rounded-full border-2 border-[#c9d3dd] bg-white" /><b className="mt-1 block">Conclusão</b><span className="text-territory-muted">Pendente</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => toast.info("Navegação aberta na demonstração.")} className="h-9 !min-h-0 border-territory-border bg-white px-2 text-xs text-territory-ink"><Navigation className="h-4 w-4" />Abrir navegação</Button>
            <Button type="button" variant="outline" onClick={() => toast.info("Conversa aberta na demonstração.")} className="h-9 !min-h-0 border-territory-border bg-white px-2 text-xs text-territory-ink"><MessageCircle className="h-4 w-4" />Falar com destinatário</Button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button type="button" onClick={() => onNavigate("recipient")} className="h-9 !min-h-0 bg-territory-sun px-2 text-xs text-territory-ink hover:bg-territory-sun/85"><Check className="h-4 w-4" />Registrar recebimento</Button>
            <Button type="button" variant="outline" onClick={() => onNavigate("problem")} className="h-9 !min-h-0 border-territory-border bg-white px-2 text-xs text-territory-ink"><AlertTriangle className="h-4 w-4" />Registrar problema</Button>
          </div>
          <div className="mt-auto border-t border-[#d8e1df] pt-3">
            <p className="text-xs font-bold">Contato da loja</p>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-[#f5f8f8] px-2.5 py-2"><Store className="h-4 w-4" /><span className="min-w-0 flex-1 px-2 text-xs font-semibold">{storeData.name}</span><button type="button" onClick={() => toast.info("Conversa aberta na demonstração.")} className="rounded-md border border-territory-border bg-white px-2 py-1 text-[0.65rem] font-bold">Falar com a loja</button></div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

function DesktopRecipient({ onNavigate }: { onNavigate: (view: LinkedView) => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <DesktopPageTitle title="Registrar recebimento · #1043" subtitle={storeData.name} />
      <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(16rem,.95fr)] items-start gap-3">
        <SurfaceCard className="p-4">
          <label className="block text-xs font-bold">Como foi entregue?
            <div className="relative mt-1"><select defaultValue="authorized" className="h-9 w-full appearance-none rounded-lg border border-territory-border bg-white px-3 pr-8 text-xs font-normal"><option value="recipient">Ao destinatário</option><option value="authorized">A pessoa autorizada</option><option value="location">Em local autorizado</option></select><ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4" /></div>
          </label>
          <label className="mt-3 block text-xs font-bold">Quem recebeu? <span className="text-red-600">*</span><input defaultValue="Paulo Santos" className="mt-1 h-9 w-full rounded-lg border border-territory-border bg-white px-3 text-xs font-normal" /></label>
          <label className="mt-3 block text-xs font-bold">Relação ou função <span className="text-red-600">*</span><input defaultValue="Portaria" className="mt-1 h-9 w-full rounded-lg border border-territory-border bg-white px-3 text-xs font-normal" /></label>
          <label className="mt-3 block text-xs font-bold">Observação <span className="text-red-600">*</span><textarea defaultValue="Entregue ao porteiro indicado pela destinatária." className="mt-1 h-20 w-full resize-none rounded-lg border border-territory-border bg-white p-3 text-xs font-normal" /></label>
          <div className="mt-3 flex gap-2"><Button type="button" variant="outline" onClick={() => onNavigate("delivery")} className="h-9 !min-h-0 flex-1 border-territory-border bg-white text-xs text-territory-ink"><ArrowLeft className="h-4 w-4" />Voltar</Button><Button type="button" onClick={() => onNavigate("complete")} className="h-9 !min-h-0 flex-1 bg-territory-sun text-xs text-territory-ink hover:bg-territory-sun/85"><Check className="h-4 w-4" />Confirmar entrega</Button></div>
        </SurfaceCard>
        <div className="flex min-h-0 flex-col gap-3">
          <SurfaceCard className="p-4"><div className="flex items-start gap-3"><FileText className="h-5 w-5 shrink-0" /><div><p className="text-sm font-bold">Autorização da destinatária</p><p className="mt-1 text-xs text-territory-muted">Ana autorizou Paulo na portaria.</p><button type="button" className="mt-2 text-xs font-bold text-blue-700">Ver autorização <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button></div></div></SurfaceCard>
          <Notice>Este pedido não exige código.</Notice>
          <SurfaceCard className="flex items-center gap-2 p-3 text-xs text-territory-muted"><Camera className="h-5 w-5 shrink-0" />Foto não exigida nesta entrega.</SurfaceCard>
        </div>
      </div>
    </div>
  );
}

function DesktopProblem({ onNavigate }: { onNavigate: (view: LinkedView) => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <DesktopPageTitle title="Registrar problema · #1043" subtitle={storeData.name} status={<StatusPill tone="blue">Em entrega</StatusPill>} />
      <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(16rem,.95fr)] items-start gap-3">
        <SurfaceCard className="p-4">
          <label className="block text-xs font-bold">Motivo <span className="text-red-600">*</span><div className="relative mt-1"><select defaultValue="absent" className="h-9 w-full appearance-none rounded-lg border border-territory-border bg-white px-3 pr-8 text-xs font-normal"><option value="absent">Destinatário ausente</option><option>Endereço não encontrado</option><option>Endereço inacessível</option></select><ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4" /></div></label>
          <label className="mt-3 block text-xs font-bold">Descreva o ocorrido <span className="text-red-600">*</span><textarea defaultValue="Não encontrei ninguém no endereço." className="mt-1 h-28 w-full resize-none rounded-lg border border-territory-border bg-white p-3 text-xs font-normal" /></label>
          <div className="mt-3 flex gap-2"><Button type="button" variant="outline" onClick={() => onNavigate("delivery")} className="h-9 !min-h-0 flex-1 border-territory-border bg-white text-xs text-territory-ink"><ArrowLeft className="h-4 w-4" />Voltar à entrega</Button><Button type="button" onClick={() => toast.success("Problema registrado na demonstração.")} className="h-9 !min-h-0 flex-1 bg-[#d65b5b] text-xs text-white hover:bg-[#c94d4d]"><AlertTriangle className="h-4 w-4" />Registrar problema</Button></div>
        </SurfaceCard>
        <div className="flex min-h-0 flex-col gap-3">
          <SurfaceCard className="p-4"><p className="text-sm font-bold">Tente contato quando possível</p><div className="mt-3 grid gap-2"><Button type="button" variant="outline" onClick={() => toast.info("Conversa aberta na demonstração.")} className="h-8 !min-h-0 border-territory-border bg-white text-xs text-territory-ink"><MessageCircle className="h-4 w-4" />Falar com destinatário</Button><Button type="button" variant="outline" onClick={() => toast.info("Conversa aberta na demonstração.")} className="h-8 !min-h-0 border-territory-border bg-white text-xs text-territory-ink"><Store className="h-4 w-4" />Falar com a loja</Button></div></SurfaceCard>
          <Notice tone="yellow"><b>Não deixe o pedido em local sem autorização.</b></Notice>
          <Notice>O registro do problema não confirma entrega nem pagamento.</Notice>
        </div>
      </div>
    </div>
  );
}

function MobileTopStoreCard({ proof = false }: { proof?: boolean }) {
  return (
    <SurfaceCard className="flex items-center justify-between gap-2 p-3">
      {proof ? (
        <div className="flex min-w-0 items-center gap-2.5">
          <img src={foodImage} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{storeData.name}</p>
            <p className="truncate text-xs text-territory-muted">Equipe da loja integrada</p>
          </div>
        </div>
      ) : (
        <StoreIdentity compact />
      )}
      {!proof && <StatusPill className="shrink-0 max-[340px]:gap-1 max-[340px]:px-1.5 max-[340px]:text-[0.5rem]">Equipe da loja integrada</StatusPill>}
    </SurfaceCard>
  );
}

function MobileOffer({ onNavigate }: { onNavigate: (view: LinkedView) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-3 max-[340px]:gap-2">
      <MobileTopStoreCard />
      <h1 className="font-heading text-xl font-extrabold tracking-[-0.04em]">Nova oferta</h1>
      <RouteSummary mobile includePackage />
      <SurfaceCard className="overflow-hidden p-0"><MapWithLabels height="clamp(8.25rem, 37vw, 9rem)" /></SurfaceCard>
      <div className="flex items-center gap-3 rounded-xl bg-[#edf5fb] p-3 text-sm text-[#164873]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/80"><Handshake className="h-4 w-4" /></span><p>Remuneração conforme acordo com a loja.</p></div>
      <div className="grid gap-2"><Button type="button" variant="outline" onClick={() => toast.info("Conversa aberta na demonstração.")} className="h-10 !min-h-0 border-territory-border bg-white text-sm text-territory-ink"><MessageCircle className="h-4 w-4" />Falar com a loja</Button><Button type="button" onClick={() => onNavigate("pickup")} className="h-11 !min-h-0 bg-territory-sun text-sm text-territory-ink hover:bg-territory-sun/85"><Check className="h-4 w-4" />Aceitar entrega</Button><Button type="button" variant="outline" onClick={() => toast.info("Solicitação recusada na demonstração.")} className="h-10 !min-h-0 border-territory-border bg-white text-sm text-territory-ink"><X className="h-4 w-4" />Recusar</Button></div>
      <p className="flex items-center justify-center gap-1 text-[0.68rem] text-territory-muted"><Info className="h-3.5 w-3.5" />Recusar não cancela o pedido do cliente.</p>
    </div>
  );
}

function MobilePickup({ onNavigate }: { onNavigate: (view: LinkedView) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-3 max-[340px]:gap-2">
      <div className="flex justify-center"><StatusPill tone="blue"><Truck className="h-3.5 w-3.5" />A caminho da coleta</StatusPill></div>
      <SurfaceCard className="overflow-hidden p-0"><MapWithLabels height="clamp(13.5rem, calc(100dvh - 35rem), 18rem)" /></SurfaceCard>
      <SurfaceCard className="p-3"><StoreIdentity showAddress hideSubtitle /></SurfaceCard>
      <Button type="button" onClick={() => toast.info("Navegação aberta na demonstração.")} className="h-11 !min-h-0 bg-territory-brand text-sm text-white hover:bg-territory-brand/90"><Navigation className="h-4 w-4" />Abrir navegação</Button>
      <SurfaceCard className="space-y-2 p-3 text-sm"><label className="flex items-center gap-2"><span className="h-5 w-5 rounded border border-territory-border" />Confira o número do pedido</label><label className="flex items-center gap-2"><span className="h-5 w-5 rounded border border-territory-border" />Confira 1 volume e o lacre</label></SurfaceCard>
      <Notice>Não abra a embalagem lacrada.</Notice>
      <Button type="button" variant="outline" onClick={() => toast.info("Conversa aberta na demonstração.")} className="h-10 !min-h-0 border-territory-border bg-white text-sm text-territory-ink"><MessageCircle className="h-4 w-4" />Falar com a loja</Button>
      <Button type="button" onClick={() => onNavigate("start")} className="h-11 !min-h-0 bg-territory-sun text-sm text-territory-ink hover:bg-territory-sun/85"><Check className="h-4 w-4" />Confirmar coleta</Button>
      <button type="button" onClick={() => onNavigate("problem")} className="text-center text-sm font-bold text-territory-ink underline">Registrar problema</button>
    </div>
  );
}

function MobileStart({ onNavigate }: { onNavigate: (view: LinkedView) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-3 max-[340px]:gap-2">
      <div className="flex justify-center"><StatusPill tone="green"><Check className="h-3.5 w-3.5" />Coleta confirmada</StatusPill></div>
      <SurfaceCard className="flex items-center gap-3 border-[#c9ead9] bg-[#e8f7ef] p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#43b879] text-white"><Check className="h-5 w-5" /></span><div><p className="text-sm font-bold">Pedido coletado na loja</p><p className="text-xs text-[#075842]">{storeData.name} · 10:12</p></div></SurfaceCard>
      <SurfaceCard className="flex items-center gap-3 p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#edf2f5]"><UserRound className="h-5 w-5" /></span><div className="min-w-0"><p className="text-sm font-bold">{recipientData.name}</p><p className="text-xs text-territory-muted">{recipientData.address}</p><p className="text-xs text-territory-muted">{recipientData.city}</p><p className="text-xs text-territory-muted">Referência: {recipientData.reference}</p></div><ChevronRight className="ml-auto h-4 w-4 shrink-0" /></SurfaceCard>
      <SurfaceCard className="divide-y divide-[#d8e1df] p-0"><PackageSummary compact /><div className="flex items-center gap-3 p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f0f5f7]"><FileText className="h-5 w-5" /></span><div><p className="text-sm font-bold">Orientação do pedido</p><p className="text-xs text-territory-muted">Entregar em mãos</p></div></div></SurfaceCard>
      <Notice>A próxima etapa é seguir ao destino.</Notice>
      <div className="mt-auto grid gap-2 pb-24 max-[340px]:pb-20">
        <Button type="button" onClick={() => onNavigate("delivery")} className="h-11 !min-h-0 bg-territory-sun text-sm text-territory-ink hover:bg-territory-sun/85">Iniciar entrega <ArrowRight className="h-4 w-4" /></Button>
        <Button type="button" variant="outline" onClick={() => toast.info("Detalhes do pedido serão abertos.")} className="h-10 !min-h-0 border-territory-border bg-white text-sm text-territory-ink"><ClipboardList className="h-4 w-4" />Ver detalhes</Button>
      </div>
    </div>
  );
}

function MobileDelivery({ onNavigate }: { onNavigate: (view: LinkedView) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-3 max-[340px]:gap-2">
      <div className="flex justify-center"><StatusPill tone="yellow"><Bike className="h-3.5 w-3.5" />Em entrega</StatusPill></div>
      <SurfaceCard className="overflow-hidden p-0"><MapWithLabels height="clamp(13.5rem, calc(100dvh - 33.5rem), 19rem)" /></SurfaceCard>
      <SurfaceCard className="flex items-center gap-3 p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#edf2f5]"><UserRound className="h-5 w-5" /></span><div className="min-w-0"><p className="text-sm font-bold">{recipientData.name}</p><p className="text-xs text-territory-muted">{recipientData.address}</p><p className="text-xs text-territory-muted">{recipientData.city}</p><p className="text-xs text-territory-muted">Referência: {recipientData.reference}</p></div><ChevronRight className="ml-auto h-4 w-4 shrink-0" /></SurfaceCard>
      <div className="grid grid-cols-2 gap-2"><Button type="button" onClick={() => toast.info("Navegação aberta na demonstração.")} className="h-10 !min-h-0 bg-territory-brand px-2 text-xs text-white hover:bg-territory-brand/90"><Navigation className="h-4 w-4" />Abrir navegação</Button><Button type="button" variant="outline" onClick={() => toast.info("Conversa aberta na demonstração.")} className="h-10 !min-h-0 border-territory-border bg-white px-2 text-xs text-territory-ink"><MessageCircle className="h-4 w-4" />Falar com destinatário</Button></div>
      <SurfaceCard className="flex items-center gap-3 p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f0f5f7]"><FileText className="h-5 w-5" /></span><div><p className="text-sm font-bold">Comprovante</p><p className="text-xs text-territory-muted">Registre quem recebeu e como foi entregue.</p></div></SurfaceCard>
      <Button type="button" onClick={() => onNavigate("recipient")} className="h-11 !min-h-0 bg-territory-sun text-sm text-territory-ink hover:bg-territory-sun/85"><Check className="h-4 w-4" />Registrar recebimento</Button>
      <Button type="button" variant="outline" onClick={() => onNavigate("problem")} className="h-10 !min-h-0 border-territory-border bg-white text-sm text-territory-ink"><AlertTriangle className="h-4 w-4" />Registrar problema</Button>
      <Notice>Use o aplicativo com a moto parada.</Notice>
    </div>
  );
}

function MobileProof({ onNavigate, initialMethod = "recipient" }: { onNavigate: (view: LinkedView) => void; initialMethod?: ProofMethod }) {
  const [method, setMethod] = useState<ProofMethod>(initialMethod);
  const [code, setCode] = useState("");
  const [observation, setObservation] = useState("Entregue em mãos à destinatária.");
  const [recipientName, setRecipientName] = useState("Ana Oliveira");
  const [relation, setRelation] = useState("");
  const [photoAdded, setPhotoAdded] = useState(false);
  const authorized = method === "authorized";
  const location = method === "location";
  const canSubmit = method === "recipient" ? Boolean(code.trim() && observation.trim() && recipientName.trim()) : authorized ? Boolean(relation.trim() && observation.trim()) : Boolean(photoAdded && observation.trim());

  return (
    <div className="flex flex-1 flex-col gap-3 max-[340px]:gap-2">
      <MobileTopStoreCard proof />
      <SurfaceCard className="p-3"><label className="block text-sm font-bold">Como foi entregue?<div className="relative mt-1"><select value={method} onChange={(event) => setMethod(event.target.value as ProofMethod)} className="h-11 w-full appearance-none rounded-lg border border-territory-border bg-white px-3 pr-8 text-sm font-normal"><option value="recipient">Ao destinatário</option><option value="authorized">A pessoa autorizada</option><option value="location">Em local autorizado</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4" /></div></label>
        {location && <div className="mt-3 rounded-xl bg-[#edf7f2] p-3"><p className="flex items-center gap-2 text-sm font-bold"><LockKeyhole className="h-4 w-4" />Autorizado pelo destinatário</p><p className="mt-1 text-xs text-territory-muted">Deixar na prateleira da portaria.</p><button type="button" className="mt-2 text-xs font-bold text-blue-700">Ver autorização <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button></div>}
        {location && <div className="mt-3"><p className="text-sm font-bold">Foto do pacote <span className="text-red-600">*</span></p><button type="button" onClick={() => setPhotoAdded((value) => !value)} className={cn("mt-1 flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs", photoAdded ? "border-territory-brand bg-[#e8f7ef] text-[#075c45]" : "border-territory-border bg-[#fafcfc] text-territory-muted")}><Camera className="h-6 w-6" />{photoAdded ? "Foto adicionada" : "Toque para adicionar um arquivo"}</button><p className="mt-1 text-[0.68rem] text-territory-muted">Fotografe o pacote e apenas o contexto necessário.</p></div>}
        {!location && <label className="mt-4 block text-sm font-bold">Quem recebeu? <span className="text-red-600">*</span><input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-territory-border bg-white px-3 text-sm font-normal" /></label>}
        {authorized && <label className="mt-4 block text-sm font-bold">Relação ou função <span className="text-red-600">*</span><input value={relation} onChange={(event) => setRelation(event.target.value)} placeholder="Ex.: portaria" className="mt-1 h-11 w-full rounded-lg border border-territory-border bg-white px-3 text-sm font-normal" /></label>}
        {method === "recipient" && <label className="mt-4 block text-sm font-bold">Código de entrega <span className="text-red-600">*</span><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Informe o código do destinatário" inputMode="numeric" className="mt-1 h-11 w-full rounded-lg border border-territory-border bg-white px-3 text-sm font-normal" /><span className="mt-1 block text-xs font-normal text-territory-muted">Exigido neste pedido. Peça apenas no momento da entrega.</span></label>}
        <label className="mt-4 block text-sm font-bold">Observação <span className="text-red-600">*</span><textarea value={observation} onChange={(event) => setObservation(event.target.value)} className={cn("mt-1 w-full resize-none rounded-lg border border-territory-border bg-white p-3 text-sm font-normal", location ? "h-16" : "h-20")} /></label>
      </SurfaceCard>
      {!location && method === "recipient" && <Notice>Foto não exigida nesta entrega.</Notice>}
      {location && <Notice tone="blue">Este método depende da autorização e das regras do pedido.</Notice>}
      <div className="mt-auto grid gap-2"><Button type="button" disabled={!canSubmit} onClick={() => onNavigate("complete")} className="h-11 !min-h-0 bg-territory-sun text-sm text-territory-ink hover:bg-territory-sun/85">{location ? "Confirmar entrega" : "Validar e concluir"} <Check className="h-4 w-4" /></Button><button type="button" onClick={() => onNavigate("delivery")} className="h-9 text-sm font-bold underline">{method === "recipient" ? "Problema com o código" : "Voltar à entrega"}</button></div>
    </div>
  );
}

function MobileOffline({ onNavigate }: { onNavigate: (view: LinkedView) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-3 max-[340px]:gap-2">
      <div className="flex flex-1 flex-col items-center justify-center text-center"><span className="grid h-20 w-20 place-items-center rounded-full bg-[#fff0bd] text-[#b77900]"><CloudAlert className="h-10 w-10" /></span><h1 className="mt-4 font-heading text-xl font-extrabold">Conexão interrompida</h1><p className="mt-1 text-sm text-territory-muted">Ainda não confirmamos a conclusão.</p><SurfaceCard className="mt-5 w-full p-3 text-left"><p className="flex items-center gap-2 text-sm font-bold"><FileText className="h-5 w-5" />Preenchimento preservado</p><p className="mt-2 text-xs text-territory-muted">Recebedora: Ana Oliveira</p><p className="text-xs text-territory-muted">Entregue em mãos à destinatária.</p></SurfaceCard><SurfaceCard className="mt-3 w-full p-3 text-left"><p className="flex items-center gap-2 text-sm font-bold"><Clock3 className="h-5 w-5" />Último estado conhecido</p><p className="mt-1 text-xs text-territory-muted">Em entrega</p></SurfaceCard><p className="mt-4 text-sm leading-snug text-territory-muted">Ao reconectar, verificaremos a situação antes de tentar novamente.</p></div>
      <div className="mt-auto grid gap-2 pb-24 max-[340px]:pb-20"><Button type="button" onClick={() => onNavigate("complete")} className="h-11 !min-h-0 bg-territory-sun text-sm text-territory-ink hover:bg-territory-sun/85">Verificar situação</Button><Button type="button" variant="outline" onClick={() => toast.info("Suporte aberto na demonstração.")} className="h-10 !min-h-0 border-territory-border bg-white text-sm text-territory-ink">Falar com suporte</Button></div>
    </div>
  );
}

function MobileComplete({ onNavigate }: { onNavigate: (view: LinkedView) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-3 max-[340px]:gap-2">
      <div className="flex flex-col items-center text-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-[#43b879] text-white"><Check className="h-9 w-9" /></span><h1 className="mt-3 font-heading text-xl font-extrabold">Entrega concluída</h1><p className="text-sm text-territory-muted">Hoje, às 10:35</p></div>
      <SurfaceCard className="divide-y divide-[#d8e1df] p-0"><div className="flex items-center gap-3 p-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#fff0bd]"><Store className="h-4 w-4" /></span><div><p className="text-xs text-territory-muted">Pedido</p><p className="text-sm font-bold">{storeData.name}</p><p className="text-xs text-territory-muted">Entrega #1043</p></div></div><div className="flex items-center gap-3 p-3"><UserRound className="h-5 w-5 shrink-0" /><div><p className="text-xs text-territory-muted">Recebido por</p><p className="text-sm font-bold">Ana Oliveira</p></div></div><div className="flex items-center gap-3 p-3"><Package className="h-5 w-5 shrink-0" /><div><p className="text-xs text-territory-muted">Forma de entrega</p><p className="text-sm font-bold">Em mãos ao destinatário</p></div></div><div className="flex items-center gap-3 p-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-territory-brand" /><div><p className="text-xs text-territory-muted">Validação</p><p className="text-sm font-bold">Código validado</p></div></div><div className="flex items-center gap-3 p-3"><FileText className="h-5 w-5 shrink-0" /><div><p className="text-xs text-territory-muted">Observação</p><p className="text-sm font-bold">Entregue em mãos à destinatária.</p></div></div></SurfaceCard>
      <SurfaceCard className="flex items-center gap-3 p-3"><img src={driverImage} alt="Carlos Santos" className="h-10 w-10 rounded-full object-cover" /><div><p className="text-xs text-territory-muted">Entregador</p><p className="text-sm font-bold">Carlos Santos</p><p className="text-xs text-territory-muted">Equipe da loja integrada</p></div></SurfaceCard>
      <Notice>Este comprovante registra a entrega, não o pagamento.</Notice>
      <Button type="button" onClick={() => onNavigate("offer")} className="h-11 !min-h-0 bg-territory-brand text-sm text-white hover:bg-territory-brand/90">Voltar às entregas</Button>
      <button type="button" onClick={() => toast.info("Ajuda aberta na demonstração.")} className="text-sm font-bold underline">Preciso de ajuda</button>
    </div>
  );
}

function MobileProblem({ onNavigate }: { onNavigate: (view: LinkedView) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-3 max-[340px]:gap-2">
      <SurfaceCard className="p-3"><label className="block text-sm font-bold">Motivo <span className="text-red-600">*</span><div className="relative mt-1"><select defaultValue="absent" className="h-10 w-full appearance-none rounded-lg border border-territory-border bg-white px-3 pr-8 text-sm font-normal"><option value="absent">Destinatário ausente</option><option>Endereço não encontrado</option><option>Endereço inacessível</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4" /></div></label><label className="mt-3 block text-sm font-bold">Descreva o ocorrido <span className="text-red-600">*</span><textarea defaultValue="Não encontrei ninguém no endereço." className="mt-1 h-28 w-full resize-none rounded-lg border border-territory-border bg-white p-3 text-sm font-normal" /></label></SurfaceCard>
      <SurfaceCard className="p-3"><p className="text-sm font-bold">Tente contato quando possível</p><div className="mt-2 grid gap-2"><Button type="button" variant="outline" onClick={() => toast.info("Conversa aberta na demonstração.")} className="h-10 !min-h-0 border-territory-border bg-white text-sm text-territory-ink"><MessageCircle className="h-4 w-4" />Falar com destinatário</Button><Button type="button" variant="outline" onClick={() => toast.info("Conversa aberta na demonstração.")} className="h-10 !min-h-0 border-territory-border bg-white text-sm text-territory-ink"><Store className="h-4 w-4" />Falar com a loja</Button></div></SurfaceCard>
      <Notice tone="yellow">Não deixe o pedido em local sem autorização.</Notice><Notice>O registro do problema não confirma entrega nem pagamento.</Notice>
      <div className="mt-auto grid gap-2"><Button type="button" variant="outline" onClick={() => onNavigate("delivery")} className="h-10 !min-h-0 border-territory-border bg-white text-sm text-territory-ink"><ArrowLeft className="h-4 w-4" />Voltar à entrega</Button><Button type="button" onClick={() => toast.success("Problema registrado na demonstração.")} className="h-11 !min-h-0 bg-[#d65b5b] text-sm text-white hover:bg-[#c94d4d]"><AlertTriangle className="h-4 w-4" />Registrar problema</Button></div>
    </div>
  );
}

function DesktopLinkedContent({
  view,
  onNavigate,
}: {
  view: LinkedView;
  onNavigate: (view: LinkedView) => void;
}) {
  if (view === "offer") return <DesktopOffer onNavigate={onNavigate} />;
  if (view === "recipient") return <DesktopRecipient onNavigate={onNavigate} />;
  if (view === "problem") return <DesktopProblem onNavigate={onNavigate} />;
  return <DesktopProgress onNavigate={onNavigate} />;
}

function MobileLinkedContent({
  view,
  onNavigate,
  proofMethod,
}: {
  view: LinkedView;
  onNavigate: (view: LinkedView) => void;
  proofMethod: ProofMethod;
}) {
  if (view === "offer") return <MobileOffer onNavigate={onNavigate} />;
  if (view === "pickup") return <MobilePickup onNavigate={onNavigate} />;
  if (view === "start") return <MobileStart onNavigate={onNavigate} />;
  if (view === "delivery") return <MobileDelivery onNavigate={onNavigate} />;
  if (view === "recipient") return <MobileProof onNavigate={onNavigate} initialMethod={proofMethod} />;
  if (view === "offline") return <MobileOffline onNavigate={onNavigate} />;
  if (view === "complete") return <MobileComplete onNavigate={onNavigate} />;
  return <MobileProblem onNavigate={onNavigate} />;
}

const validViews: LinkedView[] = ["offer", "pickup", "start", "delivery", "recipient", "problem", "offline", "complete"];

export default function LinkedStoreDeliveryConceptMockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get("view") as LinkedView | null;
  const view: LinkedView = requestedView && validViews.includes(requestedView) ? requestedView : "offer";
  const requestedProofMethod = searchParams.get("method") as ProofMethod | null;
  const proofMethod: ProofMethod = requestedProofMethod && ["recipient", "authorized", "location"].includes(requestedProofMethod) ? requestedProofMethod : "recipient";
  const onNavigate = (nextView: LinkedView) => {
    setSearchParams({ "concept-mock": "1", view: nextView });
  };

  const mobileTitle = view === "offer" ? "Nova entrega #1043" : view === "recipient" ? "Recebimento · #1043" : view === "complete" ? "Comprovante · #1043" : `Entrega #1043`;

  return (
    <>
      <Helmet><title>Entregador da loja · Conceito</title></Helmet>
      <DesktopShell onNavigate={onNavigate}>
        <DesktopLinkedContent view={view} onNavigate={onNavigate} />
      </DesktopShell>
      <MobileShell title={mobileTitle} darkHeader={view === "recipient" || view === "offline" || view === "complete"} onBack={() => onNavigate(view === "offer" ? "offer" : view === "pickup" ? "offer" : view === "start" ? "pickup" : view === "delivery" ? "start" : "delivery")}>
        <MobileLinkedContent view={view} onNavigate={onNavigate} proofMethod={proofMethod} />
      </MobileShell>
    </>
  );
}
