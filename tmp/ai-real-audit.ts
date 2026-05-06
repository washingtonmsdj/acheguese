import { config } from 'dotenv';
import path from 'node:path';
import { aiOrchestratorService } from '@/core/ai/orchestrator/AIOrchestratorService';

config({ path: path.resolve('.env.local') });

const locationId = '384add59-4e53-489d-a7b5-97dea2b3f442'; // Pituba
const withCoords = { latitude: -12.9916, longitude: -38.4554 };

const queries = [
  'pizzaria barata com delivery',
  'restaurante aberto agora',
  'eletricista perto de mim',
  'encanador urgente',
  'empresa no meu bairro',
  'me conte uma piada',
];

const run = async () => {
  const results = [];
  for (const query of queries) {
    const useCoords = query.includes('perto de mim');
    const out = await aiOrchestratorService.search({
      query,
      context: {
        locationId,
        coordinates: useCoords ? withCoords : null,
      },
    });
    results.push({
      query,
      intent: out.intent.type,
      location_id: locationId,
      handler: out.intent.type === 'business_search' ? 'SearchBusinessesActionHandler' : out.intent.type === 'service_search' ? 'SearchServicesActionHandler' : 'none',
      results_count: out.items.length,
      titles: out.items.map((x) => x.title),
      urls: out.items.map((x) => x.url).filter(Boolean),
      message: out.message,
      used_coords: useCoords,
      radiusKm: out.intent.filters.radiusKm ?? 8,
    });
  }

  console.log(JSON.stringify({ mode: 'with_backend', results }, null, 2));
};

run().catch((e) => {
  console.error('AUDIT_ERROR', e);
  process.exit(1);
});
