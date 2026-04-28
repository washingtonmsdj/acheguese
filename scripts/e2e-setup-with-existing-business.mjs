import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// Use the E2E signup business that was created via UI
const bizProfileId = '7ed16389-6768-4eda-904d-ebaec0d2f400'; // profile_id
const bizDataId = '6e972202-03ec-414a-8c14-1bf84796e57f'; // business_data.id
const ownerUserId = '63a68598-59e6-4ff4-be48-098763f3e586';
const ownerEmail = 'e2e-signup-1776439280994901@example.com';
const testPassword = 'TestPass123!';

// Reset password
const { error: pwError } = await admin.auth.admin.updateUserById(ownerUserId, { password: testPassword });
console.log('Password reset:', pwError?.message || 'success');

// Verify login
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const anonClient = createClient(url, anonKey);
const { data: { session }, error: loginError } = await anonClient.auth.signInWithPassword({
  email: ownerEmail,
  password: testPassword,
});
console.log('Login test:', session?.user?.email || 'failed', loginError?.message || '');

// Create education profile for this business
const { data: ep, error: epError } = await admin.from('education_profiles').insert({
  business_id: bizDataId,
  institution_type: 'school',
  niche_key: 'regular_school',
  status: 'draft',
}).select('id').single();

if (epError) {
  // Check if already exists
  const { data: existing } = await admin.from('education_profiles').select('id').eq('business_id', bizDataId).maybeSingle();
  if (existing) {
    console.log('Education profile already exists:', existing.id);
  } else {
    console.log('Error creating education profile:', epError.message);
  }
} else {
  console.log('Education profile created:', ep.id);
}

console.log('\n✅ Setup complete!');
console.log('Update tests to use:');
console.log(`  businessId (profile_id for URL): ${bizProfileId}`);
console.log(`  business_data.id: ${bizDataId}`);
console.log(`  owner email: ${ownerEmail}`);
console.log(`  password: ${testPassword}`);
console.log('\nUpdate .env.local:');
console.log(`E2E_EDUCATION_BUSINESS_PROFILE_ID=${bizProfileId}`);
console.log(`E2E_EDUCATION_BUSINESS_DATA_ID=${bizDataId}`);
console.log(`E2E_EDUCATION_OWNER_EMAIL=${ownerEmail}`);
console.log(`E2E_EDUCATION_OWNER_PASSWORD=${testPassword}`);
