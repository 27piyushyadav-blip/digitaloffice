const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function checkOrgProfiles() {
  try {
    console.log('Querying organization_profile table...');
    const profiles = await sql`
      SELECT id, name, tagline, description, location, is_visible, verification_status
      FROM organization_profile
    `;
    console.log('Organizations:');
    profiles.forEach(p => {
      console.log(`- ID: ${p.id}`);
      console.log(`  Name: ${p.name}`);
      console.log(`  Tagline: "${p.tagline}"`);
      console.log(`  Description: "${p.description}"`);
      console.log(`  Location: "${p.location}"`);
      console.log(`  Is Visible: ${p.is_visible}`);
      console.log(`  Verification Status: ${p.verification_status}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await sql.end();
  }
}

checkOrgProfiles();
