const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function checkColumns() {
  try {
    console.log('Checking table columns...');
    
    // Check notifications table columns
    const notificationsColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `;
    
    console.log('Notifications table columns:');
    notificationsColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Check sessions table columns
    const sessionsColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'sessions'
      ORDER BY ordinal_position
    `;
    
    console.log('\nSessions table columns:');
    sessionsColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error checking columns:', error);
  } finally {
    await sql.end();
  }
}

checkColumns();
