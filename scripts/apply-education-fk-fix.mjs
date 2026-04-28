/**
 * Aplica a correção da FK de education_profiles
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

console.log('Applying education_profiles FK fix...');

// Step 1: Drop old FK
const { error: e1 } = await admin.rpc('exec_sql', {
  sql: 'ALTER TABLE education_profiles DROP CONSTRAINT IF EXISTS education_profiles_business_id_fkey'
});
if (e1) console.log('Drop FK result:', e1.message);
else console.log('✅ Old FK dropped');

// Step 2: Add new FK pointing to business_data
const { error: e2 } = await admin.rpc('exec_sql', {
  sql: `ALTER TABLE education_profiles 
        ADD CONSTRAINT education_profiles_business_id_fkey 
        FOREIGN KEY (business_id) REFERENCES business_data(id) ON DELETE CASCADE`
});
if (e2) console.log('Add FK result:', e2.message);
else console.log('✅ New FK added pointing to business_data');

// Step 3: Test insert
const bizId = '7da30575-2311-470c-9ceb-2ec87b81c78e';
const { data: ep, error: e3 } = await admin.from('education_profiles').insert({
  business_id: bizId,
  institution_type: 'school',
  niche_key: 'regular_school',
  status: 'draft',
}).select('id').single();

if (e3) {
  console.log('❌ Insert still failing:', e3.message);
} else {
  console.log('✅ Education profile created:', ep.id);
  // Clean up test insert
  await admin.from('education_profiles').delete().eq('id', ep.id);
  console.log('✅ Test profile cleaned up');
}
