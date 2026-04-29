import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const profileId = '7ed16389-6768-4eda-904d-ebaec0d2f400';
const ownerEmail = 'e2e-signup-1776439280994901@example.com';
const ownerPassword = 'TestPass123!';

const anonClient = createClient(url, anonKey);
const { data: { session } } = await anonClient.auth.signInWithPassword({ email: ownerEmail, password: ownerPassword });
console.log('Logged in:', session?.user?.email);

const authClient = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${session.access_token}` } },
});

// Test simple query first
const p1 = authClient.from('business_data').select('id, business_name').eq('profile_id', profileId).maybeSingle();
const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout 5s')), 5000));

try {
  const { data, error } = await Promise.race([p1, timeout]);
  console.log('Simple query result:', JSON.stringify(data), 'Error:', error?.message);
} catch (e) {
  console.log('Simple query TIMED OUT:', e.message);
}

// Test with profiles join
const p2 = authClient.from('business_data').select('*, profiles(id, name)').eq('profile_id', profileId).maybeSingle();
const timeout2 = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout 5s')), 5000));

try {
  const { data, error } = await Promise.race([p2, timeout2]);
  console.log('Join query result:', JSON.stringify(data?.business_name), 'Error:', error?.message);
} catch (e) {
  console.log('Join query TIMED OUT:', e.message);
}
