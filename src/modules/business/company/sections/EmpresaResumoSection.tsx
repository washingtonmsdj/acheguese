import { useMemo, useState } from 'react';
import { ChefHat, Flame, Info, Leaf } from 'lucide-react';
import {
  getServiceModeColor,
  getServiceModeIcon,
  getServiceModeLabel,
} from '@/core/business/constants';
import type { EmpresaResumoSectionProps } from './types';

export function EmpresaResumoSection({
  business,
  yearsActive,
  embedded = false,
}: EmpresaResumoSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const serviceModes =
    business.modos_atendimento && business.modos_atendimento.length > 0
      ? business.modos_atendimento.slice(0, 3)
      : ['presencial'];
  const description = business.description?.trim() ?? '';
  const hasLongDescription = description.length > 140;
  const mobileServiceModeLayout = useMemo(() => {
    if (serviceModes.length <= 1) return 'single';
    if (serviceModes.length === 2) return 'double';
    return 'triple';
  }, [serviceModes.length]);

  const getServiceModeCaption = (mode: string) => {
    switch (mode) {
      case 'delivery':
        return 'Entrega na regiao';
      case 'retirada':
        return 'Retire no local';
      case 'consumo_local':
        return 'Ambiente dedicado';
      case 'presencial':
      default:
        return 'Atendimento presencial';
    }
  };

  const getSpecialtyIcon = (specialty: string, index: number) => {
    const normalized = specialty.toLowerCase();
    if (normalized.includes('forno') || normalized.includes('lenha')) return Flame;
    if (normalized.includes('ingred') || normalized.includes('selec')) return Leaf;
    if (normalized.includes('receita') || normalized.includes('chef')) return ChefHat;
    return [Leaf, Flame, ChefHat][index % 3];
  };

  return (
    <section
      className={
        embedded
          ? 'w-full'
          : 'mx-auto mt-6 w-full max-w-[1400px] px-4 sm:px-6 xl:px-8 2xl:max-w-[1480px] 2xl:px-10'
      }
    >
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-3.5 sm:p-5 [@media(max-height:1100px)]:sm:p-4">
        <div className="mb-2.5 flex items-center gap-2">
          <Info className="h-4 w-4 text-teal-300" />
          <h2 className="text-base font-semibold text-white">Sobre a empresa</h2>
        </div>

        {description ? (
          <div className="mb-3">
            <p
              className={[
                'text-[0.97rem] leading-7 text-white/72 sm:text-[0.98rem] sm:leading-7 [@media(max-height:1100px)]:sm:text-[0.92rem] [@media(max-height:1100px)]:sm:leading-6 [@media(max-height:1100px)]:line-clamp-2',
                hasLongDescription && !expanded ? 'line-clamp-3' : '',
              ].join(' ')}
            >
              {description}
            </p>
            {hasLongDescription ? (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="mt-1.5 text-sm font-medium text-teal-200 transition-colors hover:text-teal-100"
              >
                {expanded ? 'Ver menos' : 'Ver mais'}
              </button>
            ) : null}
          </div>
        ) : null}

        <div
          className={[
            'mb-3.5 gap-2 sm:hidden',
            mobileServiceModeLayout === 'single'
              ? 'grid grid-cols-1'
              : mobileServiceModeLayout === 'double'
                ? 'grid grid-cols-2'
                : 'grid grid-cols-3',
          ].join(' ')}
        >
          {serviceModes.map((mode) => {
            const Icon = getServiceModeIcon(mode);
            if (!Icon) return null;
            return (
              <div
                key={mode}
                className={[
                  'rounded-[18px] border border-white/10 bg-black/20',
                  mobileServiceModeLayout === 'single'
                    ? 'flex items-center gap-3 px-3 py-2.5'
                    : 'px-2.5 py-2.5',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-2xl border',
                    mobileServiceModeLayout === 'single' ? 'shrink-0' : 'mb-2',
                    getServiceModeColor(mode),
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p
                    className={[
                      'font-semibold leading-4 text-white',
                      mobileServiceModeLayout === 'single' ? 'text-xs' : 'text-[11px]',
                    ].join(' ')}
                  >
                    {getServiceModeLabel(mode)}
                  </p>
                  <p
                    className={[
                      'mt-1 leading-4 text-white/48',
                      mobileServiceModeLayout === 'single' ? 'text-[11px]' : 'text-[10px]',
                    ].join(' ')}
                  >
                    {getServiceModeCaption(mode)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {business.especialidades && business.especialidades.length > 0 ? (
          <div className="border-t border-white/8 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/44">
              Especialidades
            </p>
            <div className="grid grid-cols-3 gap-2">
              {business.especialidades.slice(0, 3).map((specialty, index) => {
                const Icon = getSpecialtyIcon(specialty, index);
                return (
                <div
                  key={`${specialty}-${index}`}
                  className="rounded-[18px] border border-white/10 bg-black/20 px-2.5 py-2.5 text-center"
                >
                  <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-teal-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] font-medium leading-4 text-white/82">{specialty}</p>
                </div>
              );})}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
