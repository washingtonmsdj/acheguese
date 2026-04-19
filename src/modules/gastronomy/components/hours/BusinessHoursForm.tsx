/**
 * BusinessHoursForm — Formulário de horários da semana
 *
 * Permite configurar horário de abertura/fechamento para cada dia.
 * SSOT: Usa useBusinessHours hook
 */

import { useState } from 'react';
import { useBusinessHours } from '../../hooks';
import { DAY_NAMES } from '@/core/business';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Clock, Save } from 'lucide-react';

interface DayHours {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
}

interface BusinessHoursFormProps {
  businessId: string;
}

export function BusinessHoursForm({ businessId }: BusinessHoursFormProps) {
  const { hours, isLoading, setBulkHours, isSettingHours } = useBusinessHours(businessId);

  // Estado local para edição
  const [editedHours, setEditedHours] = useState<DayHours[]>(() => {
    // Inicializa com horários existentes ou padrão
    return Array.from({ length: 7 }, (_, i) => {
      const existing = hours?.find((h) => h.day_of_week === i);
      return {
        day_of_week: i,
        opens_at: existing?.opens_at || '08:00',
        closes_at: existing?.closes_at || '18:00',
        is_closed: existing?.is_closed || false,
      };
    });
  });

  // Atualiza estado quando dados carregam
  if (hours && editedHours.every((h) => !hours.find((existing) => existing.day_of_week === h.day_of_week))) {
    setEditedHours(
      Array.from({ length: 7 }, (_, i) => {
        const existing = hours.find((h) => h.day_of_week === i);
        return {
          day_of_week: i,
          opens_at: existing?.opens_at || '08:00',
          closes_at: existing?.closes_at || '18:00',
          is_closed: existing?.is_closed || false,
        };
      })
    );
  }

  const handleDayChange = (dayIndex: number, field: keyof DayHours, value: string | boolean) => {
    setEditedHours((prev) =>
      prev.map((day) =>
        day.day_of_week === dayIndex ? { ...day, [field]: value } : day
      )
    );
  };

  const handleSave = () => {
    setBulkHours(editedHours);
  };

  const handleCopyToAll = (dayIndex: number) => {
    const source = editedHours[dayIndex];
    setEditedHours((prev) =>
      prev.map((day) => ({
        ...day,
        opens_at: source.opens_at,
        closes_at: source.closes_at,
        is_closed: source.is_closed,
      }))
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando horários...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Horários da Semana
        </CardTitle>
        <CardDescription>
          Configure os horários de funcionamento para cada dia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {editedHours.map((day) => (
          <div key={day.day_of_week} className="space-y-3 pb-4 border-b last:border-0">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                {DAY_NAMES[day.day_of_week]}
              </Label>
              <div className="flex items-center gap-2">
                <Label htmlFor={`closed-${day.day_of_week}`} className="text-sm text-muted-foreground">
                  Fechado
                </Label>
                <Switch
                  id={`closed-${day.day_of_week}`}
                  checked={day.is_closed}
                  onCheckedChange={(checked) =>
                    handleDayChange(day.day_of_week, 'is_closed', checked)
                  }
                />
              </div>
            </div>

            {!day.is_closed && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`opens-${day.day_of_week}`} className="text-sm">
                    Abre às
                  </Label>
                  <Input
                    id={`opens-${day.day_of_week}`}
                    type="time"
                    value={day.opens_at}
                    onChange={(e) =>
                      handleDayChange(day.day_of_week, 'opens_at', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`closes-${day.day_of_week}`} className="text-sm">
                    Fecha às
                  </Label>
                  <Input
                    id={`closes-${day.day_of_week}`}
                    type="time"
                    value={day.closes_at}
                    onChange={(e) =>
                      handleDayChange(day.day_of_week, 'closes_at', e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyToAll(day.day_of_week)}
              className="text-xs"
            >
              Copiar para todos os dias
            </Button>
          </div>
        ))}

        <Button
          onClick={handleSave}
          disabled={isSettingHours}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSettingHours ? 'Salvando...' : 'Salvar Horários'}
        </Button>
      </CardContent>
    </Card>
  );
}
