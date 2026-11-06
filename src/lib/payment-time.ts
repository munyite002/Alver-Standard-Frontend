// Which timezone turns a payment's stored transTime back into the time in Kenya.
//
// M-Pesa paybill rows: M-Pesa sends a Kenyan clock reading with no timezone, and the backend parses it on a
// server set to Europe/Berlin. Reading the value back in Berlin returns that exact reading, summer or winter.
// STK rows (app, USSD, WhatsApp) and unmatched callbacks: the backend uses new Date(), a true instant.
//
// ponytail: tied to the server's timezone. If the backend starts parsing with +03:00, or the server's timezone
// changes, drop the Berlin branch at the same time and correct the rows already stored.
export const paymentTimeZone = (transactionType?: string | null) =>
    /STK|CALLBACK_NO_MATCH/.test(transactionType ?? "") ? "Africa/Nairobi" : "Europe/Berlin";
