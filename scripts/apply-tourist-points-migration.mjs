const PROJECT_REF = 'xhdowzacfujckjelqhtd';
const ACCESS_TOKEN = 'sbp_db5b6a29484375c7ceec51616d0c3ef56083a170';
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;

// Atualiza o registro existente com os campos novos
const res = await fetch(`${SUPABASE_URL}/rest/v1/tourist_points?slug=eq.praia-porto-da-barra`, {
  method: 'PATCH',
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  },
  body: JSON.stringify({
    price_type: 'gratuito',
    price_text: 'Acesso gratuito. Cadeiras e guarda-sóis alugados pelos quiosques (R$ 20–R$ 40/dia).',
    accessibility_level: 'parcial',
    accessibility_description: 'Calçadão acessível ao longo da orla. Acesso à areia pode ser difícil para cadeirantes. Alguns quiosques possuem rampas.',
    observations: 'Fins de semana e feriados ficam muito cheios — chegue cedo para garantir lugar. Cuidado com pertences na areia. Água calma e ideal para crianças. Melhor horário para o pôr do sol: 17h30–18h30.',
    nearby_point_ids: ['mock-farol-da-barra'],
  }),
});

const text = await res.text();
console.log('PATCH status:', res.status);
console.log('Body:', text);
