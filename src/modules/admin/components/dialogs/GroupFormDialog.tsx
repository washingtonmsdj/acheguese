/**
 * GroupFormDialog
 * 
 * Dialog para criação/edição de grupos territoriais.
 * Wrapper do TerritorialGroupForm com Dialog UI.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em UI do dialog
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { TerritorialGroupForm } from '../../components/TerritorialGroupForm';
import type { GroupFormDialogProps } from '../../sections/types';

export function GroupFormDialog({
  open,
  editingGroup,
  onClose,
}: GroupFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingGroup ? 'Editar Grupo Territorial' : 'Novo Grupo Territorial'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {editingGroup 
              ? 'Atualize as informações e bairros do grupo territorial'
              : 'Crie um novo grupo territorial para organizar bairros relacionados'
            }
          </p>
        </DialogHeader>
        <TerritorialGroupForm
          group={editingGroup as unknown as { id: string; name?: string | null; slug?: string | null; description?: string | null; parent_id?: string | null; status?: string | null; member_ids?: string[]; }}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

