/**
 * Cria um business via RPC (mesmo fluxo que a UI usa)
 * para garantir que todos os dados e permissões estão corretos
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

const adminClient = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// Use existing E2E user
const ownerEmail = 'e2e-user@test.local';
const ownerPassword = 'TestPass123!';

// Login as E2E user
const anonClient = createClient(url, anonKey);
const { data: { session }, error: loginError } = await anonClient.auth.signInWithPassword({
  email: ownerEmail,
  password: ownerPassword,
});

if (loginError) {
  console.error('Login failed:', loginError.message);
  process.exit(1);
}

console.log('Logged in as:', session.user.email);

// Create authenticated client
const authClient = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${session.access_token}` } }
});

// Check if business already exists
const { data: existing } = await authClient
  .from('business_data')
  .select('id, profile_id')
  .eq('business_name', 'E2E Education Business RPC')
  .maybeSingle();

if (existing) {
  console.log('Business already exists!');
  console.log('profile_id:', existing.profile_id);
  console.log('business_data.id:', existing.id);
  console.log('\nE2E_EDUCATION_BUSINESS_PROFILE_ID=' + existing.profile_id);
  console.log('E2E_EDUCATION_BUSINESS_DATA_ID=' + existing.id);
  process.exit(0);
}

// Get a location
const { data: bizWithLoc } = await adminClient.from('business_data').select('location_id').not('location_id', 'is', null).limit(1).single();
const locationId = bizWithLoc?.location_id;
console.log('Using location:', locationId);

// Generate unique handle
const handle = `e2eedu${Date.now().toString().slice(-8)}`;

// Call create_profile_with_extension RPC (same as UI)
const { data: rpcResult, error: rpcError } = await authClient.rpc('create_profile_with_extension', {
  p_profile_type: 'business',
  p_handle: handle,
  p_display_name: 'E2E Education Business RPC',
  p_avatar_url: null,
  p_bio: 'Business para testes E2E do módulo Education',
  p_extension_data: {
    legal_name: 'E2E Education Business RPC LTDA',
    cnpj: null,
    company_type: null,
    industry: 'education',
    status: 'active',
    address_id: null,
    location_id: locationId,
  },
});

if (rpcError) {
  console.error('RPC error:', rpcError.message);
  process.exit(1);
}

console.log('RPC result:', JSON.stringify(rpcResult));

const profileId = rpcResult?.data?.profile_id || rpcResult?.profile_id;
if (!profileId) {
  console.error('No profile_id returned');
  process.exit(1);
}

// Update business_data with full info
const { error: updateError } = await authClient
  .from('business_data')
  .update({
    business_name: 'E2E Education Business RPC',
    category: 'education',
    description: 'Business para testes E2E do módulo Education',
    location_id: locationId,
    status: 'active',
  })
  .eq('profile_id', profileId);

if (updateError) {
  console.warn('Update warning:', updateError.message);
}

// Get business_data.id
const { data: biz } = await authClient
  .from('business_data')
  .select('id, business_name, profile_id, status')
  .eq('profile_id', profileId)
  .single();

console.log('\nBusiness created:', JSON.stringify(biz));

// Verify access
const { data: members } = await authClient
  .from('profile_members')
  .select('role')
  .eq('profile_id', profileId)
  .eq('user_id', session.user.id)
  .maybeSingle();

console.log('Profile members:', JSON.stringify(members));

console.log('\n✅ SUCCESS!');
console.log('profile_id (for URL):', profileId);
console.log('business_data.id:', biz?.id);
console.log('owner email:', ownerEmail);
console.log('owner password:', ownerPassword);
console.log('\nUpdate .env.local:');
console.log(`E2E_EDUCATION_BUSINESS_PROFILE_ID=${profileId}`);
console.log(`E2E_EDUCATION_BUSINESS_DATA_ID=${biz?.id}`);
console.log(`E2E_EDUCATION_OWNER_EMAIL=${ownerEmail}`);
console.log(`E2E_EDUCATION_OWNER_PASSWORD=${ownerPassword}`);
