const postgres = require('postgres');

async function inspect() {
  try {
    const sql = postgres('postgresql://postgres.dpnappudvlepyrwueaqy:TestSupper9981@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres');
    
    const bookingId = 'a574ffbb-2295-4e63-97a8-4a850c4a4ab5';
    console.log(`--- Inspecting Booking: ${bookingId} ---`);
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${bookingId}`;
    console.log("Booking found:", booking);
    
    if (booking) {
      console.log(`--- Inspecting Transactions for Booking ---`);
      const txns = await sql`SELECT * FROM transactions WHERE booking_id = ${bookingId}`;
      console.log("Transactions found for booking:", txns);
      
      if (booking.organization_id) {
        console.log(`--- Inspecting Organization Profile ---`);
        const [org] = await sql`SELECT * FROM organization_profile WHERE id = ${booking.organization_id} OR user_id = ${booking.organization_id}`;
        console.log("Org profile:", org);
      }
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
inspect();
