/**
 * Cria business de teste para E2E do módulo Education
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const E2E_USER_ID = 'c1586ff4-ad84-486c-afb1-81578aa69941'; // e2e-user@test.local
const E2E_USER_EMAIL = 'e2e-user@test.local';

// Get location from existing business
const { data: bizWithLoc } = await admin.from('business_data').select('location_id').not('location_id', 'is', null).limit(1).single();
const locationId = bizWithLoc?.location_id;
console.log('Location ID:', locationId);

// Check if test business already exists
const { data: existing } = await admin.from('business_data').select('id').eq('business_name', 'E2E Education Test Business').maybeSingle();
if (existing) {
  console.log('Business already exists:', existing.id);
  
  // Try to create education profile
  const { data: ep, error: epErr } = await admin.from('education_profiles').insert({
    business_id: existing.id,
    institution_type: 'school',
    niche_key: 'regular_school',
    status: 'draft',
  }).select('id').single();
  
  if (epErr) {
    console.log('FK error with business_data id:', epErr.message);
    // The FK references 'businesses' table, not 'business_data'
    // Need to find the businesses table id
  } else {
    console.log('Education profile created:', ep.id);
  }
  
  console.log('\nE2E_EDUCATION_BUSINESS_ID=' + existing.id);
  process.exit(0);
}

// Create business profile for E2E user
const { data: bizProfile, error: e1 } = await admin.from('profiles').insert({
  profile_type: 'business',
  name: 'E2E Education Test Business',
  user_id: E2E_USER_ID,
  location_id: locationId,
}).select('id').single();

if (e1) { console.error('Error creating profile:', e1.message); process.exit(1); }
console.log('Profile ID:', bizProfile.id);

// Create business_data
const { data: biz, error: e2 } = await admin.from('business_data').insert({
  profile_id: bizProfile.id,
  business_name: 'E2E Education Test Business',
  legal_name: 'E2E Education Test Business LTDA',
  category: 'education',
  description: 'Business para testes E2E do módulo Education',
  location_id: locationId,
}).select('id').single();

if (e2) { console.error('Error creating business_data:', e2.message); process.exit(1); }
console.log('Business ID:', biz.id);

// Add as owner
const { error: e3 } = await admin.from('profile_members').insert({
  profile_id: bizProfile.id,
  user_id: E2E_USER_ID,
  role: 'owner',
});
if (e3) { console.error('Error adding member:', e3.message); process.exit(1); }

// Try education_profiles with business_data id
const { data: ep, error: e4 } = await admin.from('education_profiles').insert({
  business_id: biz.id,
  institution_type: 'school',
  niche_key: 'regular_school',
  status: 'draft',
}).select('id').single();

if (e4) {
  console.log('FK error:', e4.message);
  console.log('education_profiles.business_id references "businesses" table, not "business_data"');
  console.log('Need to check if there is a "businesses" table with this business');
} else {
  console.log('Education profile created:', ep.id);
}

console.log('\n✅ Done!');
console.log('E2E_EDUCATION_BUSINESS_ID=' + biz.id);
