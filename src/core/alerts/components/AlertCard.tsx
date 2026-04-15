import React from "react";
import type { Alert } from "@/core/alerts/types";
import { ALERT_STATUS } from "@/shared/types/constants";
interface AlertCardProps {
  alert: Alert;
  onConfirm?: () => void;
  onResolve?: () => void;
}

const alertTypeConfig = {
  crime: { icon: "🚨", color: "red", label: "Crime" },
  accident: { icon: "🚗", color: "orange", label: "Acidente" },
  fire: { icon: "🔥", color: "red", label: "Incêndio" },
  flood: { icon: "🌊", color: "blue", label: "Alagamento" },
  power_outage: { icon: "⚡", color: "yellow", label: "Falta de Luz" },
  water_outage: { icon: "💧", color: "blue", label: "Falta de Água" },
  road_closure: { icon: "🚧", color: "orange", label: "Via Bloqueada" },
  other: { icon: "⚠️", color: "gray", label: "Outro" },
};

const statusConfig = {
  active: { label: "Ativo", color: "green" },
  resolved: { label: "Resolvido", color: "gray" },
  expired: { label: "Expirado", color: "gray" },
};

export function AlertCard({ alert, onConfirm, onResolve }: AlertCardProps) {
  const typeInfo = alertTypeConfig[alert.type];
  const statusInfo = statusConfig[alert.status];

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
          <span className="text-2xl">{typeInfo.icon}</span>
          <div>
            <h3 className="font-semibold">{alert.title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}
            >
              {typeInfo.label}
            </span>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}
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
          <div className={isExpiringSoon ? "text-orange-600 font-medium" : ""}>
            {isExpiringSoon && "⚠️ "}
            Expira em {daysUntilExpiration} dias
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
