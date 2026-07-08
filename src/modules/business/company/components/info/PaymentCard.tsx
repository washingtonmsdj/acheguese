import { Banknote, CreditCard } from 'lucide-react';
import { getPaymentMethodLabel } from '@/core/business/constants';
import type { PaymentCardProps } from '../../sections/types';

export function PaymentCard({ business }: PaymentCardProps) {
  const hasPaymentInfo =
    (business.formas_pagamento?.length ?? 0) > 0 ||
    business.aceita_pix ||
    business.aceita_cartao;

  if (!hasPaymentInfo) return null;

  const methods = [
    ...(business.aceita_pix ? ["PIX"] : []),
    ...(business.formas_pagamento ?? []),
  ].filter((method, index, list) => {
    const normalized = method.trim().toLowerCase();
    return list.findIndex((candidate) => candidate.trim().toLowerCase() === normalized) === index;
  });

  const shouldUseGrid = methods.length >= 4;

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-3.5 sm:p-4 [@media(max-height:1100px)]:sm:p-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-teal-300" />
        <h2 className="text-base font-semibold text-white">Formas de pagamento</h2>
      </div>
      {shouldUseGrid ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {methods.map((method, index) => (
            <div
              key={`${method}-${index}`}
              className="flex min-h-[5rem] flex-col items-center justify-center rounded-[18px] border border-white/10 bg-black/20 px-2.5 py-2.5 text-center [@media(max-height:1100px)]:min-h-[4.35rem]"
            >
              <span className="mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-white/84">
                {method === "PIX" ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
              </span>
              <span className="text-xs font-medium leading-4 text-white/76">
                {method === "PIX" ? "PIX" : getPaymentMethodLabel(method)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {business.aceita_pix ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
              <Banknote className="h-3.5 w-3.5" /> PIX
            </span>
          ) : null}
          {business.aceita_cartao ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-200">
              <CreditCard className="h-3.5 w-3.5" /> Cartao
            </span>
          ) : null}
          {business.formas_pagamento?.map((method, index) => (
            <span
              key={`${method}-${index}`}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-white/70"
            >
              {method}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
