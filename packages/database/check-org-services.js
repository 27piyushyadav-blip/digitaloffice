const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function checkOrgServices() {
  try {
    console.log('Querying organization profiles and their services...');
    
    // Get profiles
    const profiles = await sql`
      SELECT id, name, tagline, description
      FROM organization_profile
    `;
    
    for (const p of profiles) {
      console.log(`- Organization: ${p.name} (ID: ${p.id})`);
      console.log(`  Tagline: "${p.tagline}"`);
      console.log(`  Description: "${p.description}"`);
      
      // Get services
      const services = await sql`
        SELECT id, name, base_price, is_active
        FROM organization_services
        WHERE organization_id = ${p.id}
      `;
      
      console.log(`  Services count: ${services.length}`);
      services.forEach(s => {
        console.log(`    * Service: ${s.name} ($${s.base_price}) [Active: ${s.is_active}]`);
      });
      console.log('---');
    }
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await sql.end();
  }
}

checkOrgServices();
