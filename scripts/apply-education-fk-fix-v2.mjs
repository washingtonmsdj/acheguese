/**
 * Aplica a correção da FK de education_profiles para profiles(id)
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

console.log('Applying education_profiles FK fix v2 (profiles.id)...');

// Step 1: Drop current FK (pointing to business_data)
const { error: e1 } = await admin.rpc('exec_sql', {
  sql: 'ALTER TABLE education_profiles DROP CONSTRAINT IF EXISTS education_profiles_business_id_fkey'
});
if (e1) console.log('Drop FK:', e1.message);
else console.log('✅ FK dropped');

// Step 2: Add new FK pointing to profiles(id)
const { error: e2 } = await admin.rpc('exec_sql', {
  sql: `ALTER TABLE education_profiles 
        ADD CONSTRAINT education_profiles_business_id_fkey 
        FOREIGN KEY (business_id) REFERENCES profiles(id) ON DELETE CASCADE`
});
if (e2) console.log('Add FK error:', e2.message);
else console.log('✅ New FK added pointing to profiles(id)');

// Step 3: Update RLS policy
const { error: e3 } = await admin.rpc('exec_sql', {
  sql: `DROP POLICY IF EXISTS education_profiles_owner_all ON education_profiles`
});
if (e3) console.log('Drop policy error:', e3.message);

const { error: e4 } = await admin.rpc('exec_sql', {
  sql: `CREATE POLICY education_profiles_owner_all
        ON education_profiles FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM profile_members pm
            WHERE pm.profile_id = education_profiles.business_id
              AND pm.user_id = auth.uid()
              AND pm.role IN ('owner', 'admin', 'manager')
          )
        )`
});
if (e4) console.log('Create policy error:', e4.message);
else console.log('✅ RLS policy updated');

// Step 4: Test insert with profile_id
const profileId = '7ed16389-6768-4eda-904d-ebaec0d2f400';
const { data: ep, error: e5 } = await admin.from('education_profiles').insert({
  business_id: profileId,
  institution_type: 'school',
  niche_key: 'regular_school',
  status: 'published',
}).select('id').single();

if (e5) {
  console.log('❌ Insert still failing:', e5.message);
} else {
  console.log('✅ Education profile created with profile_id:', ep.id);
  // Keep this profile for tests
  console.log('✅ Profile kept for E2E tests');
}
