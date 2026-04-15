// Dados de exemplo para demonstração do BusinessTabs

export const businessExemplo = {
  id: "exemplo-123",
  name: "Empresa Exemplo",
  category: "restaurant",
  description: "Uma empresa de exemplo para demonstração.",
  rating: 4.5,
  total_reviews: 12,
  is_premium: true,
  is_verified: true,
  status: "active",
};

export const productsExemplo = [
  {
    id: "p1",
    name: "Produto Exemplo 1",
    price: 29.9,
    category: "geral",
    active: true,
    featured: true,
    promotion: false,
    business_id: "exemplo-123",
    description: null,
    image_url: null,
  },
  {
    id: "p2",
    name: "Produto Exemplo 2",
    price: 49.9,
    category: "geral",
    active: true,
    featured: false,
    promotion: true,
    business_id: "exemplo-123",
    description: null,
    image_url: null,
  },
];

export const servicesExemplo = [
  {
    id: "s1",
    name: "Serviço Exemplo 1",
    price: 80.0,
    duration: "60",
    category: "geral",
    active: true,
    featured: true,
    business_id: "exemplo-123",
    description: null,
    image_url: null,
  },
  {
    id: "s2",
    name: "Serviço Exemplo 2",
    price: 120.0,
    duration: "90",
    category: "geral",
    active: true,
    featured: false,
    business_id: "exemplo-123",
    description: null,
    image_url: null,
  },
];

export const galeriaExemplo = [
  {
    id: "g1",
    image_url: "https://placehold.co/400x300",
    caption: "Foto 1",
    business_id: "exemplo-123",
  },
  {
    id: "g2",
    image_url: "https://placehold.co/400x300",
    caption: "Foto 2",
    business_id: "exemplo-123",
  },
];
