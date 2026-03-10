const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function fixDuplicates() {
  try {
    console.log('Checking for duplicate expert emails...');
    
    // Find duplicates
    const duplicates = await sql`
      SELECT email, COUNT(*) as count 
      FROM expert 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `;
    
    if (duplicates.length > 0) {
      console.log('Found duplicate emails:', duplicates);
      
      // Remove duplicates (keep the first one based on created_at)
      for (const duplicate of duplicates) {
        await sql`
          DELETE FROM expert 
          WHERE id NOT IN (
            SELECT id 
            FROM expert 
            WHERE email = ${duplicate.email}
            ORDER BY created_at ASC
            LIMIT 1
          ) AND email = ${duplicate.email}
        `;
        
        console.log(`Removed duplicates for email: ${duplicate.email}`);
      }
    } else {
      console.log('No duplicate emails found');
    }
    
    console.log('Duplicate fix completed');
    
  } catch (error) {
    console.error('Error fixing duplicates:', error);
  } finally {
    await sql.end();
  }
}

fixDuplicates();
