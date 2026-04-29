import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const profileId = '7ed16389-6768-4eda-904d-ebaec0d2f400'; // profile_id
const bizDataId = '6e972202-03ec-414a-8c14-1bf84796e57f'; // business_data.id

// Check education profile
const { data: ep } = await admin.from('education_profiles').select('*').eq('business_id', bizDataId).maybeSingle();
console.log('Education profile:', JSON.stringify(ep));

// Check if education module is visible in the dashboard
// The EducationDashboardPage uses useEducationProfile hook
// which queries education_profiles by business_id

// Check what the EducationLeadsPage uses
const { data: leads } = await admin.from('education_leads').select('id, full_name').eq('education_profile_id', ep?.id || 'none').limit(5);
console.log('Leads:', JSON.stringify(leads));

// Check programs
const { data: programs } = await admin.from('education_programs').select('id, name').eq('education_profile_id', ep?.id || 'none').limit(5);
console.log('Programs:', JSON.stringify(programs));
