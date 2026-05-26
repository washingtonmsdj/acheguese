/**
 * ExceptionsManager — Gestão de exceções/feriados
 *
 * Permite criar, editar e deletar exceções de horário.
 * SSOT: Usa useBusinessExceptions hook
 */

import { useState } from 'react';
import { useBusinessExceptions } from '../../hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { ConfirmActionDialog } from '@/shared/components/ConfirmActionDialog';
import { Calendar, Plus, Trash2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from '@/shared/utils/dateLocale';

interface ExceptionsManagerProps {
  businessId: string;
}

export function ExceptionsManager({ businessId }: ExceptionsManagerProps) {
  const { exceptions, isLoading, setException, deleteException, isSettingException } = useBusinessExceptions(businessId);

  const [isAdding, setIsAdding] = useState(false);
  const [exceptionToDelete, setExceptionToDelete] = useState<string | null>(null);
  const [newException, setNewException] = useState({
    date: '',
    opens_at: '08:00',
    closes_at: '18:00',
    is_closed: false,
    reason: '',
  });

  const handleAdd = () => {
    if (!newException.date) return;

    setException({
      business_id: businessId,
      date: newException.date,
      opens_at: newException.is_closed ? undefined : newException.opens_at,
      closes_at: newException.is_closed ? undefined : newException.closes_at,
      is_closed: newException.is_closed,
      reason: newException.reason || undefined,
    });

    // Reset form
    setNewException({
      date: '',
      opens_at: '08:00',
      closes_at: '18:00',
      is_closed: false,
      reason: '',
    });
    setIsAdding(false);
  };

  const handleConfirmDelete = () => {
    if (!exceptionToDelete) return;
    deleteException(exceptionToDelete);
    setExceptionToDelete(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando exceções...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Exceções e Feriados
        </CardTitle>
        <CardDescription>
          Configure horários especiais ou dias fechados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lista de exceções */}
        {exceptions && exceptions.length > 0 && (
          <div className="space-y-3">
            {exceptions.map((exception) => (
              <div
                key={exception.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {format(parseISO(exception.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  {exception.is_closed ? (
                    <p className="text-sm text-muted-foreground">Fechado</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {exception.opens_at} - {exception.closes_at}
                    </p>
                  )}
                  {exception.reason && (
                    <p className="text-sm text-muted-foreground italic">
                      {exception.reason}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExceptionToDelete(exception.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Formulário de nova exceção */}
        {isAdding ? (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Nova Exceção</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAdding(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exception-date">Data</Label>
              <Input
                id="exception-date"
                type="date"
                value={newException.date}
                onChange={(e) =>
                  setNewException((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="exception-closed"
                checked={newException.is_closed}
                onCheckedChange={(checked) =>
                  setNewException((prev) => ({ ...prev, is_closed: checked }))
                }
              />
              <Label htmlFor="exception-closed">Fechado neste dia</Label>
            </div>

            {!newException.is_closed && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exception-opens">Abre às</Label>
                  <Input
                    id="exception-opens"
                    type="time"
                    value={newException.opens_at}
                    onChange={(e) =>
                      setNewException((prev) => ({ ...prev, opens_at: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exception-closes">Fecha às</Label>
                  <Input
                    id="exception-closes"
                    type="time"
                    value={newException.closes_at}
                    onChange={(e) =>
                      setNewException((prev) => ({ ...prev, closes_at: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="exception-reason">Motivo (opcional)</Label>
              <Textarea
                id="exception-reason"
                placeholder="Ex: Natal, Ano Novo, Evento especial..."
                value={newException.reason}
                onChange={(e) =>
                  setNewException((prev) => ({ ...prev, reason: e.target.value }))
                }
                rows={2}
              />
            </div>

            <Button
              onClick={handleAdd}
              disabled={!newException.date || isSettingException}
              className="w-full"
            >
              {isSettingException ? 'Salvando...' : 'Adicionar Exceção'}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Exceção
          </Button>
        )}

        <ConfirmActionDialog
          open={!!exceptionToDelete}
          onOpenChange={(open) => {
            if (!open) setExceptionToDelete(null);
          }}
          title="Deletar excecao"
          description="Esta exceção de horário será removida e o dia voltará a seguir a configuração padrão."
          confirmLabel="Deletar excecao"
          onConfirm={handleConfirmDelete}
        />
      </CardContent>
    </Card>
  );
}
