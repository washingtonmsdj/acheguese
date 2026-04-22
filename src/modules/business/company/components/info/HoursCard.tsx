/**
 * HoursCard
 * 
 * Card de horário de funcionamento com status atual e horários da semana.
 * Expansível para mostrar todos os dias.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WEEK_DAY_LABELS, type WeekDay } from '@/core/business/constants';
import type { HoursCardProps } from '../../sections/types';

export function HoursCard({
  hours,
  openStatus,
  showAllHours,
  onToggleShowAll,
}: HoursCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <button
        onClick={onToggleShowAll}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            Horário de funcionamento
          </h2>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            showAllHours ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Today's status */}
      <div
        className={`flex items-center gap-2 mb-3 p-2.5 rounded-lg ${
          openStatus.open
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : "bg-destructive/10 border border-destructive/20"
        }`}
      >
        <div
          className={`h-2 w-2 rounded-full ${
            openStatus.open ? "bg-emerald-500 animate-pulse" : "bg-destructive"
          }`}
        />
        <span
          className={`text-sm font-semibold ${
            openStatus.open ? "text-emerald-400" : "text-destructive"
          }`}
        >
          {openStatus.open ? "Aberto agora" : "Fechado"}
        </span>
        {openStatus.todayHours && (
          <span className="text-sm text-muted-foreground">
            · Hoje: {openStatus.todayHours}
          </span>
        )}
      </div>

      {/* Full schedule */}
      <AnimatePresence>
        {showAllHours && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            {Object.entries(hours).map(([day, schedule]) => {
              const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
              const isToday = days[new Date().getDay()] === day;
              
              return (
                <div
                  key={day}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    isToday ? "bg-primary/5 border border-primary/10" : ""
                  }`}
                >
                  <span
                    className={`text-sm ${
                      isToday ? "font-bold text-primary" : "text-foreground"
                    }`}
                  >
                    {WEEK_DAY_LABELS[day as WeekDay] || day}{" "}
                    {isToday && <span className="text-xs ml-1">(hoje)</span>}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {schedule?.open && schedule?.close
                      ? `${schedule.open} – ${schedule.close}`
                      : "Fechado"}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
