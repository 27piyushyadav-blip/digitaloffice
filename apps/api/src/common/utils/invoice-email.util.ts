import { DatabaseService } from '../../database/database.service';
import { MailService } from '@repo/mail';

export async function sendInvoiceEmailHelper(
  databaseService: DatabaseService,
  mailService: MailService,
  bookingId: string,
  type: 'payment' | 'edit_service' | 'refund'
) {
  try {
    // 1. Fetch booking details
    const details = await databaseService.findBookingDetailsById(bookingId);
    if (!details || !details.booking) {
      console.error(`Booking details not found for ID: ${bookingId}`);
      return;
    }
    const { booking, organization } = details;

    // 2. Fetch invoice
    const invoice = await databaseService.findInvoiceByBookingIdAndType(bookingId, type);
    if (!invoice) {
      console.error(`Invoice of type ${type} not found for booking: ${bookingId}`);
      return;
    }

    // 3. Resolve customer email and name
    let customerEmail = '';
    let customerName = 'Valued Customer';

    let metadata: any = invoice.metadata;
    if (metadata) {
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {}
      }
      customerEmail = metadata.customerEmail || '';
      customerName = metadata.customerName || 'Valued Customer';
    }

    if (!customerEmail) {
      // Fall back to client profile
      const clientData = await databaseService.findClientById(booking.clientId);
      if (clientData) {
        customerEmail = clientData.email;
        customerName = clientData.name || `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() || 'Valued Customer';
      }
    }

    if (!customerEmail) {
      console.error(`Could not resolve customer email for booking: ${bookingId}`);
      return;
    }

    // 4. Resolve services list
    let services = metadata?.services;
    if (!services || !Array.isArray(services) || services.length === 0) {
      services = [{ name: booking.service, price: Number(booking.amount), quantity: 1 }];
    }

    // 5. Format invoice details
    const dateFormatted = new Date(invoice.issuedAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    await mailService.sendInvoiceEmail(customerEmail, customerName, {
      invoiceNumber: invoice.invoiceNumber,
      date: dateFormatted,
      bookingId: booking.id,
      orgName: organization?.name || 'Digital Office Business',
      orgAddress: organization?.addressLine1 || organization?.location || undefined,
      orgPhone: organization?.phone || organization?.phoneNumber || undefined,
      orgEmail: organization?.officialEmail || organization?.email || undefined,
      services: services.map(s => ({
        name: s.name,
        price: Number(s.price),
        quantity: Number(s.quantity || 1)
      })),
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount || 0),
      amount: Number(invoice.amount),
      type
    });
  } catch (error) {
    console.error(`Failed to send invoice email helper for booking ${bookingId}:`, error);
  }
}
