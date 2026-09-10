import serviceImage from "@/assets/servicos-hero.jpg";
import residentImage from "@/assets/persona-emprego.jpg";
import providerImage from "@/assets/persona-prestador.jpg";

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
      target_url: "/servicos/profissional/concept-search-joao",
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
      logo_url: serviceImage,
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
