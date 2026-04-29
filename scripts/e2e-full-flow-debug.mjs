/**
 * Simula o fluxo completo do BusinessDashboardShellPage
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

const profileId = '7ed16389-6768-4eda-904d-ebaec0d2f400';
const ownerEmail = 'e2e-signup-1776439280994901@example.com';
const ownerPassword = 'TestPass123!';

const anonClient = createClient(url, anonKey);
const { data: { session } } = await anonClient.auth.signInWithPassword({ email: ownerEmail, password: ownerPassword });
const userId = session.user.id;
console.log('User ID:', userId);

const authClient = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${session.access_token}` } },
});

// 1. getBusinessById(profileId) - what useBusiness calls
console.log('\n1. getBusinessById(profileId):');
const { data: biz, error: e1 } = await authClient.from('business_data')
  .select('*, profiles(id, name, avatar_url, phone, whatsapp, bio), address:addresses!address_id(*), location:locations!location_id(*)')
  .eq('profile_id', profileId)
  .maybeSingle();
console.log('  result:', biz ? `${biz.business_name} (profile_id: ${biz.profile_id})` : 'NULL');
console.log('  error:', e1?.message || 'none');

if (!biz) { console.log('❌ FAIL: business is null'); process.exit(1); }

// 2. getBusinessDataIdByProfileId(biz.profile_id)
console.log('\n2. getBusinessDataIdByProfileId(biz.profile_id):');
const { data: bizDataArr, error: e2 } = await authClient.from('business_data')
  .select('id, business_role, updated_at')
  .eq('profile_id', biz.profile_id)
  .in('business_role', ['standalone', 'branch'])
  .order('updated_at', { ascending: false })
  .limit(1);
console.log('  result:', JSON.stringify(bizDataArr));
console.log('  error:', e2?.message || 'none');

const bizDataId = bizDataArr?.[0]?.id;
if (!bizDataId) { console.log('❌ FAIL: bizDataId is null'); process.exit(1); }

// 3. resolveOwnerProfileId(bizDataId)
console.log('\n3. resolveOwnerProfileId(bizDataId):');
const { data: ownerProfileData, error: e3 } = await authClient.from('business_data')
  .select('profile_id')
  .eq('id', bizDataId)
  .maybeSingle();
console.log('  result:', JSON.stringify(ownerProfileData));
console.log('  error:', e3?.message || 'none');

const ownerProfileId = ownerProfileData?.profile_id;
if (!ownerProfileId) { console.log('❌ FAIL: ownerProfileId is null'); process.exit(1); }

// 4. profile_members check
console.log('\n4. profile_members check:');
const { data: member, error: e4 } = await authClient.from('profile_members')
  .select('role')
  .eq('profile_id', ownerProfileId)
  .eq('user_id', userId)
  .maybeSingle();
console.log('  result:', JSON.stringify(member));
console.log('  error:', e4?.message || 'none');

if (!member) {
  console.log('❌ FAIL: member is null - RLS blocking profile_members read');
  
  // Check with admin
  const adminClient = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: adminMember } = await adminClient.from('profile_members').select('*').eq('profile_id', ownerProfileId).eq('user_id', userId);
  console.log('  admin check:', JSON.stringify(adminMember));
  
  // Check profiles table
  const { data: profileRow } = await adminClient.from('profiles').select('id, user_id').eq('id', ownerProfileId).single();
  console.log('  profile.user_id:', profileRow?.user_id, '| current user:', userId);
  console.log('  match:', profileRow?.user_id === userId);
  process.exit(1);
}

const hasAccess = ['owner', 'admin'].includes(member.role);
console.log('\n✅ hasAccess:', hasAccess, '(role:', member.role, ')');
if (hasAccess) {
  console.log('✅ BusinessDashboardShellPage SHOULD render correctly');
  console.log('   The redirect must be happening for another reason...');
}
