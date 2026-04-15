import { useEffect, useState, useCallback } from "react";
import { Award, X } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { BadgeDisplay } from "./BadgeDisplay";
import { cn } from "@/shared/utils/cn";

interface BadgeNotificationProps {
  badge: {
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    category: string | null;
  };
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

/**
 * Notificação de badge conquistado
 *
 * Aparece como um toast animado quando o usuário ganha um badge
 */
export function BadgeNotification({
  badge,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}: BadgeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    // Animar entrada
    setTimeout(() => setIsVisible(true), 100);

    // Auto-fechar
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, handleClose]);

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 transition-all duration-300",
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0",
      )}
    >
      <Card className="w-80 p-4 shadow-2xl border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <BadgeDisplay badge={badge} size="lg" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <h3 className="font-bold text-sm text-yellow-900 dark:text-yellow-100">
                  Conquista Desbloqueada!
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 -mt-1 -mr-1"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              {badge.name}
            </p>

            {badge.description && (
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                {badge.description}
              </p>
            )}
          </div>
        </div>

        {/* Barra de progresso de auto-close */}
        {autoClose && (
          <div className="mt-3 h-1 bg-yellow-200 dark:bg-yellow-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 dark:bg-yellow-400 transition-all"
              style={{
                animation: `shrink ${autoCloseDelay}ms linear`,
              }}
            />
          </div>
        )}
      </Card>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Container para gerenciar múltiplas notificações de badges
 */
interface BadgeNotificationContainerProps {
  badges: Array<{
    id: string;
    badge: BadgeNotificationProps["badge"];
  }>;
  onRemove: (id: string) => void;
}

export function BadgeNotificationContainer({
  badges,
  onRemove,
}: BadgeNotificationContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {badges.map((item, index) => (
        <div
          key={item.id}
          style={{
            transform: `translateY(${index * 10}px)`,
          }}
        >
          <BadgeNotification
            badge={item.badge}
            onClose={() => onRemove(item.id)}
          />
        </div>
      ))}
    </div>
  );
}
