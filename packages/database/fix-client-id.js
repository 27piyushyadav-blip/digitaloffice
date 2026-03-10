const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function fixClientId() {
  try {
    console.log('Fixing client table ID column...');
    
    // First, let's see the current structure
    const clientData = await sql`
      SELECT id, email 
      FROM client 
      LIMIT 5
    `;
    
    console.log('Current client data:', clientData);
    
    // Simple approach: just convert the column type
    console.log('Converting client.id column to UUID...');
    
    // Drop the default first
    await sql`
      ALTER TABLE client 
      ALTER COLUMN id DROP DEFAULT
    `;
    
    // Convert the client.id column using a simple cast
    await sql`
      ALTER TABLE client 
      ALTER COLUMN id TYPE uuid USING id::text::uuid
    `;
    
    // Add back the UUID default
    await sql`
      ALTER TABLE client 
      ALTER COLUMN id SET DEFAULT gen_random_uuid()
    `;
    
    console.log('Client table ID column fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing client ID:', error);
  } finally {
    await sql.end();
  }
}

fixClientId();
