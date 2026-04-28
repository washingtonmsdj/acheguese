import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// Check who owns the E2E businesses
const bizIds = [
  '6e972202-03ec-414a-8c14-1bf84796e57f', // Empresa E2E 1776439291169480 LTDA
  'ac9bd8da-56ea-467a-a163-33b5d2b2f56a', // Empresa E2E 1776438081453796 LTDA
];

for (const bizId of bizIds) {
  const { data: biz } = await admin.from('business_data').select('id, business_name, profile_id').eq('id', bizId).single();
  const { data: members } = await admin.from('profile_members').select('user_id, role').eq('profile_id', biz?.profile_id);
  const { data: profile } = await admin.from('profiles').select('user_id, name').eq('id', biz?.profile_id).single();
  
  console.log(`\nBusiness: ${biz?.business_name}`);
  console.log(`  profile_id: ${biz?.profile_id}`);
  console.log(`  profile.user_id: ${profile?.user_id}`);
  console.log(`  members:`, JSON.stringify(members));
  
  // Get user email
  if (profile?.user_id) {
    const { data: { user } } = await admin.auth.admin.getUserById(profile.user_id);
    console.log(`  owner email: ${user?.email}`);
  }
}
