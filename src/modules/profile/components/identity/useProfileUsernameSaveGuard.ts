import { useCallback, useState } from 'react';

/**
 * Hook auxiliar para integrar confirmacao de mudanca de username na pagina.
 */
export function useProfileUsernameSaveGuard({
  username,
  originalUsername,
  onSave,
}: {
  username: string;
  originalUsername: string;
  onSave: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasChange =
    !!originalUsername && !!username && originalUsername.trim() !== username.trim();

  const triggerSave = useCallback(() => {
    if (hasChange) {
      setConfirmOpen(true);
      return;
    }

    onSave();
  }, [hasChange, onSave]);

  return {
    triggerSave,
    hasChange,
    confirmProps: {
      open: confirmOpen,
      entityType: 'profile' as const,
      onConfirm: () => {
        setConfirmOpen(false);
        onSave();
      },
      onCancel: () => setConfirmOpen(false),
    },
  };
}
