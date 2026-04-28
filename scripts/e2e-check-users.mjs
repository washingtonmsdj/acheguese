import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 20 });
console.log('Users found:', users.length);
users.forEach(u => console.log(' -', u.email, '| id:', u.id));

// Check businesses
const { data: bizs } = await admin.from('business_data').select('id, business_name, profile_id').limit(5);
console.log('\nBusinesses:', JSON.stringify(bizs?.map(b => ({ id: b.id, name: b.business_name })), null, 2));
