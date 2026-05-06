import { config } from 'dotenv';
import path from 'node:path';
import { aiOrchestratorService } from '@/core/ai/orchestrator/AIOrchestratorService';
import { spatialSearchService } from '@/core/geospatial/services/SpatialSearchService';

config({ path: path.resolve('.env.local') });

const original = spatialSearchService.searchHybrid.bind(spatialSearchService);
const calls: any[] = [];
spatialSearchService.searchHybrid = (async (input: any) => {
  calls.push(input);
  return original(input);
}) as any;

const locationId = '384add59-4e53-489d-a7b5-97dea2b3f442';
const coords = { latitude: -12.9916, longitude: -38.4554 };

const withCoords = await aiOrchestratorService.search({
  query: 'restaurante perto de mim',
  context: { locationId, coordinates: coords },
});
const withoutCoords = await aiOrchestratorService.search({
  query: 'restaurante aberto agora',
  context: { locationId, coordinates: null },
});

console.log(JSON.stringify({
  calls,
  withCoordsCount: withCoords.items.length,
  withoutCoordsCount: withoutCoords.items.length,
}, null, 2));
