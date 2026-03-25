const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function checkProfileData() {
  try {
    console.log('Checking expert_profile table data...');
    
    // Get a sample of expert profile data to see the structure
    const profiles = await sql`
      SELECT user_id, gender, location, has_pending_updates, verification_status, updated_at
      FROM expert_profile 
      WHERE gender IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 5
    `;
    
    console.log('Recent profile updates:');
    profiles.forEach(profile => {
      console.log(`  User: ${profile.user_id}`);
      console.log(`  Gender: ${profile.gender}`);
      console.log(`  Location: ${profile.location}`);
      console.log(`  Pending Updates: ${profile.has_pending_updates}`);
      console.log(`  Verification Status: ${profile.verification_status}`);
      console.log(`  Updated: ${profile.updated_at}`);
      console.log('---');
    });
    
    // Check if there's a profile_changes table for audit trail
    try {
      const changesTable = await sql`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_name = 'profile_changes'
      `;
      
      if (changesTable[0].count > 0) {
        console.log('\nProfile changes table exists!');
        
        const recentChanges = await sql`
          SELECT * FROM profile_changes 
          ORDER BY created_at DESC 
          LIMIT 3
        `;
        
        console.log('Recent profile changes:');
        recentChanges.forEach(change => {
          console.log(`  Change ID: ${change.id}`);
          console.log(`  User ID: ${change.user_id}`);
          console.log(`  Field: ${change.field_name}`);
          console.log(`  Old Value: ${change.old_value}`);
          console.log(`  New Value: ${change.new_value}`);
          console.log(`  Status: ${change.status}`);
          console.log('---');
        });
      }
    } catch (error) {
      console.log('No profile_changes table found');
    }
    
  } catch (error) {
    console.error('Error checking profile data:', error);
  } finally {
    await sql.end();
  }
}

checkProfileData();
