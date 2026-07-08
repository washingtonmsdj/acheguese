import {
  Banknote,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Facebook,
  Instagram,
  Sparkles,
  Truck,
} from "lucide-react";
import { getPaymentMethodLabel, getServiceModeLabel } from "@/core/business/constants";
import { buildFacebookUrl, buildInstagramUrl } from "@/shared/utils/contactLinks";
import type { BusinessExtended, Product } from "../../sections/types";

interface CompanyInfoCardProps {
  readonly business: BusinessExtended;
  readonly products: readonly Product[];
}

function derivePriceBandLabel(business: BusinessExtended, products: readonly Product[]): string | null {
  if (business.price_band_label) return business.price_band_label;
  if (products.length === 0) return null;

  const prices = products
    .map((product) => product.promotional_price ?? product.price)
    .filter((value) => Number.isFinite(value) && value > 0);

  if (prices.length === 0) return null;

  const average = prices.reduce((sum, value) => sum + value, 0) / prices.length;
  if (average < 35) return "$ - Economico";
  if (average < 75) return "$$ - Medio";
  return "$$$ - Premium";
}

function derivePaymentMethods(business: BusinessExtended): string[] {
  return [
    ...(business.aceita_pix ? ["PIX"] : []),
    ...(business.formas_pagamento ?? []),
  ].filter((method, index, list) => {
    const normalized = method.trim().toLowerCase();
    return list.findIndex((candidate) => candidate.trim().toLowerCase() === normalized) === index;
  });
}

export function CompanyInfoCard({ business, products }: CompanyInfoCardProps) {
  const paymentMethods = derivePaymentMethods(business).slice(0, 4);
  const serviceModes = (business.modos_atendimento ?? []).slice(0, 3);
  const priceBandLabel = derivePriceBandLabel(business, products);
  const instagramUrl = buildInstagramUrl(business.instagram);
  const facebookUrl = buildFacebookUrl(business.facebook);
  const hasSocials = Boolean(instagramUrl || facebookUrl);

  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-[0.8125rem] [@media(max-height:1100px)]:rounded-[22px] [@media(max-height:1100px)]:p-2.5 [@media(max-height:860px)]:rounded-[22px] [@media(max-height:860px)]:p-2.5">
      <div className="mb-2.5 flex items-center justify-between gap-3 [@media(max-height:1100px)]:mb-2">
        <h2 className="text-[1.02rem] font-semibold text-white [@media(max-height:1100px)]:text-[0.96rem] [@media(max-height:860px)]:text-[0.98rem]">
          Informacoes da empresa
        </h2>
        <span className="rounded-full border border-teal-400/18 bg-teal-400/8 px-2.5 py-1 text-[10px] font-semibold uppercase text-teal-200">
          Perfil
        </span>
      </div>

      {business.especialidades?.length ? (
        <div className="rounded-[18px] border border-white/8 bg-black/16 p-2.5 [@media(max-height:1100px)]:p-2">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-white/70 [@media(max-height:1100px)]:mb-1.5 [@media(max-height:1100px)]:text-[11px]">
            <Sparkles className="h-3.5 w-3.5 text-teal-300" />
            Especialidades
          </div>
          <div className="flex flex-wrap gap-1.5 [@media(max-height:1100px)]:gap-1">
            {business.especialidades.slice(0, 3).map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-[0.1875rem] text-[10.5px] font-medium text-white/78 [@media(max-height:1100px)]:px-2 [@media(max-height:1100px)]:text-[10px]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {paymentMethods.length ? (
        <div className="border-b border-white/8 py-[0.5625rem] [@media(max-height:1100px)]:py-[0.4375rem]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] text-white/62 [@media(max-height:1100px)]:text-[11px]">Pagamento</p>
            <div className="flex items-center gap-1.5 [@media(max-height:1100px)]:gap-[0.3125rem]">
              {paymentMethods.map((method, index) => (
                <span
                  key={`${method}-${index}`}
                  className="inline-flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/82 [@media(max-height:1100px)]:h-6 [@media(max-height:1100px)]:w-6 [@media(max-height:1100px)]:rounded-[9px]"
                  title={method === "PIX" ? "PIX" : getPaymentMethodLabel(method)}
                >
                  {method === "PIX" ? (
                    <Banknote className="h-4 w-4 text-teal-300" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-white/78" />
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {serviceModes.length ? (
        <div className="border-b border-white/8 py-[0.5625rem] [@media(max-height:1100px)]:py-[0.4375rem]">
          <div className="flex items-center gap-3">
            <p className="flex w-[92px] shrink-0 items-center gap-1.5 text-[12px] text-white/62 [@media(max-height:1100px)]:w-[82px] [@media(max-height:1100px)]:text-[11px]">
              <Truck className="h-3.5 w-3.5 text-teal-300" />
              Atendimento
            </p>
            <p className="truncate text-[12px] text-white/78 [@media(max-height:1100px)]:text-[11px]">
              {serviceModes.map((mode) => getServiceModeLabel(mode)).join(" / ")}
            </p>
          </div>
        </div>
      ) : null}

      {business.delivery_eta_label ? (
        <div className="border-b border-white/8 py-[0.5625rem] [@media(max-height:1100px)]:py-[0.4375rem]">
          <div className="flex items-center gap-3">
            <p className="w-[92px] shrink-0 text-[12px] text-white/62 [@media(max-height:1100px)]:w-[82px] [@media(max-height:1100px)]:text-[11px]">
              Tempo medio
            </p>
            <p className="inline-flex items-center gap-1.5 text-[12px] text-white/78 [@media(max-height:1100px)]:text-[11px]">
              <Clock3 className="h-4 w-4 text-teal-300" />
              {business.delivery_eta_label}
            </p>
          </div>
        </div>
      ) : null}

      {priceBandLabel ? (
        <div className="border-b border-white/8 py-[0.5625rem] [@media(max-height:1100px)]:py-[0.4375rem]">
          <div className="flex items-center gap-3">
            <p className="w-[92px] shrink-0 text-[12px] text-white/62 [@media(max-height:1100px)]:w-[82px] [@media(max-height:1100px)]:text-[11px]">
              Preco
            </p>
            <p className="inline-flex items-center gap-1.5 text-[12px] text-white/78 [@media(max-height:1100px)]:text-[11px]">
              <CircleDollarSign className="h-4 w-4 text-teal-300" />
              {priceBandLabel}
            </p>
          </div>
        </div>
      ) : null}

      {hasSocials ? (
        <div className="pt-[0.5625rem] [@media(max-height:1100px)]:pt-[0.4375rem]">
          <div className="flex items-center gap-3">
            <p className="w-[92px] shrink-0 text-[12px] text-white/62 [@media(max-height:1100px)]:w-[82px] [@media(max-height:1100px)]:text-[11px]">
              Redes
            </p>
            <div className="flex items-center gap-2 [@media(max-height:1100px)]:gap-1.5">
              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-xl border border-white/10 bg-black/20 text-[#ff5c8a] transition-colors hover:border-white/20 [@media(max-height:1100px)]:h-6 [@media(max-height:1100px)]:w-6 [@media(max-height:1100px)]:rounded-[9px]"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              ) : null}
              {facebookUrl ? (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-xl border border-white/10 bg-black/20 text-[#4e87ff] transition-colors hover:border-white/20 [@media(max-height:1100px)]:h-6 [@media(max-height:1100px)]:w-6 [@media(max-height:1100px)]:rounded-[9px]"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
