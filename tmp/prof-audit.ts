import { config } from 'dotenv';
import path from 'node:path';
import { ProfessionalService } from '@/core/professional';

config({ path: path.resolve('.env.local') });

const run = async () => {
  try {
    const a = await ProfessionalService.getProfessionals({
      search: 'eletricista',
      territoryFilter: { scope: 'location', location_id: '54261f4a-03ba-47f8-8733-c031163e7535' },
    } as any);
    console.log('getProfessionals ok', a.length);
  } catch (e) {
    console.log('getProfessionals err', e instanceof Error ? e.message : String(e));
  }

  try {
    const b = await ProfessionalService.searchProfessionals('eletricista', {
      category: undefined,
      city: undefined,
    } as any);
    console.log('searchProfessionals ok', b.length, b.slice(0,3).map(x=>({name:x.name,cat:x.category,location_id:(x as any).location_id,slug:x.slug})));
  } catch (e) {
    console.log('searchProfessionals err', e instanceof Error ? e.message : String(e));
  }
};

run();
