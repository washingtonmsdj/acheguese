import { Shield } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";

export interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  geolocation: boolean;
}

interface ConsentPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: ConsentPreferences;
  onPreferencesChange: (preferences: ConsentPreferences) => void;
  onSave: () => void;
  isSaving: boolean;
  saveError?: string | null;
}

export default function ConsentPreferencesDialog({
  open,
  onOpenChange,
  preferences,
  onPreferencesChange,
  onSave,
  isSaving,
  saveError,
}: ConsentPreferencesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Preferências de privacidade
          </DialogTitle>
          <DialogDescription>
            Personalize como seus dados são utilizados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="font-medium">Cookies necessários</Label>
            </div>
            <Switch checked disabled />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="font-medium">Analytics e métricas</Label>
            </div>
            <Switch
              checked={preferences.analytics}
              onCheckedChange={(analytics) =>
                onPreferencesChange({ ...preferences, analytics })
              }
            />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="font-medium">Marketing</Label>
            </div>
            <Switch
              checked={preferences.marketing}
              onCheckedChange={(marketing) =>
                onPreferencesChange({ ...preferences, marketing })
              }
            />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="font-medium">Geolocalização</Label>
            </div>
            <Switch
              checked={preferences.geolocation}
              onCheckedChange={(geolocation) =>
                onPreferencesChange({ ...preferences, geolocation })
              }
            />
          </div>
        </div>
        {saveError ? (
          <p role="alert" className="text-sm text-destructive">
            {saveError}
          </p>
        ) : null}
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Salvar preferências
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
