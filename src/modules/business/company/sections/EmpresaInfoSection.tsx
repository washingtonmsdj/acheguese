/**
 * EmpresaInfoSection
 * 
 * Seção de informações práticas com endereço, horários, contato, pagamento e facilidades.
 * Layout em grid com coluna principal (esquerda) e sidebar (direita).
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { motion } from 'framer-motion';
import { Truck, MapPinned } from 'lucide-react';
import {
  getServiceModeIcon,
  getServiceModeLabel,
  getServiceModeColor,
} from '@/core/business/constants';
import {
  AddressCard,
  HoursCard,
  ContactCard,
  PaymentCard,
  FacilitiesCard,
} from '../components/info';
import type { EmpresaInfoSectionProps } from './types';

export function EmpresaInfoSection({
  business,
  openStatus,
  addressText,
  locationText,
  isDeliveryBusiness,
  showAllHours,
  copiedPhone,
  onToggleShowAllHours,
  onCopyPhone,
  onRoute,
  navigate,
}: EmpresaInfoSectionProps) {
  const serviceModes =
    business.modos_atendimento && business.modos_atendimento.length > 0
      ? business.modos_atendimento
      : ["presencial"];

  const deliveryAreas = Array.from(
    new Set(
      [business.location?.name, business.business_city]
        .filter((value): value is string => Boolean(value && value.trim()))
        .map((value) => value.trim()),
    ),
  );

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Left column: address, hours, contact */}
        <div className="lg:col-span-2 space-y-4">
          {/* Address + Map */}
          <AddressCard
            business={business}
            addressText={addressText}
            locationText={locationText}
            onRoute={onRoute}
          />

          {/* Operating hours */}
          {business.horario_funcionamento && (
            <HoursCard
              hours={business.horario_funcionamento}
              openStatus={openStatus}
              showAllHours={showAllHours}
              onToggleShowAll={onToggleShowAllHours}
            />
          )}

          {/* Service modes & delivery areas */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                Formas de atendimento
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {serviceModes.map((modo) => {
                const ModoIcon = getServiceModeIcon(modo);
                const label = getServiceModeLabel(modo);
                const color = getServiceModeColor(modo);
                if (!ModoIcon) return null;
                return (
                  <div
                    key={modo}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${color}`}
                  >
                    <ModoIcon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                );
              })}
            </div>
            {/* Delivery areas */}
            {isDeliveryBusiness && deliveryAreas.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Área de atendimento / delivery
                </p>
                <div className="flex flex-wrap gap-2">
                  {deliveryAreas.map((area) => (
                    <span
                      key={area}
                      className="bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-lg"
                    >
                      <MapPinned className="h-3 w-3 inline-block mr-1 -mt-0.5" />
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment methods */}
          <PaymentCard business={business} />
        </div>

        {/* Right sidebar: contact, social, facilities */}
        <div className="space-y-4">
          <ContactCard
            business={business}
            copiedPhone={copiedPhone}
            onCopyPhone={onCopyPhone}
            navigate={navigate!}
          />

          {/* Facilities */}
          {business.facilidades && business.facilidades.length > 0 && (
            <FacilitiesCard facilidades={business.facilidades} />
          )}
        </div>
      </motion.div>
    </section>
  );
}
