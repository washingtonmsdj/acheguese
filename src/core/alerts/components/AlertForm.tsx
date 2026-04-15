import React from "react";
import { useState } from "react";
import type { CreateAlertData, AlertType } from "@/core/alerts/types";
interface AlertFormProps {
  onSubmit: (date: CreateAlertData) => void;
  defaultCity?: string;
  defaultNeighborhood?: string;
}

const alertTypes: { value: AlertType; label: string; icon: string }[] = [
  { value: "crime", label: "Crime", icon: "🚨" },
  { value: "accident", label: "Acidente", icon: "🚗" },
  { value: "fire", label: "Incêndio", icon: "🔥" },
  { value: "flood", label: "Alagamento", icon: "🌊" },
  { value: "power_outage", label: "Falta de Luz", icon: "⚡" },
  { value: "water_outage", label: "Falta de Água", icon: "💧" },
  { value: "road_closure", label: "Via Bloqueada", icon: "🚧" },
  { value: "other", label: "Outro", icon: "⚠️" },
];

export function AlertForm({
  onSubmit,
  defaultCity = "",
  defaultNeighborhood = "",
}: AlertFormProps) {
  const [formData, setFormData] = useState<CreateAlertData>({
    type: "other",
    title: "",
    description: "",
    city: defaultCity,
    neighborhood: defaultNeighborhood,
    street: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Tipo de Alerta</label>
        <select
          value={formData.type}
          onChange={(e) =>
            setFormData({ ...formData, type: e.target.value as AlertType })
          }
          className="w-full border rounded px-3 py-2"
          required
        >
          {alertTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Título</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full border rounded px-3 py-2"
          placeholder="Ex: Assalto na Rua Principal"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descrição</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full border rounded px-3 py-2"
          rows={3}
          placeholder="Descreva o que aconteceu..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cidade</label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Bairro (opcional)
        </label>
        <input
          type="text"
          value={formData.neighborhood || ""}
          onChange={(e) =>
            setFormData({ ...formData, neighborhood: e.target.value })
          }
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Rua (opcional)</label>
        <input
          type="text"
          value={formData.street || ""}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
      >
        Criar Alerta
      </button>
    </form>
  );
}
