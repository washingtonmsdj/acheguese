import React from "react";
import { useState } from "react";
import { Search, SlidersHorizontal, Clock } from "lucide-react";
import { Service } from "@/modules/business/types";
interface BusinessServicesProps {
  services: Service[];
  isLoading: boolean;
}

export function BusinessServices({
  services,
  isLoading,
}: BusinessServicesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [showFilters, setShowFilters] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Serviços</h2>
        <p className="text-gray-600">Loading serviços...</p>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return null;
  }

  const filteredServices = services
    .filter(
      (service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return (a.price || 0) - (b.price || 0);
    });

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Serviços</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <SlidersHorizontal size={20} />
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 space-y-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar serviços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "price")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Nome</option>
              <option value="price">Preço</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {service.image_url && (
              <img
                src={service.image_url}
                alt={service.name}
                className="w-full h-48 object-cover rounded-lg mb-3"
              />
            )}

            <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>

            {service.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {service.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              {service.price && (
                <p className="text-lg font-bold text-blue-600">
                  R$ {service.price.toFixed(2)}
                </p>
              )}

              {service.duration && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>{service.duration} min</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <p className="text-center text-gray-600 py-8">
          Nenhum serviço encontrado
        </p>
      )}
    </div>
  );
}
