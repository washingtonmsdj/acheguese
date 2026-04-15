import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Car } from "lucide-react";
import { useSessionContext } from "@/core/session";
import { logger } from "@/shared/utils/logger";
import { DriverRegistrationForm } from "@/modules/mobility/components/driver/DriverRegistrationForm";
import { useDriverCreateMultiProfile } from "@/modules/mobility/hooks/useDriverCreateMultiProfile";

interface DriverRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: () => void;
}

export function DriverRegistrationModal({
  open,
  onOpenChange,
  onRegister,
}: DriverRegistrationModalProps) {
  const { profiles, switchProfile, refreshSession } = useSessionContext();

  const personalProfile = profiles.find((profile) => profile.profileType === "personal");

  const { createDriver, isLoading } = useDriverCreateMultiProfile({
    onSuccess: async (result) => {
      await refreshSession();
      await switchProfile(result.profile_id);
      onRegister();
      onOpenChange(false);
    },
    onError: (error) => {
      logger.error("Error creating driver profile", error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Car className="h-5 w-5 text-primary" />
            Cadastro de Motorista
          </DialogTitle>
          <DialogDescription>
            Complete os dados obrigatórios para criar seu perfil operacional de motorista.
          </DialogDescription>
        </DialogHeader>

        <DriverRegistrationForm
          defaultValues={{
            name: personalProfile?.displayName || personalProfile?.name,
            city: personalProfile?.city,
            avatarUrl: personalProfile?.avatarUrl,
            state: personalProfile?.state,
          }}
          loading={isLoading}
          submitLabel={isLoading ? "Criando perfil..." : "Enviar cadastro"}
          onSubmit={createDriver}
        />
      </DialogContent>
    </Dialog>
  );
}
