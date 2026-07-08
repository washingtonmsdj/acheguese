import { ChevronDown, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { WEEK_DAY_LABELS, type WeekDay } from '@/core/business/constants';
import { cn } from '@/shared/utils/cn';
import type { HoursCardProps } from '../../sections/types';

export function HoursCard({
  hours,
  openStatus,
  showAllHours,
  onToggleShowAll,
}: HoursCardProps) {
  const openStatusLabel =
    openStatus.open === true
      ? 'Aberto agora'
      : openStatus.open === false
        ? 'Fechado'
        : 'Horario nao informado';
  const openStatusContainerClass =
    openStatus.open === true
      ? 'border-emerald-400/20 bg-emerald-400/10'
      : openStatus.open === false
        ? 'border-rose-400/20 bg-rose-400/10'
        : 'border-white/10 bg-white/[0.04]';
  const openStatusDotClass =
    openStatus.open === true
      ? 'bg-emerald-300 animate-pulse'
      : openStatus.open === false
        ? 'bg-rose-300'
        : 'bg-white/36';
  const openStatusTextClass =
    openStatus.open === true
      ? 'text-emerald-200'
      : openStatus.open === false
        ? 'text-rose-200'
        : 'text-white/72';

  const orderedDays = Object.keys(WEEK_DAY_LABELS) as WeekDay[];
  const hasDetailedHours = orderedDays.some((day) => {
    const period = hours[day];
    return Boolean(period?.closed || (period?.open && period?.close));
  });
  const groupedDays = orderedDays.reduce<Array<{ label: string; value: string; signature: string }>>(
    (acc, day) => {
      const period = hours[day];
      const label = WEEK_DAY_LABELS[day];
      const value = period?.closed
        ? 'Fechado'
        : period?.open && period?.close
          ? `${period.open} - ${period.close}`
          : 'Nao informado';
      const signature = `${period?.closed ? 'closed' : 'open'}-${period?.open ?? ''}-${period?.close ?? ''}`;

      const last = acc.at(-1);
      if (last && last.signature === signature) {
        const firstLabel = last.label.split(' a ')[0];
        last.label = `${firstLabel} a ${label}`;
        return acc;
      }

      acc.push({ label, value, signature });
      return acc;
    },
    [],
  );
  const visibleGroups = showAllHours ? groupedDays : groupedDays.slice(0, 4);

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-3.5 sm:p-4 [@media(max-height:1100px)]:sm:p-3.5">
      <div className="mb-2.5 flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-300" />
          <h2 className="text-base font-semibold text-white">Horario de funcionamento</h2>
        </div>
        {hasDetailedHours ? (
          <button
            type="button"
            onClick={onToggleShowAll}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-white/44 transition-colors hover:bg-white/[0.03] hover:text-white/72"
            aria-label={showAllHours ? 'Ocultar semana completa' : 'Mostrar semana completa'}
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', showAllHours && 'rotate-180')}
            />
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-2xl border px-3 py-2',
          openStatusContainerClass,
        )}
      >
        <div className={cn('h-2 w-2 rounded-full', openStatusDotClass)} />
        <span className={cn('text-sm font-semibold', openStatusTextClass)}>{openStatusLabel}</span>
        {openStatus.todayHours ? (
          <span className="text-xs text-white/48 sm:text-sm">Hoje: {openStatus.todayHours}</span>
        ) : null}
      </div>

      {hasDetailedHours ? (
        <>
          <div className="mt-2.5 space-y-1.5">
            {visibleGroups.map((group) => {
              const isClosed = group.value === 'Fechado';
              return (
                <div
                  key={`${group.label}-${group.signature}`}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-3 py-[0.4375rem]"
                >
                  <span className="text-[0.92rem] font-medium text-white/74">{group.label}</span>
                  <span className={cn('text-[0.92rem]', isClosed ? 'text-white/38' : 'text-white/64')}>
                    {group.value}
                  </span>
                </div>
              );
            })}
          </div>

          <AnimatePresence initial={false}>
            {showAllHours ? null : groupedDays.length > visibleGroups.length ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pt-2.5 text-xs text-white/42"
              >
                Toque para ver a semana completa.
              </motion.p>
            ) : null}
          </AnimatePresence>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-white/44">
          Horarios publicos ainda nao informados.
        </p>
      )}
    </div>
  );
}
