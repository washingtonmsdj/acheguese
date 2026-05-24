/**
 * DeliveryAreaPage — Página de gestão de áreas de entrega
 *
 * Permite criar, editar e gerenciar áreas de entrega e bairros.
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
import { ConfirmActionDialog } from '@/shared/components/ConfirmActionDialog';
import { MapPin, Plus } from 'lucide-react';
import type { DeliveryArea } from '@/modules/business/gastronomy/services/DeliveryAreaService';

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
  const [areaToDelete, setAreaToDelete] = useState<string | null>(null);

  if (!businessId) {
    return (
      <div className="container max-w-6xl py-8">
        <p className="text-center text-destructive">ID do negócio não encontrado</p>
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
      // Atualizar área existente
      updateArea({
        areaId: editingArea.id,
        data,
      });
      setEditingArea(null);
    } else {
      // Criar nova área
      createArea(data);
      setIsCreatingNew(false);
    }
  };

  const handleConfirmDeleteArea = () => {
    if (!areaToDelete) return;
    deleteArea(areaToDelete);
    setAreaToDelete(null);
  };

  // Se está gerenciando bairros, mostra apenas o manager
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

  // Se está criando/editando, mostra apenas o form
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
            Áreas de Entrega
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure áreas, bairros atendidos e taxas de entrega
          </p>
        </div>
        <Button onClick={() => setIsCreatingNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Área
        </Button>
      </div>

      {/* Resumo */}
      <DeliverySummaryWidget businessId={businessId} />

      {/* Lista de Áreas */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando áreas...</p>
        </div>
      ) : areas && areas.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Áreas Configuradas</h2>
          <div className="space-y-4">
            {areas.map((area) => (
              <DeliveryAreaCard
                key={area.id}
                area={area}
                onEdit={setEditingArea}
                onDelete={setAreaToDelete}
                onManageNeighborhoods={setManagingNeighborhoods}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma área configurada</h3>
          <p className="text-muted-foreground mb-4">
            Crie sua primeira área de entrega para começar a receber pedidos
          </p>
          <Button onClick={() => setIsCreatingNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Área
          </Button>
        </div>
      )}

      <ConfirmActionDialog
        open={!!areaToDelete}
        onOpenChange={(open) => {
          if (!open) setAreaToDelete(null);
        }}
        title="Deletar área de entrega"
        description="Esta ação remove a área e todos os bairros vinculados. Evite remover coberturas usadas por pedidos em andamento."
        confirmLabel="Deletar área"
        onConfirm={handleConfirmDeleteArea}
      />
    </div>
  );
}



