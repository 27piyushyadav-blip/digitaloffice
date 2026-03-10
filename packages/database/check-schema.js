const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function checkSchema() {
  try {
    console.log('Checking table schemas...');
    
    // Get all table names
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log('Tables found:', tables.map(t => t.table_name));
    
    // Check each table's ID column type
    for (const table of tables) {
      try {
        const columns = await sql`
          SELECT column_name, data_type, udt_name
          FROM information_schema.columns 
          WHERE table_name = ${table.table_name}
          AND column_name = 'id'
        `;
        
        if (columns.length > 0) {
          console.log(`Table ${table.table_name}: id column type = ${columns[0].data_type} (${columns[0].udt_name})`);
          
          if (columns[0].udt_name !== 'uuid') {
            console.log(`⚠️  PROBLEM: Table ${table.table_name} has non-UUID id column!`);
          }
        }
      } catch (err) {
        console.log(`Could not check table ${table.table_name}:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await sql.end();
  }
}

checkSchema();
