import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const userId = 'c1586ff4-ad84-486c-afb1-81578aa69941'; // e2e-user@test.local

// Find all profile_members for this user
const { data: members } = await admin.from('profile_members').select('profile_id, role').eq('user_id', userId);
console.log('Profile members:', JSON.stringify(members));

if (members && members.length > 0) {
  const profileIds = members.map(m => m.profile_id);
  
  // Find business profiles
  const { data: bizProfiles } = await admin.from('profiles').select('id, profile_type, name').in('id', profileIds).eq('profile_type', 'business');
  console.log('Business profiles:', JSON.stringify(bizProfiles));
  
  if (bizProfiles && bizProfiles.length > 0) {
    const bizProfileIds = bizProfiles.map(p => p.id);
    const { data: businesses } = await admin.from('business_data').select('id, business_name, profile_id, status').in('profile_id', bizProfileIds);
    console.log('Businesses:', JSON.stringify(businesses, null, 2));
    
    if (businesses && businesses.length > 0) {
      console.log('\n✅ Use this profile_id in tests:');
      businesses.forEach(b => {
        console.log(`  Business: ${b.business_name}`);
        console.log(`  profile_id (for URL): ${b.profile_id}`);
        console.log(`  business_data.id: ${b.id}`);
        console.log('');
      });
    }
  }
}
