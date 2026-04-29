import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const bizDataId = '6e972202-03ec-414a-8c14-1bf84796e57f';

// Create education profile
const { data: ep, error } = await admin.from('education_profiles').insert({
  business_id: bizDataId,
  institution_type: 'school',
  niche_key: 'regular_school',
  status: 'published', // published so it appears in public pages
}).select('id').single();

if (error) {
  // Check if already exists
  const { data: existing } = await admin.from('education_profiles').select('id, status').eq('business_id', bizDataId).maybeSingle();
  if (existing) {
    console.log('Already exists:', existing.id, 'status:', existing.status);
    // Update to published
    await admin.from('education_profiles').update({ status: 'published' }).eq('id', existing.id);
    console.log('Updated to published');
  } else {
    console.log('Error:', error.message);
  }
} else {
  console.log('Created:', ep.id);
}
