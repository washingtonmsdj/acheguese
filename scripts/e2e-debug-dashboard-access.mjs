/**
 * Debug: simula exatamente o que o BusinessDashboardShellPage faz
 * para verificar por que o acesso está sendo negado
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

const adminClient = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// Test with the business created via UI (e2e-signup user)
const testCases = [
  {
    label: 'E2E signup business (created via UI)',
    profileId: '7ed16389-6768-4eda-904d-ebaec0d2f400',
    bizDataId: '6e972202-03ec-414a-8c14-1bf84796e57f',
    ownerEmail: 'e2e-signup-1776439280994901@example.com',
    password: 'TestPass123!',
  },
  {
    label: 'E2E Education Test Business (created via script)',
    profileId: 'f27781a7-c65b-4914-bb03-e5ef0251f949',
    bizDataId: '7da30575-2311-470c-9ceb-2ec87b81c78e',
    ownerEmail: 'e2e-user@test.local',
    password: 'TestPass123!',
  },
];

for (const tc of testCases) {
  console.log(`\n=== ${tc.label} ===`);
  
  // Login as owner
  const anonClient = createClient(url, anonKey);
  const { data: { session }, error: loginError } = await anonClient.auth.signInWithPassword({
    email: tc.ownerEmail,
    password: tc.password,
  });
  
  if (loginError) {
    console.log('Login failed:', loginError.message);
    continue;
  }
  console.log('Logged in as:', session.user.email);
  
  // Create authenticated client (simulating browser)
  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } }
  });
  
  // Step 1: useBusiness(profileId) -> getBusinessById(profileId)
  // getBusinessById uses .eq("profile_id", id)
  const { data: biz, error: bizError } = await authClient
    .from('business_data')
    .select('*, profiles(id, name, avatar_url, phone, whatsapp, bio)')
    .eq('profile_id', tc.profileId)
    .maybeSingle();
  
  console.log('Step 1 - useBusiness result:', biz ? `Found: ${biz.business_name}` : 'NOT FOUND', bizError?.message || '');
  
  if (!biz) {
    console.log('  -> BusinessDashboardShellPage will show null (no business found)');
    continue;
  }
  
  // Step 2: getBusinessDataIdByProfileId(biz.profile_id)
  const { data: bizDataId, error: bizDataError } = await authClient
    .from('business_data')
    .select('id, business_role, updated_at')
    .eq('profile_id', biz.profile_id)
    .in('business_role', ['standalone', 'branch'])
    .order('updated_at', { ascending: false })
    .limit(1);
  
  console.log('Step 2 - getBusinessDataIdByProfileId:', bizDataId?.[0]?.id || 'NOT FOUND', bizDataError?.message || '');
  
  if (!bizDataId?.[0]) {
    console.log('  -> useDashboardAccess will return hasAccess: false (no bizDataId)');
    continue;
  }
  
  // Step 3: BusinessOwnershipService.isOwner(bizDataId, userId)
  // resolveOwnerProfileId(bizDataId)
  const { data: ownerProfile, error: ownerError } = await authClient
    .from('business_data')
    .select('profile_id')
    .eq('id', bizDataId[0].id)
    .maybeSingle();
  
  console.log('Step 3a - resolveOwnerProfileId:', ownerProfile?.profile_id || 'NOT FOUND', ownerError?.message || '');
  
  if (!ownerProfile) {
    console.log('  -> isOwner will return false (no owner profile)');
    continue;
  }
  
  // Check profile_members
  const { data: members, error: membersError } = await authClient
    .from('profile_members')
    .select('role')
    .eq('profile_id', ownerProfile.profile_id)
    .eq('user_id', session.user.id)
    .maybeSingle();
  
  console.log('Step 3b - profile_members check:', members ? `role: ${members.role}` : 'NOT FOUND', membersError?.message || '');
  
  const hasAccess = members && ['owner', 'admin'].includes(members.role);
  console.log('Final result - hasAccess:', hasAccess);
  
  if (!hasAccess) {
    console.log('  -> BusinessDashboardShellPage will redirect to /perfil/empresas');
  } else {
    console.log('  -> BusinessDashboardShellPage will render the dashboard!');
  }
}
