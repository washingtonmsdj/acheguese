import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// Check e2e-admin user
const adminUserId = '72cf7ba1-e4c0-45d0-8d76-b1cd46eadfc8'; // e2e-admin@test.local

const { data: members } = await admin.from('profile_members').select('profile_id, role').eq('user_id', adminUserId);
console.log('Admin profile members:', JSON.stringify(members));

if (members && members.length > 0) {
  const profileIds = members.map(m => m.profile_id);
  const { data: businesses } = await admin.from('business_data').select('id, business_name, profile_id, status').in('profile_id', profileIds);
  console.log('Admin businesses:', JSON.stringify(businesses, null, 2));
}

// Also check all businesses created recently
const { data: recentBiz } = await admin.from('business_data').select('id, business_name, profile_id, status, created_at').order('created_at', { ascending: false }).limit(10);
console.log('\nRecent businesses:', JSON.stringify(recentBiz?.map(b => ({ id: b.id, name: b.business_name, profile_id: b.profile_id, status: b.status })), null, 2));
