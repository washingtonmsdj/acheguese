/**
 * PaymentCard
 * 
 * Card de formas de pagamento com badges coloridos.
 * Destaque para PIX e Cartão.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { CreditCard, Banknote } from 'lucide-react';
import type { PaymentCardProps } from '../../sections/types';

export function PaymentCard({ business }: PaymentCardProps) {
  const hasPaymentInfo =
    (business.formas_pagamento?.length ?? 0) > 0 ||
    business.aceita_pix ||
    business.aceita_cartao;

  if (!hasPaymentInfo) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="h-4 w-4 text-primary" />
        <h2 className="text-base font-bold text-foreground">
          Formas de pagamento
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {business.aceita_pix && (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium px-3 py-2 rounded-lg">
            <Banknote className="h-3.5 w-3.5" /> PIX
          </span>
        )}
        {business.aceita_cartao && (
          <span className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-medium px-3 py-2 rounded-lg">
            <CreditCard className="h-3.5 w-3.5" /> Cartão
          </span>
        )}
        {business.formas_pagamento?.map((method, idx) => (
          <span
            key={idx}
            className="bg-secondary text-secondary-foreground text-xs font-medium px-3 py-2 rounded-lg border border-border"
          >
            {method}
          </span>
        ))}
      </div>
    </div>
  );
}
