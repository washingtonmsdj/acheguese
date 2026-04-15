/**
 * useUnifiedComposer - Hook para orquestração de criação de conteúdo
 * 
 * Gerencia estado e callbacks para o UnifiedComposer
 */

import { useState, useCallback } from "react";

type ComposerType = "post" | "alert" | "issue" | null;

interface UseUnifiedComposerProps {
  onPostCreated?: () => void;
  onAlertCreated?: () => void;
  onIssueCreated?: () => void;
}

export function useUnifiedComposer({
  onPostCreated,
  onAlertCreated,
  onIssueCreated,
}: UseUnifiedComposerProps = {}) {
  const [activeComposer, setActiveComposer] = useState<ComposerType>(null);

  const openComposer = useCallback((type: ComposerType) => {
    setActiveComposer(type);
  }, []);

  const closeComposer = useCallback(() => {
    setActiveComposer(null);
  }, []);

  const handlePostCreated = useCallback(() => {
    closeComposer();
    onPostCreated?.();
  }, [closeComposer, onPostCreated]);

  const handleAlertCreated = useCallback(() => {
    closeComposer();
    onAlertCreated?.();
  }, [closeComposer, onAlertCreated]);

  const handleIssueCreated = useCallback(() => {
    closeComposer();
    onIssueCreated?.();
  }, [closeComposer, onIssueCreated]);

  // Atalhos para abrir cada tipo
  const openPostComposer = useCallback(() => openComposer("post"), [openComposer]);
  const openAlertComposer = useCallback(() => openComposer("alert"), [openComposer]);
  const openIssueComposer = useCallback(() => openComposer("issue"), [openComposer]);

  return {
    activeComposer,
    openComposer,
    closeComposer,
    openPostComposer,
    openAlertComposer,
    openIssueComposer,
    handlePostCreated,
    handleAlertCreated,
    handleIssueCreated,
  };
}