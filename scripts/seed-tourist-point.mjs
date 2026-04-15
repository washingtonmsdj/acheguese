const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

// Apenas colunas que existem na tabela (schema completo após migration 20260331000002)
const point = {
  name: 'Praia do Porto da Barra',
  slug: 'praia-porto-da-barra',
  description: `A Praia do Porto da Barra é considerada uma das praias mais bonitas de Salvador e do Brasil. Localizada no bairro da Barra, é famosa por suas águas calmas e cristalinas da Baía de Todos os Santos, tornando-a ideal para banho, snorkeling e esportes aquáticos.\n\nA praia tem formato de meia-lua, com areia branca e fina, cercada por quiosques, bares e restaurantes que servem desde petiscos até frutos do mar frescos. Aos fins de semana e feriados, é um dos pontos mais movimentados da cidade, reunindo moradores e turistas.\n\nO pôr do sol na Praia do Porto da Barra é um espetáculo à parte: o sol se põe diretamente sobre o mar, criando reflexos dourados nas águas tranquilas da baía. É tradição entre os soteropolitanos aplaudir o pôr do sol daqui, assim como fazem em Ibiza.\n\nNas proximidades ficam o Forte de Santo Antônio da Barra (Farol da Barra), o Museu Náutico da Bahia e diversas pousadas e hotéis boutique.`,
  short_description: 'A praia mais bonita de Salvador: águas calmas da Baía de Todos os Santos, pôr do sol inesquecível e infraestrutura completa.',
  category: 'praia',
  tags: ['praia', 'pôr do sol', 'esportes aquáticos', 'snorkeling', 'família', 'gastronomia', 'vida noturna', 'barra'],
  state: 'ba',
  city: 'salvador',
  neighborhood: 'Barra',
  address: 'Av. Sete de Setembro, s/n — Barra, Salvador, BA',
  latitude: -13.0089,
  longitude: -38.5321,
  photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  gallery_urls: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=85',
    'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=1200&q=85',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85',
  ],
  icon_emoji: '🏖️',
  visiting_hours: 'Aberta 24h | Quiosques: 8h–22h',
  entry_fee: 'Gratuito',
  price_type: 'gratuito',
  price_text: 'Acesso gratuito. Cadeiras e guarda-sóis alugados pelos quiosques (R$ 20–R$ 40/dia).',
  website: 'https://www.visitsalvador.com.br',
  phone: '(71) 3202-3900',
  accessibility: true,
  accessibility_level: 'parcial',
  accessibility_description: 'Calçadão acessível ao longo da orla. Acesso à areia pode ser difícil para cadeirantes. Alguns quiosques possuem rampas.',
  has_parking: true,
  has_restaurant: true,
  has_guide: false,
  is_featured: true,
  display_order: 1,
  rating: 4.9,
  total_reviews: 8750,
  status: 'active',
  observations: 'Fins de semana e feriados ficam muito cheios — chegue cedo para garantir lugar. Cuidado com pertences na areia. Água calma e ideal para crianças. Melhor horário para o pôr do sol: 17h30–18h30.',
  nearby_point_ids: ['mock-farol-da-barra'],
  created_by: null,
};

const res = await fetch(`${SUPABASE_URL}/rest/v1/tourist_points`, {
  method: 'POST',
  headers: {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  },
  body: JSON.stringify(point),
});

const text = await res.text();
console.log('Status:', res.status);
console.log('Body:', text);
