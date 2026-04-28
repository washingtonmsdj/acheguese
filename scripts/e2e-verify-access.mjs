import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const bizId = '7da30575-2311-470c-9ceb-2ec87b81c78e';
const userId = 'c1586ff4-ad84-486c-afb1-81578aa69941'; // e2e-user@test.local

// Check business
const { data: biz } = await admin.from('business_data').select('id, business_name, profile_id').eq('id', bizId).single();
console.log('Business:', JSON.stringify(biz));

// Check profile_members
const { data: members } = await admin.from('profile_members').select('*').eq('profile_id', biz?.profile_id).eq('user_id', userId);
console.log('Members:', JSON.stringify(members));

// Check if SUPABASE_SECRET_KEY has admin auth capabilities
const { data: { user }, error: userError } = await admin.auth.admin.getUserById(userId);
console.log('User:', user?.email, 'Error:', userError?.message);

// Try to update user password
const { error: pwError } = await admin.auth.admin.updateUserById(userId, { password: 'TestPass123!' });
console.log('Password update error:', pwError?.message || 'success');
