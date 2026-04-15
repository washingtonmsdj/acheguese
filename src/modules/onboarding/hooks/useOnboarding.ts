import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { locationContextStore } from "@/core/location/stores/LocationContextStore";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";

const NEIGHBORHOODS = [
  "Nordeste de Amaralina",
  "Santa Cruz",
  "Vale das Pedrinhas",
  "Chapada do Rio Vermelho",
];

const POPULATION_TOTAL = 45000;

export function useOnboarding() {
  const navigate = useNavigate();
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNeighborhoodSelect = (neighborhood: string) => {
    setSelectedNeighborhood(neighborhood);
  };

  const handleConfirm = async () => {
    if (!selectedNeighborhood) return;

    setIsLoading(true);
    try {
      // Resolve o bairro selecionado via repositório canônico
      const repository = createLocationRepository();
      const slug = selectedNeighborhood
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");

      // Tenta encontrar por slug dentro de Salvador
      const location = await repository.findByPath(`/br/ba/salvador/${slug}`);
      if (location) {
        locationContextStore.setActiveLocation(location);
      }
    } catch {
      // Localização não encontrada — não bloqueia navegação
    } finally {
      setIsLoading(false);
    }

    navigate("/");
  };

  return {
    neighborhoods: NEIGHBORHOODS,
    populationTotal: POPULATION_TOTAL,
    selectedNeighborhood,
    onNeighborhoodSelect: handleNeighborhoodSelect,
    onConfirm: handleConfirm,
    canConfirm: Boolean(selectedNeighborhood),
    isLoading,
  };
}
