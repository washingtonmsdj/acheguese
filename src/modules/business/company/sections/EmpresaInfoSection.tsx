import { Truck } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import {
  getServiceModeColor,
  getServiceModeIcon,
  getServiceModeLabel,
} from '@/core/business/constants';
import {
  AddressCard,
  ContactCard,
  FacilitiesCard,
  HoursCard,
  PaymentCard,
} from '../components/info';
import type { EmpresaInfoSectionProps } from './types';

export function EmpresaInfoSection({
  business,
  openStatus,
  addressText,
  locationText,
  showAllHours,
  copiedPhone,
  embedded = false,
  hideAddressCard = false,
  showSidebar = true,
  sidebarClassName,
  onToggleShowAllHours,
  onCopyPhone,
  onRoute,
  navigate,
}: EmpresaInfoSectionProps) {
  const serviceModes =
    business.modos_atendimento && business.modos_atendimento.length > 0
      ? business.modos_atendimento
      : ['presencial'];
  const getServiceModeCaption = (mode: string) => {
    switch (mode) {
      case 'delivery':
        return 'Taxa e prazo sob consulta';
      case 'retirada':
        return 'Retire no local';
      case 'consumo_local':
        return 'Ambiente climatizado';
      case 'presencial':
      default:
        return 'Atendimento presencial';
    }
  };

  const content = (
    <div
      className={
        showSidebar
          ? 'grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.8fr)]'
          : 'grid grid-cols-1 gap-4'
      }
    >
      <div className="space-y-4">
        {!hideAddressCard ? (
          <AddressCard
            business={business}
            addressText={addressText}
            locationText={locationText}
            onRoute={onRoute}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-3 [@media(max-height:1100px)]:gap-3">
          {business.horario_funcionamento ? (
            <HoursCard
              hours={business.horario_funcionamento}
              openStatus={openStatus}
              showAllHours={showAllHours}
              onToggleShowAll={onToggleShowAllHours}
            />
          ) : null}

          <div className="hidden xl:block">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-3.5 sm:p-5 [@media(max-height:1100px)]:sm:p-4">
              <div className="mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-teal-300" />
                <h2 className="text-base font-semibold text-white">Formas de atendimento</h2>
              </div>
              <div className="space-y-2">
                {serviceModes.slice(0, 3).map((mode) => {
                  const Icon = getServiceModeIcon(mode);
                  if (!Icon) return null;
                  return (
                    <div
                      key={mode}
                      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${getServiceModeColor(mode)}`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[0.92rem] font-medium">{getServiceModeLabel(mode)}</p>
                        <p className="truncate text-[11px] text-white/52">{getServiceModeCaption(mode)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="hidden xl:block">
            <PaymentCard business={business} />
          </div>
        </div>
      </div>

      {showSidebar ? (
        <div className={cn('space-y-4', sidebarClassName)}>
          <ContactCard
            business={business}
            copiedPhone={copiedPhone}
            onCopyPhone={onCopyPhone}
          />

          {business.facilidades && business.facilidades.length > 0 ? (
            <FacilitiesCard facilidades={business.facilidades} />
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="mx-auto mt-3.5 w-full max-w-[1400px] px-4 sm:px-6 xl:px-8 2xl:max-w-[1480px] 2xl:px-10">
      {content}
    </section>
  );
}
