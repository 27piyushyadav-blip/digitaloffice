const postgres = require('postgres');

const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function cleanup() {
  try {
    await sql`DROP TABLE IF EXISTS client_id_mapping`;
    console.log('Cleaned up temporary tables');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

cleanup();
