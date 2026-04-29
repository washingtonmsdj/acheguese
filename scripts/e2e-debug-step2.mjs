/**
 * Debug step 2: getBusinessDataIdByProfileId
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const anonClient = createClient(url, anonKey);
const { data: { session } } = await anonClient.auth.signInWithPassword({
  email: 'e2e-signup-1776439280994901@example.com',
  password: 'TestPass123!',
});

const authClient = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${session.access_token}` } }
});

const profileId = '7ed16389-6768-4eda-904d-ebaec0d2f400';

// Exact query from getBusinessDataIdByProfileId
const { data, error } = await authClient
  .from('business_data')
  .select('id, business_role, updated_at')
  .eq('profile_id', profileId)
  .in('business_role', ['standalone', 'branch'])
  .order('updated_at', { ascending: false })
  .limit(1);

console.log('getBusinessDataIdByProfileId result:', JSON.stringify(data));
console.log('Error:', error?.message);

// Also check without the business_role filter
const { data: data2 } = await authClient
  .from('business_data')
  .select('id, business_role, status, updated_at')
  .eq('profile_id', profileId);

console.log('\nAll business_data for profile:', JSON.stringify(data2));
