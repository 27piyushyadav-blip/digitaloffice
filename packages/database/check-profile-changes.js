const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function checkProfileChangesTable() {
  try {
    console.log('Checking profile_changes table structure...');
    
    // Get table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'profile_changes'
      ORDER BY ordinal_position
    `;
    
    console.log('Profile Changes table columns:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Get recent changes
    const recentChanges = await sql`
      SELECT * FROM profile_changes 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    console.log('\nRecent profile changes:');
    if (recentChanges.length === 0) {
      console.log('  No changes found in profile_changes table');
    } else {
      recentChanges.forEach(change => {
        console.log(`  ID: ${change.id}`);
        console.log(`  User ID: ${change.user_id}`);
        console.log(`  Field: ${change.field_name}`);
        console.log(`  Old Value: ${change.old_value}`);
        console.log(`  New Value: ${change.new_value}`);
        console.log(`  Status: ${change.status}`);
        console.log(`  Created: ${change.created_at}`);
        console.log('---');
      });
    }
    
    // Check what's in expert_profile for pending updates
    const pendingProfiles = await sql`
      SELECT user_id, gender, location, has_pending_updates, verification_status, updated_at
      FROM expert_profile 
      WHERE has_pending_updates = true
      ORDER BY updated_at DESC
      LIMIT 3
    `;
    
    console.log('\nProfiles with pending updates:');
    if (pendingProfiles.length === 0) {
      console.log('  No profiles with pending updates found');
    } else {
      pendingProfiles.forEach(profile => {
        console.log(`  User: ${profile.user_id}`);
        console.log(`  Gender: ${profile.gender}`);
        console.log(`  Location: ${profile.location}`);
        console.log(`  Verification Status: ${profile.verification_status}`);
        console.log(`  Updated: ${profile.updated_at}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error checking profile changes:', error);
  } finally {
    await sql.end();
  }
}

checkProfileChangesTable();
