import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const anonClient = createClient(url, anonKey);
const { data: { session } } = await anonClient.auth.signInWithPassword({
  email: 'e2e-user@test.local',
  password: 'TestPass123!',
});

const authClient = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${session.access_token}` } }
});

const profileId = 'ec806e1f-63f1-40d8-bbdc-cecd8576cb46';

// Step 1: useBusiness
const { data: biz } = await authClient.from('business_data').select('*, profiles(id, name)').eq('profile_id', profileId).maybeSingle();
console.log('Step 1 - business:', biz?.business_name, '| profile_id:', biz?.profile_id);

// Step 2: getBusinessDataIdByProfileId
const { data: bizData } = await authClient.from('business_data').select('id, business_role, updated_at').eq('profile_id', profileId).in('business_role', ['standalone', 'branch']).order('updated_at', { ascending: false }).limit(1);
console.log('Step 2 - bizDataId:', bizData?.[0]?.id, '| role:', bizData?.[0]?.business_role);

// Step 3: isOwner
const { data: ownerProfile } = await authClient.from('business_data').select('profile_id').eq('id', bizData?.[0]?.id).maybeSingle();
console.log('Step 3a - ownerProfileId:', ownerProfile?.profile_id);

const { data: members } = await authClient.from('profile_members').select('role').eq('profile_id', ownerProfile?.profile_id).eq('user_id', session.user.id).maybeSingle();
console.log('Step 3b - members:', JSON.stringify(members));

console.log('\nFinal hasAccess:', members && ['owner', 'admin'].includes(members.role));
