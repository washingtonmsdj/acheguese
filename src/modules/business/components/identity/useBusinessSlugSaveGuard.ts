import { useCallback, useState } from "react";

export function useBusinessSlugSaveGuard({
  slug,
  originalSlug,
  onSave,
}: {
  slug: string;
  originalSlug: string;
  onSave: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasChange =
    !!originalSlug && !!slug && originalSlug.trim() !== slug.trim();

  const triggerSave = useCallback(() => {
    if (hasChange) {
      setConfirmOpen(true);
      return;
    }

    onSave();
  }, [hasChange, onSave]);

  const confirmProps = {
    open: confirmOpen,
    entityType: "business" as const,
    onConfirm: () => {
      setConfirmOpen(false);
      onSave();
    },
    onCancel: () => setConfirmOpen(false),
  };

  return { triggerSave, confirmProps, hasChange };
}
