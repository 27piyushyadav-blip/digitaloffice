const postgres = require('postgres');

async function inspect() {
  try {
    const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');
    
    console.log("Fetching payouts...");
    const payoutsList = await sql`SELECT * FROM payouts ORDER BY created_at DESC LIMIT 5`;
    console.log("Payouts found:", payoutsList);
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
inspect();
