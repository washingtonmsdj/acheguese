import React from "react";
/**
 * Accessibility Utilities
 * Helper functions and constants for improving accessibility
 */

/**
 * Screen reader only text utility
 * Use this class to hide text visually but keep it accessible to screen readers
 */
export const srOnly =
  "sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0";

/**
 * Common ARIA labels for buttons and links
 */
export const ariaLabels = {
  // Navigation
  home: "Ir para página inicial",
  back: "Voltar",
  close: "Fechar",
  menu: "Abrir menu",
  search: "Buscar",

  // Actions
  edit: "Editar",
  delete: "Excluir",
  save: "Salvar",
  cancel: "Cancelar",
  submit: "Enviar",

  // Social
  like: "Curtir",
  unlike: "Descurtir",
  comment: "Comentar",
  share: "Compartilhar",
  follow: "Seguir",
  unfollow: "Deixar de seguir",

  // Media
  playVideo: "Reproduzir vídeo",
  pauseVideo: "Pausar vídeo",
  viewImage: "Ver image",
  downloadFile: "Baixar arquivo",

  // Forms
  showPassword: "Mostrar senha",
  hidePassword: "Ocultar senha",
  clearInput: "Limpar campo",

  // Notifications
  closeNotification: "Fechar notificação",
  viewNotifications: "Ver notificações",

  // Profile
  viewProfile: "Ver profile",
  editProfile: "Editar profile",
  uploadAvatar: "Enviar photo de profile",

  // Company
  viewCompany: "Ver business",
  contactCompany: "Entrar em contato",
  viewLocation: "Ver localização",
  callPhone: "Ligar",
  sendEmail: "Enviar email",
  openWebsite: "Abrir website",

  // Filters
  applyFilters: "Aplicar filtros",
  clearFilters: "Limpar filtros",
  sortBy: "Ordenar por",
};

/**
 * Get accessible label for action + entity
 * Example: getActionLabel('edit', 'post') => "Editar publicação"
 */
export function getActionLabel(
  action: keyof typeof ariaLabels,
  entity?: string,
): string {
  const baseLabel = Object.entries(ariaLabels).find(([key]) => key === action)?.[1] ?? action;
  return entity ? `${baseLabel} ${entity}` : baseLabel;
}

/**
 * Announce to screen readers dynamically
 * Useful for live regions and dynamic content updates
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite",
) {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = srOnly;
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element (useful for modals)
   */
  trapFocus(element: HTMLElement) {
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener("keydown", handleTabKey);

    // Return cleanup function
    return () => {
      element.removeEventListener("keydown", handleTabKey);
    };
  },

  /**
   * Focus first error in form
   */
  focusFirstError(formElement: HTMLElement) {
    const firstError = formElement.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    if (firstError) {
      firstError.focus();
    }
  },

  /**
   * Save and restore focus (useful when opening/closing modals)
   */
  saveFocus() {
    const activeElement = document.activeElement as HTMLElement;
    return () => {
      if (activeElement && activeElement.focus) {
        activeElement.focus();
      }
    };
  },
};

/**
 * Keyboard navigation helpers
 */
export const keyboard = {
  isEnterOrSpace(event: React.KeyboardEvent) {
    return event.key === "Enter" || event.key === " ";
  },

  isEscape(event: React.KeyboardEvent) {
    return event.key === "Escape";
  },

  isArrowKey(event: React.KeyboardEvent) {
    return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      event.key,
    );
  },
};
