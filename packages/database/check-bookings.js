const postgres = require('postgres');

async function check() {
  const connectionString = 'postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';
  try {
    const sql = postgres(connectionString);
    
    // Get all organization profiles
    const profiles = await sql`
      SELECT id, user_id, name
      FROM organization_profile
    `;
    console.log('=== ORGANIZATION PROFILES ===');
    console.log(profiles);
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
