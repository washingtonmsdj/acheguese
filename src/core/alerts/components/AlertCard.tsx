import React from "react";
import type { Alert } from "@/core/alerts/types";
import { ALERT_STATUS } from "@/shared/types/constants";
import { AlertTriangle } from "lucide-react";
import { ALERT_TYPE_CONFIG } from "@/core/alerts/constants/alertTypes";
import { cn } from "@/shared/utils/cn";
interface AlertCardProps {
  alert: Alert;
  onConfirm?: () => void;
  onResolve?: () => void;
}

const statusConfig = {
  active: { label: "Ativo", className: "bg-green-100 text-green-700" },
  resolved: { label: "Resolvido", className: "bg-gray-100 text-gray-700" },
  expired: { label: "Expirado", className: "bg-gray-100 text-gray-700" },
};

export function AlertCard({ alert, onConfirm, onResolve }: AlertCardProps) {
  const typeInfo = ALERT_TYPE_CONFIG[alert.type];
  const statusInfo = statusConfig[alert.status];
  const TypeIcon = typeInfo.icon;

  const expiresAt = new Date(alert.expires_at);
  const now = new Date();
  const daysUntilExpiration = Math.ceil(
    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isExpiringSoon = daysUntilExpiration <= 7 && daysUntilExpiration > 0;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <TypeIcon className={cn("h-6 w-6", typeInfo.iconClassName)} aria-hidden="true" />
          <div>
            <h3 className="font-semibold">{alert.title}</h3>
            <span
              className={cn("text-xs px-2 py-1 rounded", typeInfo.badgeClassName)}
            >
              {typeInfo.label}
            </span>
          </div>
        </div>
        <span
          className={cn("text-xs px-2 py-1 rounded", statusInfo.className)}
        >
          {statusInfo.label}
        </span>
      </div>

      <p className="text-gray-700 mb-3">{alert.description}</p>

      <div className="text-sm text-gray-500 mb-3">
        <div>
          {alert.city}
          {alert.neighborhood && `, ${alert.neighborhood}`}
          {alert.street && `, ${alert.street}`}
        </div>
        {alert.status === ALERT_STATUS.ACTIVE && (
          <div className={cn("flex items-center gap-1", isExpiringSoon && "text-orange-600 font-medium")}>
            {isExpiringSoon && <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>Expira em {daysUntilExpiration} dias</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {alert.confirmations_count} confirmações
        </span>
        <div className="flex gap-2">
          {alert.status === ALERT_STATUS.ACTIVE && onConfirm && (
            <button
              onClick={onConfirm}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Confirmar
            </button>
          )}
          {alert.status === ALERT_STATUS.ACTIVE && onResolve && (
            <button
              onClick={onResolve}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Resolver
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
