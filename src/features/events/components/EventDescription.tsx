/**
 * EVENT DESCRIPTION
 * 
 * Secao de descricao rica do evento
 * 
 */

import { motion } from 'framer-motion';
import { FileText, CheckCircle2, Package, AlertCircle, Users2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { Event } from '../types';

interface EventDescriptionProps {
  event: Event;
  className?: string;
}

export function EventDescription({ event, className }: EventDescriptionProps) {
  return (
    <section className={cn("py-12 bg-muted/30", className)}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              <FileText className="h-4 w-4" />
              Sobre o evento
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              O que voce vai encontrar
            </h2>
          </div>

          {/* Description */}
          <div className="prose prose-lg max-w-none mb-8">
            <div 
              className="text-foreground leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </div>

          {/* Additional Info Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Requirements */}
            {event.requirements && event.requirements.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Requisitos</h3>
                </div>
                <ul className="space-y-2">
                  {event.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What to Bring */}
            {event.what_to_bring && event.what_to_bring.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Package className="h-5 w-5 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">O que levar</h3>
                </div>
                <ul className="space-y-2">
                  {event.what_to_bring.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Age Restriction */}
            {event.age_restriction && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Classificacao</h3>
                </div>
                <p className="text-sm text-muted-foreground">{event.age_restriction}</p>
              </div>
            )}

            {/* Accessibility */}
            {event.accessibility_info && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Users2 className="h-5 w-5 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Acessibilidade</h3>
                </div>
                <p className="text-sm text-muted-foreground">{event.accessibility_info}</p>
              </div>
            )}
          </div>

          {/* Features */}
          {event.features && (
            <div className="mt-8 rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-bold text-foreground">O evento inclui</h3>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {event.features.has_certificate && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Certificado</span>
                  </div>
                )}
                {event.features.has_recording && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Gravacao disponivel</span>
                  </div>
                )}
                {event.features.has_networking && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Networking</span>
                  </div>
                )}
                {event.features.has_food && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Alimentacao</span>
                  </div>
                )}
                {event.features.has_parking && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Estacionamento</span>
                  </div>
                )}
                {event.features.is_accessible && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Acessivel</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
