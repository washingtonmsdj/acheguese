/**
 * DeliveryAreaPage â€” PÃ¡gina de gestÃ£o de Ã¡reas de entrega
 *
 * Permite criar, editar e gerenciar Ã¡reas de entrega e bairros.
 * SSOT: Usa componentes que consomem hooks
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDeliveryAreas } from '../hooks';
import { DeliveryAreaCard } from '../components/delivery/DeliveryAreaCard';
import { DeliveryAreaForm } from '../components/delivery/DeliveryAreaForm';
import { NeighborhoodManager } from '../components/delivery/NeighborhoodManager';
import { DeliverySummaryWidget } from '../components/delivery/DeliverySummaryWidget';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Plus } from 'lucide-react';
import type { DeliveryArea } from '@/modules/gastronomy/services/DeliveryAreaService';

export default function DeliveryAreaPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const {
    areas,
    isLoading,
    createArea,
    updateArea,
    deleteArea,
    isCreating,
    isUpdating,
  } = useDeliveryAreas(businessId!);

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [managingNeighborhoods, setManagingNeighborhoods] = useState<DeliveryArea | null>(null);

  if (!businessId) {
    return (
      <div className="container max-w-6xl py-8">
        <p className="text-center text-destructive">ID do negÃ³cio nÃ£o encontrado</p>
      </div>
    );
  }

  const handleSaveArea = (data: {
    name: string;
    description?: string;
    delivery_fee: number;
    minimum_order_value?: number;
    estimated_time_min?: number;
    is_active?: boolean;
  }) => {
    if (editingArea) {
      // Atualizar Ã¡rea existente
      updateArea({
        areaId: editingArea.id,
        data,
      });
      setEditingArea(null);
    } else {
      // Criar nova Ã¡rea
      createArea(data);
      setIsCreatingNew(false);
    }
  };

  const handleDeleteArea = (areaId: string) => {
    if (confirm('Deseja realmente deletar esta Ã¡rea? Todos os bairros serÃ£o removidos.')) {
      deleteArea(areaId);
    }
  };

  // Se estÃ¡ gerenciando bairros, mostra apenas o manager
  if (managingNeighborhoods) {
    return (
      <div className="container max-w-4xl py-8">
        <NeighborhoodManager
          area={managingNeighborhoods}
          onClose={() => setManagingNeighborhoods(null)}
        />
      </div>
    );
  }

  // Se estÃ¡ criando/editando, mostra apenas o form
  if (isCreatingNew || editingArea) {
    return (
      <div className="container max-w-4xl py-8">
        <DeliveryAreaForm
          area={editingArea}
          onSave={handleSaveArea}
          onCancel={() => {
            setIsCreatingNew(false);
            setEditingArea(null);
          }}
          isSaving={isCreating || isUpdating}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MapPin className="w-8 h-8" />
            Ãreas de Entrega
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure Ã¡reas, bairros atendidos e taxas de entrega
          </p>
        </div>
        <Button onClick={() => setIsCreatingNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Ãrea
        </Button>
      </div>

      {/* Resumo */}
      <DeliverySummaryWidget businessId={businessId} />

      {/* Lista de Ãreas */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando Ã¡reas...</p>
        </div>
      ) : areas && areas.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Ãreas Configuradas</h2>
          <div className="space-y-4">
            {areas.map((area) => (
              <DeliveryAreaCard
                key={area.id}
                area={area}
                onEdit={setEditingArea}
                onDelete={handleDeleteArea}
                onManageNeighborhoods={setManagingNeighborhoods}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma Ã¡rea configurada</h3>
          <p className="text-muted-foreground mb-4">
            Crie sua primeira Ã¡rea de entrega para comeÃ§ar a receber pedidos
          </p>
          <Button onClick={() => setIsCreatingNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Ãrea
          </Button>
        </div>
      )}
    </div>
  );
}



