/**
 * Script de setup para testes E2E do módulo Education
 * Cria dados de teste necessários no banco
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const e2eEmail = process.env.E2E_USER_EMAIL;
  console.log('Setting up E2E education test data for:', e2eEmail);

  // 1. Find E2E user
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 100 });
  const user = users.find(u => u.email === e2eEmail);
  if (!user) {
    console.error('E2E user not found:', e2eEmail);
    process.exit(1);
  }
  console.log('User ID:', user.id);

  // 2. Check if test business already exists
  const { data: existingBiz } = await admin
    .from('business_data')
    .select('id, business_name')
    .eq('business_name', 'E2E Education Test Business')
    .maybeSingle();

  if (existingBiz) {
    console.log('Test business already exists:', existingBiz.id);
    console.log('\nE2E_EDUCATION_BUSINESS_ID=' + existingBiz.id);
    return;
  }

  // 3. Get a valid location
  const { data: bizWithLocation } = await admin
    .from('business_data')
    .select('location_id')
    .not('location_id', 'is', null)
    .limit(1)
    .single();

  const locationId = bizWithLocation?.location_id;
  if (!locationId) {
    console.error('No location found in database');
    process.exit(1);
  }
  console.log('Using location ID:', locationId);

  // 4. Create business profile
  const { data: bizProfile, error: e1 } = await admin
    .from('profiles')
    .insert({
      profile_type: 'business',
      name: 'E2E Education Test Business',
      user_id: user.id,
      location_id: locationId,
    })
    .select('id')
    .single();

  if (e1) {
    console.error('Error creating business profile:', e1.message);
    process.exit(1);
  }
  console.log('Business profile ID:', bizProfile.id);

  // 5. Create business_data
  const { data: biz, error: e2 } = await admin
    .from('business_data')
    .insert({
      profile_id: bizProfile.id,
      business_name: 'E2E Education Test Business',
      legal_name: 'E2E Education Test Business LTDA',
      category: 'education',
      description: 'Business criado para testes E2E do módulo Education',
      location_id: locationId,
    })
    .select('id')
    .single();

  if (e2) {
    console.error('Error creating business_data:', e2.message);
    process.exit(1);
  }
  console.log('Business ID:', biz.id);

  // 6. Add user as owner
  const { error: e3 } = await admin
    .from('profile_members')
    .insert({
      profile_id: bizProfile.id,
      user_id: user.id,
      role: 'owner',
    });

  if (e3) {
    console.error('Error adding member:', e3.message);
    process.exit(1);
  }

  // 7. Check what table education_profiles references
  // Try inserting with business_data id first
  const { data: ep, error: e4 } = await admin
    .from('education_profiles')
    .insert({
      business_id: biz.id,
      institution_type: 'school',
      niche_key: 'regular_school',
      status: 'draft',
    })
    .select('id')
    .single();

  if (e4) {
    console.warn('Could not create education_profile with business_data id:', e4.message);
    console.log('The education_profiles table may reference a different table.');
    console.log('Business ID for tests:', biz.id);
  } else {
    console.log('Education profile created:', ep.id);
  }

  console.log('\n✅ Setup complete!');
  console.log('Add to .env.local:');
  console.log('E2E_EDUCATION_BUSINESS_ID=' + biz.id);
}

main().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
