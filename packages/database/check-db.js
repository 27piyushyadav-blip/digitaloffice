const postgres = require('postgres');

async function main() {
  const sql = postgres("postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres");

  console.log("--- Services for Oneservice ---");
  const oneservice = await sql`
    SELECT id, name, "basePrice", "organizationId"
    FROM services
    WHERE "organizationId" = 'e04bd382-59b4-49ae-b454-b6f2a2a12f41'
  `;
  console.log(oneservice);

  console.log("--- Services for kunal ---");
  const kunal = await sql`
    SELECT id, name, "basePrice", "organizationId"
    FROM services
    WHERE "organizationId" = '97abd9ea-a01d-4e9f-9299-6086a8c5f295'
  `;
  console.log(kunal);

  await sql.end();
}

main().catch(console.error);
