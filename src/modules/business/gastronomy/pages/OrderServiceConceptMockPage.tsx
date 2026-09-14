import { useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  BarChart3,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Ellipsis,
  FileText,
  History,
  Info,
  LockKeyhole,
  MapPin,
  Menu,
  MessageCircle,
  PackageCheck,
  Phone,
  ReceiptText,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn";
import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";
import drinkImage from "@/assets/gastronomy/cat-cafes.jpg";

type ServiceState = "receive" | "prepare" | "cancel" | "complete";

type StateOption = {
  id: ServiceState;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

const stateOptions: StateOption[] = [
  { id: "receive", label: "Receber", shortLabel: "Novo", icon: ClipboardCheck },
  { id: "prepare", label: "Preparar", shortLabel: "Em preparo", icon: ChefHat },
  { id: "cancel", label: "Cancelar", shortLabel: "Cancelamento", icon: Ban },
  { id: "complete", label: "Concluir", shortLabel: "Entregue", icon: CheckCircle2 },
];

const stateOrder = {
  receive: { number: "1042", customer: "Ana Oliveira", status: "Novo", delivery: "Entrega própria" },
  prepare: { number: "1042", customer: "Ana Oliveira", status: "Em preparo", delivery: "Entrega própria" },
  cancel: { number: "1045", customer: "Mariana Santos", status: "Cancelamento", delivery: "Entrega própria" },
  complete: { number: "1038", customer: "Carlos Almeida", status: "Entregue", delivery: "Entrega própria" },
} satisfies Record<ServiceState, { number: string; customer: string; status: string; delivery: string }>;

const orderItems = [
  { name: "Moqueca individual", detail: "+ Farofa", quantity: "1x", price: "R$ 41,00", image: foodImage },
  { name: "Suco", detail: "", quantity: "1x", price: "R$ 8,00", image: drinkImage },
];

const additionalMockItems = [
  { name: "Pudim caseiro", detail: "", quantity: "1x", price: "R$ 7,00", image: foodImage },
  { name: "Água mineral", detail: "", quantity: "1x", price: "R$ 4,00", image: drinkImage },
];

function getMockItems(searchParams: URLSearchParams) {
  const requestedCount = Number.parseInt(searchParams.get("items") ?? "2", 10);
  const itemCount = Number.isFinite(requestedCount) ? Math.min(4, Math.max(2, requestedCount)) : 2;
  return [...orderItems, ...additionalMockItems].slice(0, itemCount);
}

function parseMockPrice(value: string) {
  return Number(value.replace(/[^\d,]/g, "").replace(",", "."));
}

function formatMockCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function useMockOrderAmounts() {
  const [searchParams] = useSearchParams();
  const subtotal = getMockItems(searchParams).reduce((sum, item) => sum + parseMockPrice(item.price), 0);
  const delivery = 5;
  return { subtotal, delivery, total: subtotal + delivery };
}

function parseState(value: string | null): ServiceState {
  return stateOptions.some((option) => option.id === value) ? (value as ServiceState) : "receive";
}

function Brand({ dark = false }: { dark?: boolean }) {
  return <span className={cn("inline-flex items-baseline font-heading font-bold tracking-[-0.055em]", dark ? "text-[1.45rem] text-white" : "text-lg text-territory-ink")}>achegue-se<span className="ml-0.5 text-territory-sun">.</span></span>;
}

function StoreIdentity({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img src={foodImage} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0">
        <p className={cn("truncate text-sm font-bold", dark ? "text-white" : "text-territory-ink")}>Sabores da Ana</p>
        <p className={cn("truncate text-xs", dark ? "text-white/70" : "text-territory-muted")}>Comida caseira com mais sabor</p>
      </div>
    </div>
  );
}

function DesktopSidebar({ state, onStateChange }: { state: ServiceState; onStateChange: (next: ServiceState) => void }) {
  const links = [
    { label: "Visão geral", icon: Store },
    { label: "Cardápio", icon: UtensilsCrossed },
    { label: "Pedidos", icon: ClipboardCheck },
    { label: "Entregas", icon: Truck },
    { label: "Conversas", icon: MessageCircle },
    { label: "Equipe", icon: Users },
  ];

  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r border-white/15 bg-territory-brand px-4 py-5 text-white md:flex" aria-label="Navegação da loja">
      <StoreIdentity dark />
      <nav className="mt-8 space-y-1">
        {links.map(({ label, icon: Icon }) => {
          const active = label === "Pedidos";
          return (
            <button key={label} type="button" onClick={() => active ? onStateChange(state) : toast.info(`${label} ficará disponível nesta próxima etapa.`)} className={cn("flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold", active ? "bg-territory-sun text-territory-ink" : "text-white/85 hover:bg-white/10")}>
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white/75">
        <p className="font-semibold text-white">Atendimento do pedido</p>
        <p className="mt-1">Ações disponíveis conforme a etapa.</p>
        <span className="mt-2 block h-0.5 w-8 bg-territory-sun" />
      </div>
    </aside>
  );
}

function MobileHeader({ state, onStateChange }: { state: ServiceState; onStateChange: (next: ServiceState) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex h-12 items-center justify-between border-b border-territory-border md:hidden">
      <button type="button" onClick={() => toast.info("Voltar para os pedidos da loja.")} aria-label="Voltar para pedidos" className="rounded-lg p-1 text-territory-ink"><ArrowLeft className="h-5 w-5" aria-hidden="true" /></button>
      <Brand />
      <button type="button" onClick={() => setOpen((current) => !current)} aria-label="Abrir estados do atendimento" aria-expanded={open} className="rounded-lg p-1 text-territory-ink"><Ellipsis className="h-5 w-5" aria-hidden="true" /></button>
      {open ? (
        <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-territory-border bg-territory-surface p-1.5 shadow-lg">
          {stateOptions.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => { onStateChange(id); setOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold", state === id ? "bg-territory-sun/20 text-territory-brand" : "text-territory-ink hover:bg-territory-raised")}><Icon className="h-4 w-4" aria-hidden="true" />{label}</button>)}
        </div>
      ) : null}
    </div>
  );
}

function DesktopTopbar() {
  return (
    <div className="hidden h-12 shrink-0 items-center justify-between bg-territory-brand px-6 text-white md:flex">
      <Brand dark />
      <div className="flex items-center gap-5 text-xs font-semibold">
        <span className="flex items-center gap-2"><Store className="h-4 w-4 text-territory-sun" aria-hidden="true" />Sabores da Ana<ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /></span>
        <span className="flex items-center gap-2 border-l border-white/20 pl-5"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-territory-brand">AA</span>Ana<ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /></span>
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: ServiceState }) {
  const tones: Record<ServiceState, string> = {
    receive: "bg-territory-sun/45 text-territory-warm",
    prepare: "bg-sky-100 text-sky-800",
    cancel: "bg-rose-100 text-rose-700",
    complete: "bg-emerald-100 text-emerald-700",
  };
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold", tones[state])}>{stateOrder[state].status}</span>;
}

function OrderHeading({ state }: { state: ServiceState }) {
  const order = stateOrder[state];
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-heading text-xl font-bold tracking-[-0.04em] text-territory-ink">Pedido #{order.number}</p>
        <p className="mt-0.5 text-sm text-territory-ink">{order.customer}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-territory-muted"><Truck className="h-3.5 w-3.5" aria-hidden="true" />{order.delivery}</p>
      </div>
      <StatusBadge state={state} />
    </div>
  );
}

function ContactStrip() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-territory-brand/5 px-3 py-2.5 text-sm text-territory-ink">
      <span className="flex min-w-0 items-center gap-2"><Phone className="h-4 w-4 shrink-0" aria-hidden="true" />(71) 9 9123-4567</span>
      <button type="button" onClick={() => toast.info("A ligação ao cliente ficará disponível quando o pedido estiver vinculado ao contato.")} className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-territory-brand hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />Ligar para cliente</button>
    </div>
  );
}

function AddressBlock() {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-territory-surface py-1 text-sm text-territory-ink">
      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
      <div><p className="font-semibold">Endereço de entrega</p><p>Rua Exemplo, 120 – Casa 2</p><p className="text-territory-muted">Santa Cruz, Salvador – BA</p></div>
    </div>
  );
}

function ItemsSection({ showTitle = true }: { showTitle?: boolean }) {
  const [searchParams] = useSearchParams();
  const items = getMockItems(searchParams);

  return (
    <section aria-label="Itens do pedido">
      {showTitle ? <h2 className="mb-2 text-sm font-bold text-territory-ink">Itens do pedido</h2> : null}
      <div className="divide-y divide-territory-border/80">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            <img src={item.image} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-territory-ink">{item.name}</p><p className="text-xs text-territory-muted">{item.detail || item.quantity}</p>{item.detail ? <p className="text-xs text-territory-muted">{item.quantity}</p> : null}</div>
            <p className="shrink-0 text-sm font-semibold text-territory-ink">{item.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileActionFooter({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 z-10 -mx-1 mt-auto bg-territory-surface/95 pb-1 pt-2 backdrop-blur-sm">{children}</div>;
}

function Totals() {
  const { subtotal, delivery, total } = useMockOrderAmounts();
  return (
    <div className="border-t border-territory-border pt-2 text-sm">
      <div className="flex justify-between text-territory-muted"><span>Produtos</span><span>{formatMockCurrency(subtotal)}</span></div>
      <div className="flex justify-between text-territory-muted"><span>Entrega (própria)</span><span>{formatMockCurrency(delivery)}</span></div>
      <div className="mt-1 flex justify-between text-base font-bold text-territory-ink"><span>Total do pedido</span><span>{formatMockCurrency(total)}</span></div>
    </div>
  );
}

function PaymentCard({ state, confirmed, onConfirm }: { state: ServiceState; confirmed: boolean; onConfirm: () => void }) {
  const isConfirmed = confirmed;
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface p-2.5" aria-label="Pagamento">
      <div className="flex items-start gap-3">
        <ReceiptText className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-territory-ink">Pagamento via PIX</p><span className={cn("rounded-full px-2 py-0.5 text-[0.6875rem] font-bold", isConfirmed ? "bg-emerald-100 text-emerald-700" : "bg-territory-sun/45 text-territory-warm")}>{isConfirmed ? "Confirmado" : "Pendente"}</span></div><p className="mt-1 text-xs text-territory-muted">{isConfirmed ? "Pagamento confirmado pela loja." : "Aguardando confirmação do pagamento."}</p></div>
        {state === "receive" ? <ChevronRight className="h-4 w-4 shrink-0 text-territory-muted" aria-hidden="true" /> : null}
      </div>
      {state === "prepare" && !isConfirmed ? <button type="button" onClick={onConfirm} className="mt-2 pl-8 text-xs font-bold text-territory-brand hover:underline">Confirmar pagamento</button> : null}
      {state === "cancel" ? <button type="button" onClick={() => toast.info("A situação financeira será aberta quando o pedido estiver conectado ao pagamento.")} className="mt-2 pl-8 text-xs font-bold text-territory-brand hover:underline">Ver situação financeira</button> : null}
    </section>
  );
}

function ReceiveState({ onPrepare, onCancel, paymentConfirmed, onConfirmPayment }: { onPrepare: () => void; onCancel: () => void; paymentConfirmed: boolean; onConfirmPayment: () => void }) {
  return (
    <div className="flex min-h-full flex-col gap-2">
      <ContactStrip />
      <ItemsSection />
      <Totals />
      <PaymentCard state="receive" confirmed={paymentConfirmed} onConfirm={onConfirmPayment} />
      <section className="rounded-xl border border-territory-border bg-territory-surface p-3"><div className="flex items-center gap-2 text-sm font-bold text-territory-ink"><MessageCircle className="h-4 w-4" aria-hidden="true" />Observação do cliente</div><p className="mt-2 text-sm text-territory-muted">Enviar talheres.</p></section>
      <MobileActionFooter>
        <Button type="button" onClick={onPrepare} className="min-h-11 w-full rounded-xl bg-territory-brand text-sm font-bold text-white hover:bg-territory-brand/90"><Check className="mr-2 h-4 w-4" aria-hidden="true" />Aceitar pedido</Button>
        <div className="mt-2 grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={() => toast.info("Os detalhes financeiros serão abertos nesta etapa.")} className="min-h-10 border-territory-border bg-territory-surface text-xs font-bold text-territory-ink"><ReceiptText className="mr-1.5 h-4 w-4" aria-hidden="true" />Pagamento</Button><Button type="button" variant="outline" onClick={onConfirmPayment} className="min-h-10 border-territory-border bg-territory-surface text-xs font-bold text-territory-ink"><Store className="mr-1.5 h-4 w-4" aria-hidden="true" />Confirmar recebimento</Button></div>
        <button type="button" onClick={onCancel} className="mt-2 flex items-center gap-1.5 px-1 text-xs font-semibold text-rose-600 hover:underline"><XCircle className="h-4 w-4" aria-hidden="true" />Cancelar pedido</button>
      </MobileActionFooter>
    </div>
  );
}

function PrepareState({ onReady, paymentConfirmed, onConfirmPayment }: { onReady: () => void; paymentConfirmed: boolean; onConfirmPayment: () => void }) {
  const [ready, setReady] = useState(false);
  return (
    <div className="flex min-h-full flex-col gap-2">
      <ContactStrip />
      <AddressBlock />
      <ItemsSection />
      <Totals />
      <PaymentCard state="prepare" confirmed={paymentConfirmed} onConfirm={onConfirmPayment} />
      <section aria-label="Linha do tempo"><h2 className="mb-2 text-sm font-bold text-territory-ink">Linha do tempo</h2><div className="space-y-2 border-l-2 border-territory-brand/25 pl-4 text-xs"><div className="relative"><span className="absolute -left-[1.35rem] top-0.5 h-3 w-3 rounded-full bg-territory-brand" /><strong className="text-territory-ink">Confirmado</strong><span className="ml-auto float-right text-territory-muted">12:05</span></div><div className="relative"><span className="absolute -left-[1.35rem] top-0.5 h-3 w-3 rounded-full bg-territory-sun" /><strong className="text-territory-ink">Em preparo</strong><span className="ml-auto float-right text-territory-muted">12:10</span></div><div className="relative text-territory-muted"><span className="absolute -left-[1.35rem] top-0.5 h-3 w-3 rounded-full border border-territory-border bg-territory-surface" />{ready ? "Pronto para coleta ou retirada" : "Pronto para coleta ou retirada"}</div><div className="relative text-territory-muted"><span className="absolute -left-[1.35rem] top-0.5 h-3 w-3 rounded-full border border-territory-border bg-territory-surface" />Entregue</div></div></section>
      <MobileActionFooter>
        <Button type="button" onClick={() => { setReady(true); onReady(); }} className="min-h-11 w-full rounded-xl bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85"><PackageCheck className="mr-2 h-4 w-4" aria-hidden="true" />{ready ? "Pedido marcado como pronto" : "Marcar pronto"}</Button>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-territory-sun/20 px-3 py-2 text-xs text-territory-warm"><Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />Próxima etapa: coleta ou retirada.</div>
      </MobileActionFooter>
    </div>
  );
}

function CancelState() {
  const [reason, setReason] = useState("item-unavailable");
  const [details, setDetails] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  return (
    <form className="flex min-h-full flex-col gap-2" onSubmit={(event) => { event.preventDefault(); if (details.trim().length < 5) { toast.error("Informe os detalhes do cancelamento."); return; } setConfirmed(true); toast.success("Cancelamento registrado no histórico do pedido."); }}>
      <div className="rounded-lg bg-territory-brand/5 p-3 text-sm text-territory-brand"><div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>O motivo ficará registrado no histórico do pedido.</p></div></div>
      <div><label htmlFor="cancel-reason" className="mb-1.5 block text-xs font-bold text-territory-ink">Motivo do cancelamento</label><Select value={reason} onValueChange={setReason}><SelectTrigger id="cancel-reason" className="border-territory-border bg-territory-surface"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="item-unavailable">Item indisponível</SelectItem><SelectItem value="store-emergency">Emergência operacional da loja</SelectItem><SelectItem value="customer-request">Solicitação do cliente</SelectItem><SelectItem value="payment">Pagamento ou segurança</SelectItem></SelectContent></Select></div>
      <div><label htmlFor="cancel-details" className="mb-1.5 block text-xs font-bold text-territory-ink">Detalhes do cancelamento <span className="font-normal text-rose-600">(obrigatório)</span></label><Textarea id="cancel-details" value={details} maxLength={200} onChange={(event) => setDetails(event.target.value)} placeholder="Ex.: produto esgotado." className="min-h-20 resize-none border-territory-border bg-territory-surface" /><p className="mt-1 text-right text-[0.6875rem] text-territory-muted">{details.length}/200</p></div>
      <PaymentCard state="cancel" confirmed={false} onConfirm={() => undefined} />
      <MobileActionFooter>
        <Button type="submit" disabled={confirmed} className="min-h-11 w-full rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700"><XCircle className="mr-2 h-4 w-4" aria-hidden="true" />{confirmed ? "Cancelamento confirmado" : "Confirmar cancelamento"}</Button>
        <Button type="button" variant="outline" onClick={() => toast.info("Retornando ao atendimento do pedido.")} className="mt-2 min-h-10 w-full border-territory-border bg-territory-surface text-sm font-bold text-territory-ink">Voltar</Button>
      </MobileActionFooter>
    </form>
  );
}

function AccordionRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children?: ReactNode }) {
  return <button type="button" onClick={() => children ? toast.info(`${label} será expandido quando o pedido estiver conectado aos dados completos.`) : undefined} className="flex min-h-10 w-full items-center gap-2 border-b border-territory-border py-2 text-left text-sm font-semibold text-territory-ink last:border-0"><Icon className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />{label}<ChevronDown className="ml-auto h-4 w-4 shrink-0 text-territory-muted" aria-hidden="true" /></button>;
}

function CompleteState() {
  const [occurrence, setOccurrence] = useState("");
  return (
    <div className="space-y-2">
      <p className="text-xs text-territory-muted">Entregue em 16/04/2024 às 13:28</p>
      <section className="rounded-xl border border-territory-border bg-territory-surface p-3" aria-label="Pagamento"><div className="flex items-center gap-3"><CreditCard className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-territory-ink">Pagamento via PIX</p><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6875rem] font-bold text-emerald-700">Confirmado</span></div><p className="mt-1 text-xs text-territory-muted">Pagamento confirmado pela loja.</p></div><ChevronRight className="h-4 w-4 shrink-0 text-territory-muted" aria-hidden="true" /></div></section>
      <section className="rounded-xl border border-territory-border bg-territory-surface px-3" aria-label="Itens e histórico"><AccordionRow icon={UtensilsCrossed} label="Itens do pedido" /><AccordionRow icon={History} label="Histórico" /></section>
      <section className="rounded-xl border border-territory-border bg-territory-surface p-3"><div className="flex items-center gap-3"><FileText className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-territory-ink">Comprovante de entrega</p><p className="text-xs text-territory-muted">A confirmação de entrega está disponível.</p></div><Button type="button" variant="outline" onClick={() => toast.info("O comprovante será aberto quando existir no pedido.")} className="h-9 shrink-0 border-territory-border bg-territory-surface px-3 text-xs font-bold">Ver comprovante</Button></div></section>
      <section className="rounded-xl border border-territory-border bg-territory-surface p-3"><div className="flex items-center gap-2 text-sm font-bold text-territory-ink"><LockKeyhole className="h-4 w-4" aria-hidden="true" />Registro privado da operação</div><div className="mt-3 space-y-2"><label htmlFor="occurrence-reason" className="block text-xs font-semibold text-territory-ink">Motivo da ocorrência</label><Select defaultValue="delivery-problem"><SelectTrigger id="occurrence-reason" className="border-territory-border bg-territory-surface"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="delivery-problem">Problema na entrega</SelectItem><SelectItem value="customer-contact">Contato com o cliente</SelectItem><SelectItem value="other">Outro</SelectItem></SelectContent></Select><label htmlFor="occurrence-recipient" className="block text-xs font-semibold text-territory-ink">Destinatário <span className="font-normal text-territory-muted">(opcional)</span></label><Select defaultValue="customer"><SelectTrigger id="occurrence-recipient" className="border-territory-border bg-territory-surface"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customer">Cliente</SelectItem><SelectItem value="store">Loja</SelectItem><SelectItem value="courier">Entregador</SelectItem></SelectContent></Select><label htmlFor="occurrence-details" className="block text-xs font-semibold text-territory-ink">Descreva o ocorrido</label><Textarea id="occurrence-details" value={occurrence} maxLength={300} onChange={(event) => setOccurrence(event.target.value)} placeholder="Descreva o ocorrido." className="min-h-16 resize-none border-territory-border bg-territory-surface" /><p className="text-right text-[0.6875rem] text-territory-muted">{occurrence.length}/300</p><p className="flex items-center gap-1.5 text-xs text-territory-muted"><Info className="h-3.5 w-3.5" aria-hidden="true" />Visível somente às pessoas autorizadas.</p><Button type="button" onClick={() => occurrence.trim() ? toast.success("Ocorrência registrada com acesso restrito.") : toast.info("Descreva o ocorrido antes de registrar.")} className="min-h-10 w-full bg-sky-100 text-xs font-bold text-sky-900 hover:bg-sky-200">Registrar ocorrência</Button></div></section>
    </div>
  );
}

function DesktopDeliveryDetails({ customer = "Ana Oliveira" }: { customer?: string }) {
  return <section className="rounded-xl border border-territory-border bg-territory-surface p-3"><h2 className="text-sm font-bold text-territory-ink">Dados de entrega</h2><div className="mt-2 space-y-2 text-xs text-territory-ink"><p className="flex items-center gap-2"><Users className="h-4 w-4 text-territory-brand" aria-hidden="true" />{customer}</p><p className="flex items-center gap-2"><Phone className="h-4 w-4 text-territory-brand" aria-hidden="true" />(71) 9XXX-1234</p><p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" /><span>Rua Exemplo, 120 - Casa 2<br />Santa Cruz - Salvador/BA</span></p></div></section>;
}

function DesktopPaymentSummary({ state, confirmed = state === "complete", onConfirmPayment, onAccept, onCancel }: { state: ServiceState; confirmed?: boolean; onConfirmPayment?: () => void; onAccept?: () => void; onCancel?: () => void }) {
  const { subtotal, delivery, total } = useMockOrderAmounts();
  const isConfirmed = confirmed;
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface p-3" aria-label="Resumo e pagamento">
      <h2 className="text-sm font-bold text-territory-ink">{state === "receive" ? "Resumo e pagamento" : "Pagamento"}</h2>
      <div className="mt-2 space-y-1 text-xs"><div className="flex justify-between text-territory-muted"><span>Subtotal</span><span>{formatMockCurrency(subtotal)}</span></div><div className="flex justify-between text-territory-muted"><span>Entrega</span><span>{formatMockCurrency(delivery)}</span></div><div className="mt-2 flex justify-between border-t border-territory-border bg-territory-brand/5 px-2 py-2 text-sm font-bold text-territory-ink"><span>Total</span><span>{formatMockCurrency(total)}</span></div></div>
      <div className="mt-3 flex items-center gap-2 border-t border-territory-border pt-3"><ReceiptText className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><p className="min-w-0 flex-1 text-xs font-bold text-territory-ink">Pagamento via PIX</p><span className={cn("rounded-full px-2 py-1 text-[0.6875rem] font-bold", isConfirmed ? "bg-emerald-100 text-emerald-700" : "bg-territory-sun/45 text-territory-warm")}>{isConfirmed ? "Confirmado pela loja" : "Pendente"}</span></div>
      {state === "receive" ? <><Button type="button" onClick={onAccept} className="mt-3 min-h-10 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85">Aceitar pedido</Button><Button type="button" variant="outline" onClick={onConfirmPayment} className="mt-2 min-h-10 w-full border-territory-border bg-territory-surface text-sm font-bold text-territory-ink">Confirmar pagamento</Button><p className="mt-2 text-center text-xs text-territory-muted">Confirme após verificar o recebimento.</p><button type="button" onClick={onCancel} className="mt-3 w-full text-xs font-semibold text-rose-600 hover:underline">Cancelar pedido</button></> : null}
      {(state === "prepare" || state === "complete") && !isConfirmed ? <Button type="button" onClick={onConfirmPayment} className="mt-3 min-h-10 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85">Confirmar pagamento</Button> : null}
    </section>
  );
}

function DesktopTimeline() {
  return <section className="rounded-xl border border-territory-border bg-territory-surface p-3" aria-label="Acompanhamento do pedido"><h2 className="text-sm font-bold text-territory-ink">Acompanhamento do pedido</h2><div className="mt-3 space-y-2 border-l-2 border-territory-brand/25 pl-4 text-xs"><div className="relative"><span className="absolute -left-[1.35rem] top-0 h-3 w-3 rounded-full bg-territory-brand" /><strong>Confirmado</strong><span className="float-right text-territory-muted">12:05</span></div><div className="relative"><span className="absolute -left-[1.35rem] top-0 h-3 w-3 rounded-full bg-territory-brand" /><strong>Em preparo</strong><span className="float-right text-territory-muted">12:10</span></div><div className="relative text-territory-muted"><span className="absolute -left-[1.35rem] top-0 h-3 w-3 rounded-full border border-territory-border bg-territory-surface" />Pronto</div><div className="relative text-territory-muted"><span className="absolute -left-[1.35rem] top-0 h-3 w-3 rounded-full border border-territory-border bg-territory-surface" />Em entrega</div><div className="relative text-territory-muted"><span className="absolute -left-[1.35rem] top-0 h-3 w-3 rounded-full border border-territory-border bg-territory-surface" />Entregue</div></div></section>;
}

function DesktopReceiveState({ onPrepare, onCancel, onConfirmPayment, paymentConfirmed }: { onPrepare: () => void; onCancel: () => void; onConfirmPayment: () => void; paymentConfirmed: boolean }) {
  return <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,.85fr)]"><div className="space-y-3 rounded-xl border border-territory-border bg-territory-surface p-3"><ItemsSection /><section className="rounded-lg bg-territory-brand/5 p-3"><h2 className="flex items-center gap-2 text-sm font-bold text-territory-ink"><MessageCircle className="h-4 w-4" aria-hidden="true" />Observação do cliente</h2><p className="mt-1 text-xs text-territory-muted">Enviar talheres.</p></section><DesktopDeliveryDetails /></div><div className="space-y-3"><DesktopPaymentSummary state="receive" confirmed={paymentConfirmed} onAccept={onPrepare} onCancel={onCancel} onConfirmPayment={onConfirmPayment} /></div></div>;
}

function DesktopPrepareState({ onReady, paymentConfirmed, onConfirmPayment }: { onReady: () => void; paymentConfirmed: boolean; onConfirmPayment: () => void }) {
  return <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,.85fr)]"><div className="space-y-3 rounded-xl border border-territory-border bg-territory-surface p-3"><ItemsSection /><section className="rounded-lg bg-territory-brand/5 p-3"><h2 className="flex items-center gap-2 text-sm font-bold text-territory-ink"><MessageCircle className="h-4 w-4" aria-hidden="true" />Observação do cliente</h2><p className="mt-1 text-xs text-territory-muted">Enviar talheres.</p></section><DesktopDeliveryDetails /></div><div className="space-y-3"><DesktopTimeline /><DesktopPaymentSummary state="prepare" confirmed={paymentConfirmed} onConfirmPayment={onConfirmPayment} /><Button type="button" onClick={onReady} className="min-h-10 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85"><PackageCheck className="mr-2 h-4 w-4" aria-hidden="true" />Marcar pronto</Button><p className="text-center text-xs text-territory-muted">O pedido ficará pronto para coleta ou retirada.</p></div></div>;
}

function DesktopCancelState() {
  const [details, setDetails] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  return <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,.85fr)]"><form className="space-y-3 rounded-xl border border-territory-border bg-territory-surface p-3" onSubmit={(event) => { event.preventDefault(); if (details.trim().length < 5) { toast.error("Informe os detalhes do cancelamento."); return; } setConfirmed(true); toast.success("Cancelamento registrado no histórico do pedido."); }}><div><label htmlFor="cancel-reason-desktop" className="mb-1.5 block text-xs font-bold">Motivo do cancelamento</label><Select defaultValue="item-unavailable"><SelectTrigger id="cancel-reason-desktop" className="border-territory-border bg-territory-surface"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="item-unavailable">Item indisponível</SelectItem><SelectItem value="store-emergency">Emergência operacional da loja</SelectItem><SelectItem value="customer-request">Solicitação do cliente</SelectItem></SelectContent></Select></div><div><label htmlFor="cancel-details-desktop" className="mb-1.5 block text-xs font-bold">Detalhes do cancelamento <span className="font-normal text-territory-muted">(obrigatório)</span></label><Textarea id="cancel-details-desktop" value={details} maxLength={200} onChange={(event) => setDetails(event.target.value)} placeholder="O prato solicitado esgotou antes do aceite." className="min-h-28 resize-none border-territory-border bg-territory-surface" /><p className="mt-1 text-xs text-territory-muted">Mínimo de 5 caracteres.</p></div><div className="grid grid-cols-2 gap-2 pt-3"><Button type="button" variant="outline" onClick={() => toast.info("Retornando ao atendimento do pedido.")} className="min-h-10 border-territory-border bg-territory-surface text-sm font-bold text-territory-ink">Voltar</Button><Button type="submit" disabled={confirmed} className="min-h-10 bg-rose-600 text-sm font-bold text-white hover:bg-rose-700">{confirmed ? "Cancelado" : "Confirmar cancelamento"}</Button></div></form><div className="space-y-3"><section className="rounded-xl border border-territory-border bg-territory-surface p-3"><h2 className="text-sm font-bold">Resumo do pedido</h2><p className="mt-2 text-sm font-bold">Mariana Santos <span className="float-right rounded-full bg-territory-sun/45 px-2 py-1 text-xs font-bold text-territory-warm">Novo</span></p><div className="mt-2"><ItemsSection showTitle={false} /></div><Totals /></section><PaymentCard state="cancel" confirmed={false} onConfirm={() => undefined} /></div></div>;
}

function DesktopCompleteState() {
  const [occurrence, setOccurrence] = useState("");
  return <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,.85fr)]"><div className="space-y-3 rounded-xl border border-territory-border bg-territory-surface p-3"><ItemsSection /><section aria-label="Histórico do pedido"><h2 className="mb-2 text-sm font-bold">Histórico do pedido</h2><div className="space-y-2 border-l-2 border-territory-brand/30 pl-4 text-xs"><p><strong>Novo</strong><span className="float-right text-territory-muted">11:52</span></p><p><strong>Confirmado</strong><span className="float-right text-territory-muted">11:55</span></p><p><strong>Em preparo</strong><span className="float-right text-territory-muted">12:10</span></p><p><strong>Pronto</strong><span className="float-right text-territory-muted">12:28</span></p><p><strong>Em entrega</strong><span className="float-right text-territory-muted">12:34</span></p><p className="font-bold"><strong>Entregue</strong><span className="float-right text-territory-muted">12:46</span></p></div></section></div><div className="space-y-3"><DesktopPaymentSummary state="complete" /><section className="rounded-xl border border-territory-border bg-territory-surface p-3"><div className="flex items-center justify-between gap-2"><h2 className="text-sm font-bold">Comprovante de entrega</h2><button type="button" onClick={() => toast.info("O comprovante será aberto quando existir no pedido.")} className="text-xs font-bold text-territory-brand hover:underline">Ver comprovante</button></div></section><section className="rounded-xl border border-territory-border bg-territory-surface p-3"><h2 className="flex items-center gap-2 text-sm font-bold"><LockKeyhole className="h-4 w-4" aria-hidden="true" />Registro privado da operação</h2><p className="mt-1 text-xs text-territory-muted">Visível somente às pessoas autorizadas.</p><div className="mt-3 space-y-2"><label htmlFor="occurrence-reason-desktop" className="block text-xs font-semibold">Sobre quem é o registro?</label><Select defaultValue="customer"><SelectTrigger id="occurrence-reason-desktop" className="border-territory-border bg-territory-surface"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customer">Cliente: Carlos Almeida</SelectItem><SelectItem value="store">Loja</SelectItem><SelectItem value="courier">Entregador</SelectItem></SelectContent></Select><label htmlFor="occurrence-kind-desktop" className="block text-xs font-semibold">Motivo</label><Select defaultValue="customer-absent"><SelectTrigger id="occurrence-kind-desktop" className="border-territory-border bg-territory-surface"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customer-absent">Cliente ausente / não respondeu</SelectItem><SelectItem value="delivery-problem">Problema na entrega</SelectItem><SelectItem value="other">Outro</SelectItem></SelectContent></Select><label htmlFor="occurrence-details-desktop" className="block text-xs font-semibold">Detalhes</label><Textarea id="occurrence-details-desktop" value={occurrence} maxLength={300} onChange={(event) => setOccurrence(event.target.value)} placeholder="Foi necessário ligar para localizar o destinatário." className="min-h-20 resize-none border-territory-border bg-territory-surface" /><Button type="button" onClick={() => occurrence.trim() ? toast.success("Ocorrência registrada com acesso restrito.") : toast.info("Descreva o ocorrido antes de registrar.")} className="min-h-10 w-full bg-territory-sun text-xs font-bold text-territory-ink hover:bg-territory-sun/85">Registrar ocorrência</Button></div></section></div></div>;
}

function DesktopStateSurface({ state, onPrepare, onCancel, onReady, onConfirmPayment, paymentConfirmed }: { state: ServiceState; onPrepare: () => void; onCancel: () => void; onReady: () => void; onConfirmPayment: () => void; paymentConfirmed: boolean }) {
  if (state === "receive") return <DesktopReceiveState onPrepare={onPrepare} onCancel={onCancel} onConfirmPayment={onConfirmPayment} paymentConfirmed={paymentConfirmed} />;
  if (state === "prepare") return <DesktopPrepareState onReady={onReady} paymentConfirmed={paymentConfirmed} onConfirmPayment={onConfirmPayment} />;
  if (state === "cancel") return <DesktopCancelState />;
  return <DesktopCompleteState />;
}

function StateSwitcher({ state, onStateChange }: { state: ServiceState; onStateChange: (next: ServiceState) => void }) {
  return <div className="flex items-center gap-1 rounded-xl border border-territory-border bg-territory-surface p-1">{stateOptions.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => onStateChange(id)} className={cn("flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold", state === id ? "bg-territory-brand text-white" : "text-territory-muted hover:bg-territory-raised")}><Icon className="h-4 w-4" aria-hidden="true" />{label}</button>)}</div>;
}

export default function OrderServiceConceptMockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = parseState(searchParams.get("state"));
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const changeState = (next: ServiceState) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("concept-mock", "1");
    nextParams.set("state", next);
    setSearchParams(nextParams);
    if (next === "prepare") toast.success("Pedido aceito e enviado para preparo.");
  };

  const current = stateOrder[state];

  return (
    <>
      <Helmet><title>Atendimento do pedido | Sabores da Ana</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-territory-canvas text-territory-ink md:h-screen">
        <DesktopTopbar />
        <div className="flex min-h-0 flex-1">
          <DesktopSidebar state={state} onStateChange={changeState} />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:overflow-y-auto md:scrollbar-hide">
            <div className="mx-auto flex min-h-0 w-full max-w-[82rem] flex-1 flex-col px-4 pb-2 pt-0 sm:px-6 md:px-6 md:py-5 lg:px-8">
              <MobileHeader state={state} onStateChange={changeState} />
              <header className="hidden items-end justify-between gap-5 md:flex">
                <div><p className="text-xs font-semibold text-territory-muted">Pedidos da loja <span className="mx-1">/</span> Pedido #{current.number}</p><h1 className="mt-1 font-heading text-3xl font-bold tracking-[-0.05em] text-territory-ink">Atendimento do pedido</h1><p className="mt-1 text-sm text-territory-muted">Ações operacionais conforme a etapa do pedido.</p></div>
                <StateSwitcher state={state} onStateChange={changeState} />
              </header>
              <div className="mt-2 md:mt-5">
                <section className="flex min-h-0 flex-1 flex-col rounded-2xl border-territory-border bg-territory-surface md:border md:p-5" aria-label="Atendimento do pedido">
                  <div className="mb-2 mt-2 md:mt-0"><OrderHeading state={state} /></div>
                  <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide md:hidden">
                    {state === "receive" ? <ReceiveState onPrepare={() => changeState("prepare")} onCancel={() => changeState("cancel")} paymentConfirmed={paymentConfirmed} onConfirmPayment={() => { setPaymentConfirmed(true); toast.success("Pagamento marcado como confirmado."); }} /> : null}
                    {state === "prepare" ? <PrepareState onReady={() => toast.success("Pedido marcado como pronto para coleta ou retirada.")} paymentConfirmed={paymentConfirmed} onConfirmPayment={() => { setPaymentConfirmed(true); toast.success("Pagamento marcado como confirmado."); }} /> : null}
                    {state === "cancel" ? <CancelState /> : null}
                    {state === "complete" ? <CompleteState /> : null}
                  </div>
                  <div className="hidden md:block">
                    <DesktopStateSurface state={state} onPrepare={() => changeState("prepare")} onCancel={() => changeState("cancel")} onReady={() => toast.success("Pedido marcado como pronto para coleta ou retirada.")} onConfirmPayment={() => { setPaymentConfirmed(true); toast.success("Pagamento marcado como confirmado."); }} paymentConfirmed={paymentConfirmed} />
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
