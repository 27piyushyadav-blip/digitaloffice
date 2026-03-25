const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function checkLatestProfileUpdate() {
  try {
    console.log('Checking latest profile updates...');
    
    // Get the most recently updated profile
    const latestProfile = await sql`
      SELECT user_id, gender, location, has_pending_updates, verification_status, 
             updated_at, created_at, bio, specialization
      FROM expert_profile 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    
    if (latestProfile.length > 0) {
      const profile = latestProfile[0];
      console.log('Latest profile update:');
      console.log(`  User ID: ${profile.user_id}`);
      console.log(`  Gender: ${profile.gender}`);
      console.log(`  Location: ${profile.location}`);
      console.log(`  Bio: ${profile.bio}`);
      console.log(`  Specialization: ${profile.specialization}`);
      console.log(`  Has Pending Updates: ${profile.has_pending_updates}`);
      console.log(`  Verification Status: ${profile.verification_status}`);
      console.log(`  Created: ${profile.created_at}`);
      console.log(`  Updated: ${profile.updated_at}`);
      
      // Check if there are any recent changes in the last hour
      const recentChanges = await sql`
        SELECT * FROM profile_changes 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        ORDER BY created_at DESC
      `;
      
      console.log(`\nChanges in the last hour: ${recentChanges.length}`);
      recentChanges.forEach(change => {
        console.log(`  ${change.field}: ${change.old_value} → ${change.new_value} (${change.status})`);
      });
    } else {
      console.log('No profiles found');
    }
    
  } catch (error) {
    console.error('Error checking latest profile update:', error);
  } finally {
    await sql.end();
  }
}

checkLatestProfileUpdate();
