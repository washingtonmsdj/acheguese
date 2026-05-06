import { aiOrchestratorService } from '../src/core/ai/orchestrator/AIOrchestratorService';

const queries = [
  'pizzaria barata com delivery',
  'restaurante aberto agora',
  'eletricista perto de mim',
  'encanador urgente',
  'empresa no meu bairro',
  'me conte uma piada',
];

const handlerMap: Record<string, string> = {
  business_search: 'SearchBusinessesActionHandler',
  service_search: 'SearchServicesActionHandler',
  unknown: 'none',
};

const context = {
  locationId: '384add59-4e53-489d-a7b5-97dea2b3f442',
  latitude: -12.9977,
  longitude: -38.4502,
};

const out = [];
for (const query of queries) {
  const result = await aiOrchestratorService.search({
    query,
    context,
  });

  out.push({
    query,
    intent: result.intent.type,
    handler: handlerMap[result.intent.type] ?? 'unknown',
    count: result.items.length,
    titles: result.items.map((i) => i.title),
    urls: result.items.map((i) => i.url).filter(Boolean),
  });
}

console.log(JSON.stringify(out, null, 2));
