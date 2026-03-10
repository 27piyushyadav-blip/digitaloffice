const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function resetAndMigrate() {
  try {
    console.log('Resetting database schema...');
    
    // Drop all tables in correct order (respecting foreign keys)
    const tables = [
      'activity_logs',
      'categories', 
      'disputes',
      'organization_verification_documents',
      'platform_settings',
      'profile_changes',
      'refunds',
      'bookings',
      'sessions',
      'transactions',
      'payouts',
      'notifications',
      'verification_documents',
      'expert_profile',
      'expert_organizations',
      'organizations',
      'availability',
      'blocked_time_slots',
      'client',
      'expert',
      'organisation',
      'admin'
    ];
    
    for (const table of tables) {
      try {
        await sql`DROP TABLE IF EXISTS ${sql(table)} CASCADE`;
        console.log(`Dropped table: ${table}`);
      } catch (err) {
        console.log(`Could not drop table ${table}: ${err.message}`);
      }
    }
    
    console.log('All tables dropped. Now running migration...');
    
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await sql.end();
  }
}

resetAndMigrate();
