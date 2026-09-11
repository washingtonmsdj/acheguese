import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Info,
  MapPin,
  MessageCircle,
  PackageCheck,
  Pencil,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn";
import foodImage from "@/assets/gastronomy/cat-restaurantes.jpg";
import juiceImage from "@/assets/gastronomy/cat-cafes.jpg";

type FulfillmentMode = "delivery" | "pickup" | "dine-in";
type DeliveryOption = "store" | "platform";
type PaymentMethod = "pix" | "link";

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const mockItems = [
  {
    id: "moqueca-de-peixe",
    name: "Moqueca de peixe",
    detail: "Individual · Farofa extra",
    price: 41,
    quantity: 1,
    image: foodImage,
  },
  {
    id: "suco-de-maracuja",
    name: "Suco de maracujá",
    detail: "",
    price: 8,
    quantity: 1,
    image: juiceImage,
  },
] as const;

function ChoiceButton({
  active,
  children,
  disabled = false,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center justify-between rounded-lg border px-3 text-left text-xs transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:text-sm",
        active
          ? "border-territory-brand bg-territory-raised text-territory-ink"
          : "border-territory-border bg-territory-surface text-territory-ink hover:border-territory-brand/50",
        disabled && "cursor-not-allowed opacity-55 hover:border-territory-border",
      )}
    >
      <span className="min-w-0">{children}</span>
      {active ? (
        <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-territory-brand text-white">
          <Check className="h-3 w-3" aria-hidden="true" />
        </span>
      ) : null}
    </button>
  );
}

function Stepper() {
  return (
    <div className="grid grid-cols-3 items-start gap-2 text-center text-[0.625rem] text-territory-muted sm:max-w-sm sm:text-xs">
      {["Recebimento", "Pagamento", "Revisão"].map((label, index) => (
        <div key={label} className="relative">
          {index < 2 ? (
            <span className="absolute left-1/2 top-3 h-px w-full bg-territory-brand/45" aria-hidden="true" />
          ) : null}
          <span className="relative z-10 mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-territory-brand text-[0.6875rem] font-bold text-white">
            {index + 1}
          </span>
          <span className={cn("mt-1 block", index === 2 && "font-bold text-territory-ink")}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function CheckoutHeader({ onBack }: { onBack: () => void }) {
  return (
    <>
      <header className="border-b border-territory-border bg-territory-surface">
        <div className="mx-auto hidden h-[4.25rem] max-w-[84rem] items-center gap-8 px-6 lg:flex">
          <button
            type="button"
            onClick={onBack}
            className="font-heading text-[1.45rem] font-bold tracking-[-0.05em] text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-territory-brand"
          >
            Achegue-se<span className="text-territory-sun">.</span>
          </button>
          <span className="h-7 w-px bg-territory-border" aria-hidden="true" />
          <div className="flex items-center gap-2 text-xs text-territory-ink">
            <MapPin className="h-4 w-4 text-territory-brand" aria-hidden="true" />
            <span>Complexo do Nordeste de Amaralina</span>
            <span className="text-territory-muted">Salvador · BA</span>
          </div>
          <nav className="ml-auto flex items-center gap-7 text-xs font-semibold text-territory-ink" aria-label="Navegação">
            <span>Descobrir</span>
            <span>Meus pedidos</span>
            <span>Apoio à comunidade</span>
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-territory-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand" aria-label="Conta de Ana Oliveira">
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </button>
            <span>Ana Oliveira</span>
          </nav>
        </div>
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 lg:hidden">
          <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao cardápio
          </button>
          <span className="font-heading text-base font-bold text-territory-brand">
            achegue-se<span className="text-territory-sun">.</span>
          </span>
        </div>
      </header>
      <div className="border-b border-territory-border bg-territory-surface px-4 py-3 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-lg font-bold text-territory-ink">Revisar pedido</h1>
            <p className="text-xs text-territory-muted">Sabores da Ana</p>
          </div>
          <ShoppingBag className="mt-1 h-5 w-5 text-territory-brand" aria-hidden="true" />
        </div>
        <div className="mt-3"><Stepper /></div>
      </div>
    </>
  );
}

function BusinessSummary() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-territory-border bg-territory-surface p-3">
      <img src={foodImage} alt="" className="h-12 w-12 rounded-lg object-cover" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-territory-ink">Sabores da Ana</p>
        <p className="text-xs text-territory-muted">Comida caseira · Santa Cruz, Salvador - BA</p>
      </div>
    </div>
  );
}

function FulfillmentSection({
  mode,
  deliveryOption,
  onModeChange,
  onDeliveryOptionChange,
}: {
  mode: FulfillmentMode;
  deliveryOption: DeliveryOption;
  onModeChange: (mode: FulfillmentMode) => void;
  onDeliveryOptionChange: (option: DeliveryOption) => void;
}) {
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5" aria-labelledby="checkout-fulfillment-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="checkout-fulfillment-title" className="font-heading text-base font-bold text-territory-ink">1. Recebimento</h2>
        <Clock3 className="h-5 w-5 text-territory-brand" aria-hidden="true" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {([
          ["delivery", "Entrega", Truck],
          ["pickup", "Retirada", ShoppingBag],
          ["dine-in", "No local", Store],
        ] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => onModeChange(value)}
            className={cn(
              "inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border px-2 text-[0.6875rem] font-semibold text-territory-ink transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:text-xs",
              mode === value ? "border-territory-brand bg-territory-raised" : "border-territory-border hover:border-territory-brand/50",
            )}
          >
            <Icon className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {mode === "delivery" ? (
        <>
          <h3 className="mt-5 text-xs font-bold text-territory-ink sm:text-sm">Quem entrega</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <ChoiceButton active={deliveryOption === "store"} onClick={() => onDeliveryOptionChange("store")}>
              <span className="block font-semibold">Entrega da loja</span>
              <span className="mt-0.5 block text-[0.6875rem] text-territory-muted">Equipe do estabelecimento · {currency(5)}</span>
            </ChoiceButton>
            <ChoiceButton active={false} disabled>
              <span className="flex items-center justify-between gap-2 font-semibold">Motoboy Achegue-se <span className="rounded-full bg-territory-sun/50 px-1.5 py-0.5 text-[0.5625rem]">Em breve</span></span>
              <span className="mt-0.5 block text-[0.6875rem] text-territory-muted">Disponível quando a operação do território for ativada · {currency(7)}</span>
            </ChoiceButton>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[0.6875rem] leading-4 text-territory-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-territory-brand" aria-hidden="true" />
            A entrega própria da loja está disponível para este pedido. A modalidade Achegue-se depende do território, do estabelecimento e do endereço atendido.
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs text-territory-muted">Sem taxa de entrega. Combine os detalhes diretamente com a loja.</p>
      )}
    </section>
  );
}

function AddressSection({ mode }: { mode: FulfillmentMode }) {
  if (mode !== "delivery") return null;
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5" aria-labelledby="checkout-address-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="checkout-address-title" className="font-heading text-base font-bold text-territory-ink">2. Endereço e destinatário</h2>
        <button type="button" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Editar
        </button>
      </div>
      <div className="mt-3 rounded-lg border border-territory-border bg-territory-surface p-3 text-xs text-territory-ink">
        <p className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-territory-brand" aria-hidden="true" />Casa</p>
        <p className="mt-1 pl-6 text-territory-muted">Rua Exemplo, 120 · Casa 2<br />Santa Cruz · Salvador, BA · CEP 41900-000</p>
        <p className="mt-2 flex items-center gap-2 border-t border-territory-border pt-2"><UserRound className="h-4 w-4 text-territory-brand" aria-hidden="true" />Ana Oliveira · (71) 9XXXX-1234</p>
        <p className="mt-2 flex items-center gap-2 border-t border-territory-border pt-2 text-territory-muted"><PackageCheck className="h-4 w-4 text-territory-brand" aria-hidden="true" />Ponto de referência: Portão azul</p>
      </div>
      <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-territory-info/10 px-3 py-2 text-[0.6875rem] leading-4 text-territory-ink">
        <Info className="h-3.5 w-3.5 shrink-0 text-territory-brand" aria-hidden="true" />
        O entregador da loja confirma a entrega após a aprovação do pedido.
      </p>
    </section>
  );
}

function PaymentSection({ method, onChange }: { method: PaymentMethod; onChange: (method: PaymentMethod) => void }) {
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5" aria-labelledby="checkout-payment-title">
      <h2 id="checkout-payment-title" className="font-heading text-base font-bold text-territory-ink">3. Pagamento</h2>
      <p className="mt-2 flex items-center gap-2 rounded-lg bg-territory-sun/20 px-3 py-2 text-[0.6875rem] text-territory-ink sm:text-xs">
        <WalletCards className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" /> Pagamento dos produtos direto com a loja.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ChoiceButton active={method === "pix"} onClick={() => onChange("pix")}>
          <span className="block font-semibold">PIX combinado com a loja</span>
          <span className="mt-0.5 block text-[0.6875rem] text-territory-muted">A loja envia as instruções</span>
        </ChoiceButton>
        <ChoiceButton active={method === "link"} onClick={() => onChange("link")}>
          <span className="block font-semibold">Link enviado pela loja</span>
          <span className="mt-0.5 block text-[0.6875rem] text-territory-muted">Pagamento seguro após o aceite</span>
        </ChoiceButton>
      </div>
      <button type="button" className="mt-3 flex min-h-9 w-full items-center justify-between border-t border-territory-border pt-3 text-left text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
        Como funciona o pagamento <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>
    </section>
  );
}

function ItemsSection() {
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5" aria-labelledby="checkout-items-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="checkout-items-title" className="font-heading text-base font-bold text-territory-ink">Itens do pedido</h2>
        <button type="button" className="text-xs font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Editar</button>
      </div>
      <div className="mt-3 divide-y divide-territory-border border-y border-territory-border">
        {mockItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-3">
            <img src={item.image} alt="" className="h-14 w-16 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-territory-ink">{item.quantity} × {item.name}</p>
              {item.detail ? <p className="mt-0.5 text-xs text-territory-muted">{item.detail}</p> : null}
            </div>
            <span className="shrink-0 text-sm font-bold text-territory-ink">{currency(item.price)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrderSummary({ mode, onConfirm }: { mode: FulfillmentMode; onConfirm: () => void }) {
  const deliveryFee = mode === "delivery" ? 5 : 0;
  const subtotal = mockItems.reduce((total, item) => total + item.price, 0);
  const total = subtotal + deliveryFee;
  return (
    <aside className="rounded-xl border border-territory-border bg-territory-surface p-4 shadow-territory-subtle sm:p-5 lg:sticky lg:top-5" aria-labelledby="checkout-summary-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="checkout-summary-title" className="font-heading text-lg font-bold text-territory-ink">Seu pedido</h2>
        <button type="button" className="text-xs font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-territory-brand">Adicionar mais itens</button>
      </div>
      <div className="mt-4 divide-y divide-territory-border border-y border-territory-border">
        {mockItems.map((item) => (
          <div key={item.id} className="flex gap-3 py-3">
            <img src={item.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-territory-ink">{item.quantity} × {item.name}</p>
                <span className="shrink-0 text-sm font-bold text-territory-ink">{currency(item.price)}</span>
              </div>
              {item.detail ? <p className="mt-1 text-xs text-territory-muted">{item.detail}</p> : null}
              <div className="mt-2 flex gap-3 text-[0.6875rem] text-territory-brand"><button type="button" className="underline-offset-2 hover:underline">Editar</button><button type="button" className="underline-offset-2 hover:underline">Remover</button></div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 text-sm text-territory-ink">
        <div className="flex items-center justify-between gap-3"><span className="text-territory-muted">Subtotal</span><span>{currency(subtotal)}</span></div>
        <div className="flex items-center justify-between gap-3"><span className="text-territory-muted">Entrega · {mode === "delivery" ? "loja" : "—"}</span><span>{currency(deliveryFee)}</span></div>
        <div className="flex items-center justify-between gap-3 border-t border-territory-border pt-3 text-lg font-bold"><span>Total</span><span>{currency(total)}</span></div>
      </div>
      <p className="mt-3 flex items-center gap-2 rounded-lg bg-territory-success/10 px-3 py-2 text-[0.6875rem] text-territory-ink"><Check className="h-4 w-4 shrink-0 text-territory-success" aria-hidden="true" />Pedido mínimo de R$ 20,00 atingido.</p>
      <Button type="button" onClick={onConfirm} className="mt-4 h-12 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/90">Confirmar pedido · {currency(total)}</Button>
      <p className="mt-3 text-center text-[0.6875rem] leading-4 text-territory-muted">Após confirmar, a loja recebe o pedido e combina os detalhes do pagamento.</p>
      {mode === "delivery" ? <button type="button" className="mt-4 flex w-full items-center justify-between border-t border-territory-border pt-4 text-left text-xs font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Se não houver entregador disponível <ChevronDown className="h-4 w-4" aria-hidden="true" /></button> : null}
      <button type="button" className="mt-4 flex min-h-10 items-center gap-2 text-xs font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><MessageCircle className="h-4 w-4" aria-hidden="true" /> Falar com a loja</button>
    </aside>
  );
}

export default function GastronomyCheckoutConceptSurface() {
  const navigate = useNavigate();
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>("delivery");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("store");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [notes, setNotes] = useState("");
  const subtotal = useMemo(() => mockItems.reduce((total, item) => total + item.price, 0), []);

  const handleModeChange = (nextMode: FulfillmentMode) => {
    setFulfillmentMode(nextMode);
    if (nextMode !== "delivery") setDeliveryOption("store");
  };

  return (
    <div className="min-h-screen bg-territory-bg text-territory-ink">
      <CheckoutHeader onBack={() => navigate(-1)} />
      <main className="mx-auto max-w-[84rem] px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
        <div className="hidden items-center justify-between gap-6 lg:flex">
          <div>
            <button type="button" onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Voltar ao cardápio</button>
            <h1 className="font-heading text-3xl font-bold tracking-[-0.04em] text-territory-ink">Finalizar pedido</h1>
            <p className="mt-1 text-sm text-territory-muted">Confira recebimento, endereço e pagamento antes de confirmar.</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-territory-border bg-territory-surface px-4 py-3 text-xs"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-territory-raised"><UserRound className="h-4 w-4 text-territory-brand" aria-hidden="true" /></span><span>Pedido como <strong>Ana Oliveira</strong> · Pessoal</span><button type="button" className="font-semibold text-territory-brand">Alterar</button></div>
        </div>
        <div className="mt-4 lg:hidden"><BusinessSummary /></div>
        <div className="mt-5 grid gap-5 lg:mt-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="space-y-4 sm:space-y-5">
            <FulfillmentSection mode={fulfillmentMode} deliveryOption={deliveryOption} onModeChange={handleModeChange} onDeliveryOptionChange={setDeliveryOption} />
            <AddressSection mode={fulfillmentMode} />
            <PaymentSection method={paymentMethod} onChange={setPaymentMethod} />
            <ItemsSection />
            <section className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5" aria-labelledby="checkout-notes-title">
              <div className="flex items-center justify-between gap-3"><h2 id="checkout-notes-title" className="font-heading text-base font-bold text-territory-ink">Observações do pedido <span className="font-normal text-territory-muted">(opcional)</span></h2><span className="text-[0.6875rem] text-territory-muted">{notes.length}/280</span></div>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={280} rows={3} placeholder="Algo que a loja precisa saber?" className="mt-3 min-h-20 resize-none rounded-lg border-territory-border bg-territory-surface text-sm placeholder:text-territory-muted" />
            </section>
          </div>
          <OrderSummary mode={fulfillmentMode} onConfirm={() => toast.success("Prévia do checkout pronta para conectar ao pedido real.", { position: "top-center" })} />
        </div>
        <p className="mt-6 hidden text-center text-xs text-territory-muted lg:block">Conceito visual · Dados demonstrativos · Modalidade Achegue-se permanece bloqueada nesta versão.</p>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-territory-border bg-territory-surface/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(18,62,61,0.08)] backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-territory-muted">{fulfillmentMode === "delivery" ? "Entrega da loja" : fulfillmentMode === "pickup" ? "Retirada no estabelecimento" : "No local"}</p><p className="text-base font-bold text-territory-ink">{currency(subtotal + (fulfillmentMode === "delivery" ? 5 : 0))}</p></div><Button type="button" onClick={() => toast.success("Prévia do checkout pronta para conectar ao pedido real.", { position: "top-center" })} className="h-11 shrink-0 rounded-lg bg-territory-sun px-5 text-xs font-bold text-territory-ink hover:bg-territory-sun/90">Confirmar pedido</Button></div>
      </div>
    </div>
  );
}
