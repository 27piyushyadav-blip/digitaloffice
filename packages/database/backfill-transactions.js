const postgres = require('postgres');

async function backfill() {
  try {
    const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');
    
    console.log("Fetching paid bookings that belong to an organization...");
    const bookings = await sql`
      SELECT id, amount, service, organization_id, created_at 
      FROM bookings 
      WHERE payment_status = 'paid' AND organization_id IS NOT NULL
    `;
    
    console.log(`Found ${bookings.length} paid organization bookings.`);
    
    let backfilledCount = 0;
    for (const booking of bookings) {
      // Check if transaction already exists
      const existing = await sql`
        SELECT id FROM transactions 
        WHERE booking_id = ${booking.id} AND type = 'session_payment'
      `;
      
      if (existing.length === 0) {
        console.log(`Backfilling transaction for booking ${booking.id} (${booking.service})...`);
        
        // Resolve actual organizationProfile.id
        const [org] = await sql`
          SELECT id FROM organization_profile 
          WHERE id = ${booking.organization_id} OR user_id = ${booking.organization_id}
        `;
        
        if (!org) {
          console.log(`Profile not found for organization user id ${booking.organization_id}, skipping.`);
          continue;
        }
        
        const amount = Number(booking.amount) || 0;
        const commission = Math.round(amount * 0.15 * 100) / 100;
        const netAmount = amount - commission;
        
        await sql`
          INSERT INTO transactions (
            id, organization_id, booking_id, amount, commission, net_amount, status, type, description, created_at, completed_at
          ) VALUES (
            gen_random_uuid(),
            ${org.id},
            ${booking.id},
            ${amount.toFixed(2)},
            ${commission.toFixed(2)},
            ${netAmount.toFixed(2)},
            'completed',
            'session_payment',
            ${`Payment for booking: ${booking.service}`},
            ${booking.created_at || new Date()},
            ${booking.created_at || new Date()}
          )
        `;
        backfilledCount++;
      } else {
        console.log(`Transaction already exists for booking ${booking.id}, skipping.`);
      }
    }
    
    console.log(`Done! Backfilled ${backfilledCount} transactions.`);
    process.exit(0);
  } catch (e) {
    console.error("Backfill failed:", e);
    process.exit(1);
  }
}
backfill();
