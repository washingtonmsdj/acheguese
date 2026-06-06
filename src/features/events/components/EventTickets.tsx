/**
 * Event tickets
 * 
 * Secao de ingressos/inscricoes
 * Suporta eventos gratuitos, pagos e hibridos
 * 
 */

import { motion } from 'framer-motion';
import { Check, Ticket, Users, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { formatBrl } from '@/shared/utils/currency';
import type { EventTicket } from '../types';

interface EventTicketsProps {
  tickets: EventTicket[];
  isFree: boolean;
  onSelectTicket: (ticketId: string) => void;
  disabled?: boolean;
  disabledLabel?: string;
  className?: string;
}

export function EventTickets({ 
  tickets, 
  isFree, 
  onSelectTicket,
  disabled = false,
  disabledLabel = 'Inscricao confirmada',
  className 
}: EventTicketsProps) {
  const availableTickets = tickets.filter(t => t.status === 'disponivel');
  const hasAvailability = availableTickets.length > 0;

  return (
    <section className={cn("py-12", className)}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Ticket className="h-4 w-4" />
            {isFree ? 'Inscricoes gratuitas' : 'Ingressos'}
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            {isFree ? 'Garanta sua vaga' : 'Escolha seu ingresso'}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {hasAvailability 
              ? 'Selecione a melhor opcao para voce' 
              : 'Ingressos esgotados'}
          </p>
        </motion.div>

        {/* Tickets Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {tickets.map((ticket, index) => {
            const isAvailable = ticket.status === 'disponivel' && ticket.quantity_available > 0;
            const isSoldOut = ticket.status === 'esgotado' || ticket.quantity_available === 0;
            const isComingSoon = ticket.status === 'em_breve';
            const occupancyRate = (ticket.quantity_sold / ticket.quantity_total) * 100;
            const isAlmostSoldOut = occupancyRate >= 80 && !isSoldOut;
            const canSelect = isAvailable && !disabled;

            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border-2 bg-card p-6 transition-all",
                  canSelect
                    ? "border-border hover:border-primary hover:shadow-xl cursor-pointer" 
                    : "border-border/50 opacity-60"
                )}
                onClick={() => canSelect && onSelectTicket(ticket.id)}
              >
                {/* Popular Badge */}
                {index === 0 && isAvailable && (
                  <div className="absolute right-4 top-4">
                    <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white border-0 gap-1">
                      <Sparkles className="h-3 w-3" />
                      Popular
                    </Badge>
                  </div>
                )}

                {/* Status Badge */}
                {isSoldOut && (
                  <div className="absolute right-4 top-4">
                    <Badge variant="destructive">Esgotado</Badge>
                  </div>
                )}
                {isComingSoon && (
                  <div className="absolute right-4 top-4">
                    <Badge variant="secondary">Em breve</Badge>
                  </div>
                )}
                {isAlmostSoldOut && (
                  <div className="absolute right-4 top-4">
                    <Badge className="bg-amber-500 text-white border-0 animate-pulse">
                      Ultimas unidades
                    </Badge>
                  </div>
                )}

                {/* Ticket Icon */}
                <div className={cn(
                  "mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all",
                  isAvailable 
                    ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  <Ticket className="h-6 w-6" />
                </div>

                {/* Ticket Name */}
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  {ticket.name}
                </h3>

                {/* Description */}
                {ticket.description && (
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                    {ticket.description}
                  </p>
                )}

                {/* Price */}
                <div className="mb-4">
                  {ticket.is_free ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">Gratuito</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">
                        {formatBrl(ticket.price)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Availability Info */}
                <div className="mb-4 space-y-2">
                  {/* Quantity Available */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {isAvailable ? (
                        <>
                          <span className="font-semibold text-foreground">
                            {ticket.quantity_available}
                          </span>
                          {' '}de {ticket.quantity_total} disponiveis
                        </>
                      ) : isSoldOut ? (
                        'Esgotado'
                      ) : (
                        'Em breve'
                      )}
                    </span>
                  </div>

                  {/* Sales Period */}
                  {ticket.sales_end && isAvailable && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Vendas ate {new Date(ticket.sales_end).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}

                  {/* Min/Max per order */}
                  {ticket.max_per_order && isAvailable && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Max. {ticket.max_per_order} por pessoa
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {isAvailable && (
                  <div className="mb-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${occupancyRate}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className={cn(
                          "h-full rounded-full",
                          occupancyRate >= 90 ? "bg-red-500" :
                          occupancyRate >= 70 ? "bg-amber-500" :
                          "bg-primary"
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  className={cn(
                    "w-full gap-2",
                    canSelect && "bg-primary hover:bg-primary/90"
                  )}
                  disabled={!canSelect}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canSelect) {
                      onSelectTicket(ticket.id);
                    }
                  }}
                >
                  {disabled ? (
                    disabledLabel
                  ) : isSoldOut ? (
                    'Esgotado'
                  ) : isComingSoon ? (
                    'Em breve'
                  ) : ticket.is_free ? (
                    <>
                      <Check className="h-4 w-4" />
                      Garantir vaga gratis
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4" />
                      Comprar ingresso
                    </>
                  )}
                </Button>

                {/* Hover Effect */}
                {isAvailable && (
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* No Tickets Available */}
        {!hasAvailability && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center"
          >
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Ingressos esgotados
            </h3>
            <p className="text-sm text-muted-foreground">
              Todos os ingressos para este evento ja foram vendidos.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
