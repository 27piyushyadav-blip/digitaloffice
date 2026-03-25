const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function checkExpertProfileColumns() {
  try {
    console.log('Checking expert_profile table columns...');
    
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'expert_profile'
      ORDER BY ordinal_position
    `;
    
    console.log('Expert Profile table columns:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
  } catch (error) {
    console.error('Error checking columns:', error);
  } finally {
    await sql.end();
  }
}

checkExpertProfileColumns();
