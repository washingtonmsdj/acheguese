/**
 * Debug: verifica por que o BusinessDashboardShellPage redireciona
 * Simula exatamente o que o useDashboardAccess faz
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Business criado via UI
const profileId = '7ed16389-6768-4eda-904d-ebaec0d2f400'; // profile_id (usado na URL)
const bizDataId = '6e972202-03ec-414a-8c14-1bf84796e57f'; // business_data.id
const ownerEmail = 'e2e-signup-1776439280994901@example.com';
const ownerPassword = 'TestPass123!';

console.log('=== Simulating useDashboardAccess flow ===\n');

// Step 1: Login
const anonClient = createClient(url, anonKey);
const { data: { session }, error: loginError } = await anonClient.auth.signInWithPassword({
  email: ownerEmail,
  password: ownerPassword,
});

if (loginError || !session) {
  console.error('Login failed:', loginError?.message);
  process.exit(1);
}

console.log('✅ Logged in as:', session.user.email);
const userId = session.user.id;

// Step 2: Create authenticated client (simulating frontend)
const authClient = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${session.access_token}` } },
});

// Step 3: useBusiness(profileId) → getBusinessById(profileId)
// getBusinessById uses .eq("profile_id", id)
console.log('\n--- Step 3: getBusinessById(profileId) ---');
const { data: bizByProfile, error: e3 } = await authClient
  .from('business_data')
  .select('*, profiles(id, name, avatar_url, phone, whatsapp, bio)')
  .eq('profile_id', profileId)
  .maybeSingle();

console.log('Business found:', bizByProfile ? `${bizByProfile.business_name} (id: ${bizByProfile.id})` : 'NULL');
console.log('Error:', e3?.message || 'none');

if (!bizByProfile) {
  console.error('❌ useBusiness returns null → BusinessDashboardShellPage shows null → redirect');
  process.exit(1);
}

// Step 4: useDashboardAccess(business.profile_id)
// → getBusinessDataIdByProfileId(profileId)
console.log('\n--- Step 4: getBusinessDataIdByProfileId(profileId) ---');
const { data: bizDataByProfile, error: e4 } = await authClient
  .from('business_data')
  .select('id, business_role, updated_at')
  .eq('profile_id', profileId)
  .in('business_role', ['standalone', 'branch'])
  .order('updated_at', { ascending: false })
  .limit(1);

console.log('Business data found:', bizDataByProfile ? JSON.stringify(bizDataByProfile) : 'NULL');
console.log('Error:', e4?.message || 'none');

const resolvedBizDataId = bizDataByProfile?.[0]?.id;
if (!resolvedBizDataId) {
  console.error('❌ getBusinessDataIdByProfileId returns null → hasAccess = false → redirect');
  process.exit(1);
}

// Step 5: BusinessOwnershipService.isOwner(bizDataId, userId)
// → resolveOwnerProfileId(bizDataId) → profile_members check
console.log('\n--- Step 5: resolveOwnerProfileId(bizDataId) ---');
const { data: ownerProfile, error: e5 } = await authClient
  .from('business_data')
  .select('profile_id')
  .eq('id', resolvedBizDataId)
  .maybeSingle();

console.log('Owner profile_id:', ownerProfile?.profile_id || 'NULL');
console.log('Error:', e5?.message || 'none');

if (!ownerProfile?.profile_id) {
  console.error('❌ resolveOwnerProfileId returns null → hasAccess = false → redirect');
  process.exit(1);
}

// Step 6: Check profile_members
console.log('\n--- Step 6: profile_members check ---');
const { data: memberData, error: e6 } = await authClient
  .from('profile_members')
  .select('role')
  .eq('profile_id', ownerProfile.profile_id)
  .eq('user_id', userId)
  .maybeSingle();

console.log('Member role:', memberData?.role || 'NULL');
console.log('Error:', e6?.message || 'none');

if (!memberData) {
  console.error('❌ profile_members returns null → hasAccess = false → redirect');
  console.log('\nChecking with admin client...');
  
  const { data: adminMember } = await adminClient
    .from('profile_members')
    .select('role')
    .eq('profile_id', ownerProfile.profile_id)
    .eq('user_id', userId)
    .maybeSingle();
  
  console.log('Admin check - member:', JSON.stringify(adminMember));
  
  // Check RLS
  const { data: allMembers } = await adminClient
    .from('profile_members')
    .select('*')
    .eq('profile_id', ownerProfile.profile_id);
  console.log('All members (admin):', JSON.stringify(allMembers));
  
  process.exit(1);
}

const hasAccess = ['owner', 'admin'].includes(memberData.role);
console.log('\n✅ hasAccess:', hasAccess);
console.log('✅ BusinessDashboardShellPage should render correctly!');
