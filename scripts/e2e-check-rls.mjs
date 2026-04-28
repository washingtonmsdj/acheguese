import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

const adminClient = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const anonClient = createClient(url, anonKey);

const userId = 'c1586ff4-ad84-486c-afb1-81578aa69941'; // e2e-user@test.local
const bizId = '7da30575-2311-470c-9ceb-2ec87b81c78e';
const profileId = 'f27781a7-c65b-4914-bb03-e5ef0251f949';

// Login as E2E user
const { data: { session }, error: loginError } = await anonClient.auth.signInWithPassword({
  email: 'e2e-user@test.local',
  password: 'TestPass123!',
});

if (loginError) {
  console.log('Login error:', loginError.message);
  process.exit(1);
}

console.log('Logged in as:', session?.user?.email);

// Create authenticated client
const authClient = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${session?.access_token}` } }
});

// Check profile_members with authenticated client
const { data: members, error: membersError } = await authClient
  .from('profile_members')
  .select('role')
  .eq('profile_id', profileId)
  .eq('user_id', userId);

console.log('Profile members (authenticated):', JSON.stringify(members), 'Error:', membersError?.message);

// Check business_data with authenticated client
const { data: biz, error: bizError } = await authClient
  .from('business_data')
  .select('id, business_name, profile_id')
  .eq('id', bizId)
  .single();

console.log('Business (authenticated):', JSON.stringify(biz), 'Error:', bizError?.message);

// Check if getBusinessDataIdByProfileId works
const { data: bizByProfile, error: e3 } = await authClient
  .from('business_data')
  .select('id, business_role, updated_at')
  .eq('profile_id', profileId)
  .maybeSingle();

console.log('Business by profile (authenticated):', JSON.stringify(bizByProfile), 'Error:', e3?.message);
