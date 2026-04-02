const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

async function check() {
  try {
    const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');
    const db = drizzle(sql);
    const resOrgProf = await sql`SELECT * FROM organization_profile WHERE user_id = '97abd9ea-a01d-4e9f-9299-6086a8c5f295'`;
    console.log("Raw query orgProfile length:", resOrgProf.length);
    console.log(resOrgProf[0]);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
