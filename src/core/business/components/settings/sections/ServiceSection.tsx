/**
 * ServiceSection
 * 
 * Seção de atendimento e serviços.
 * Inclui: modos de atendimento, áreas, formas de pagamento, facilidades, especialidades.
 */

import { Store } from "lucide-react";
import { ServiceModesSelector } from "../ServiceModesSelector";
import { PaymentMethodsSelector } from "../PaymentMethodsSelector";
import { FacilitiesSelector } from "../FacilitiesSelector";
import { SpecialtiesEditor } from "../SpecialtiesEditor";

interface ServiceInfo {
  modos_atendimento: string[];
  areas_entrega?: string[];
  formas_pagamento: string[];
  facilidades: string[];
  especialidades: string[];
  category?: string;
}

interface ServiceSectionProps {
  data: ServiceInfo;
  onChange: (data: ServiceInfo) => void;
  className?: string;
}

export function ServiceSection({
  data,
  onChange,
  className,
}: ServiceSectionProps) {
  const handleModesChange = (modes: string[]) => {
    onChange({ ...data, modos_atendimento: modes });
  };

  const handleAreasChange = (areas: string[]) => {
    onChange({ ...data, areas_entrega: areas });
  };

  const handlePaymentChange = (methods: string[]) => {
    onChange({ ...data, formas_pagamento: methods });
  };

  const handleFacilitiesChange = (facilities: string[]) => {
    onChange({ ...data, facilidades: facilities });
  };

  const handleSpecialtiesChange = (specialties: string[]) => {
    onChange({ ...data, especialidades: specialties });
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Atendimento e Serviços
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure como sua empresa atende e o que oferece
        </p>
      </div>

      <div className="space-y-8">
        {/* Modos de Atendimento */}
        <ServiceModesSelector
          selected={data.modos_atendimento}
          onChange={handleModesChange}
          deliveryAreas={data.areas_entrega}
          onDeliveryAreasChange={handleAreasChange}
        />

        {/* Formas de Pagamento */}
        <div className="pt-6 border-t border-border">
          <PaymentMethodsSelector
            selected={data.formas_pagamento}
            onChange={handlePaymentChange}
            allowCustom={true}
          />
        </div>

        {/* Facilidades */}
        <div className="pt-6 border-t border-border">
          <FacilitiesSelector
            selected={data.facilidades}
            onChange={handleFacilitiesChange}
          />
        </div>

        {/* Especialidades */}
        <div className="pt-6 border-t border-border">
          <SpecialtiesEditor
            specialties={data.especialidades}
            onChange={handleSpecialtiesChange}
            maxTags={10}
            category={data.category}
          />
        </div>
      </div>
    </div>
  );
}
