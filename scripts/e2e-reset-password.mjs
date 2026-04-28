import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const userId = 'c1586ff4-ad84-486c-afb1-81578aa69941'; // e2e-user@test.local
const newPassword = 'TestPass123!';

console.log('Setting password for e2e-user@test.local to:', newPassword);

const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
console.log('Result:', error?.message || 'success');

// Verify login works
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const anonClient = createClient(url, anonKey);
const { data: { session }, error: loginError } = await anonClient.auth.signInWithPassword({
  email: 'e2e-user@test.local',
  password: newPassword,
});
console.log('Login test:', session?.user?.email || 'failed', loginError?.message || '');
console.log('\nUpdate .env.local:');
console.log('E2E_USER_PASSWORD=TestPass123!');
