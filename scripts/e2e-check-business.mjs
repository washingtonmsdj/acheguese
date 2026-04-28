import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const bizId = '7da30575-2311-470c-9ceb-2ec87b81c78e';

// Check full business_data record
const { data: biz, error } = await admin.from('business_data').select('*').eq('id', bizId).single();
console.log('Business full record:', JSON.stringify(biz, null, 2));
console.log('Error:', error?.message);

// Check what getBusinessById would return (same query as the hook)
const { data: bizFull, error: e2 } = await admin.from('business_data').select(`
  *,
  profiles!business_data_profile_id_fkey (
    id,
    name,
    handle,
    location_id
  )
`).eq('id', bizId).single();
console.log('\nBusiness with profile:', JSON.stringify(bizFull, null, 2));
console.log('Error:', e2?.message);
