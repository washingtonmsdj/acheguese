import residentImage from "@/assets/persona-morador.jpg";
import providerImage from "@/assets/professional-concept/joao-santos.png";
import electricalImage from "@/assets/professional-concept/outlet.png";
import type { MapViewport } from "@/core/maps/types/core";
import type { TerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";

export interface BuscaConceptMockProfessional {
  id: string;
  name: string;
  target_url: string;
  logo_url: string;
  category: string;
  neighborhood: string;
  city: string;
  description: string;
  latitude: number;
  longitude: number;
  rating: number;
  total_reviews: number;
}

export const BUSCA_CONCEPT_MOCK: {
  professionals: BuscaConceptMockProfessional[];
} = {
  professionals: [
    {
      id: "concept-search-joao",
      name: "João · Serviços elétricos",
      target_url:
        "/servicos/ba/salvador/profissional/joao-santos?concept-mock=1",
      logo_url: providerImage,
      category: "Eletricista",
      neighborhood: "Santa Cruz",
      city: "Salvador",
      description: "Instalações, tomadas e pequenos reparos.",
      latitude: -12.9912,
      longitude: -38.4745,
      rating: 4.9,
      total_reviews: 18,
    },
    {
      id: "concept-search-carlos",
      name: "Carlos · Elétrica residencial",
      target_url: "/servicos/profissional/concept-search-carlos",
      logo_url: residentImage,
      category: "Eletricista",
      neighborhood: "Nordeste de Amaralina",
      city: "Salvador",
      description: "Manutenção e instalações residenciais.",
      latitude: -12.9918,
      longitude: -38.4674,
      rating: 4.8,
      total_reviews: 12,
    },
    {
      id: "concept-search-vizinhanca",
      name: "Elétrica da Vizinhança",
      target_url: "/servicos/profissional/concept-search-vizinhanca",
      logo_url: electricalImage,
      category: "Serviços elétricos",
      neighborhood: "Vale das Pedrinhas",
      city: "Salvador",
      description: "Reparos e troca de disjuntores.",
      latitude: -13.0008,
      longitude: -38.4706,
      rating: 4.7,
      total_reviews: 9,
    },
  ],
};

export const BUSCA_CONCEPT_MAP_VIEWPORT: MapViewport = {
  center: { latitude: -12.9918, longitude: -38.4702 },
  zoom: 13.4,
};

export const BUSCA_CONCEPT_MAP_POLYGONS: TerritoryPolygon[] = [
  {
    name: "Complexo do Nordeste de Amaralina",
    coordinates: [
      [-12.9817, -38.4767],
      [-12.9811, -38.4695],
      [-12.9853, -38.4635],
      [-12.9907, -38.4593],
      [-12.9985, -38.4611],
      [-13.0027, -38.4677],
      [-13.0015, -38.4767],
      [-12.9949, -38.4821],
      [-12.9871, -38.4809],
      [-12.9817, -38.4767],
    ],
    center: [-12.9918, -38.4702],
    color: "#2c9691",
    fillOpacity: 0.16,
    lineWidth: 2.5,
    lineOpacity: 0.95,
  },
];
