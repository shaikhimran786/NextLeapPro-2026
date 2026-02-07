export interface PaymentLinkParams {
  amount: number;
  currency?: string;
  description?: string;
  name?: string;
  email?: string;
  contact?: string;
  eventId?: number;
  eventTitle?: string;
  userId?: number;
  registrationId?: number;
  planId?: number;
  planName?: string;
  type: "event" | "subscription";
}

export function generatePaymentLink(params: PaymentLinkParams): string {
  return `/pricing?planId=${params.planId || ''}&amount=${params.amount}`;
}

export function generateEventPaymentLink(params: {
  eventId: number;
  eventTitle: string;
  amount: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
  registrationId?: number;
}): string {
  return `/events/${params.eventId}?register=true`;
}

export function generateSubscriptionPaymentLink(params: {
  planId: number;
  planName: string;
  amount: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
}): string {
  return `/pricing?planId=${params.planId}`;
}

export function generateTicketCode(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `TKT-${timestamp}-${randomPart}`.toUpperCase();
}

export function generateQRCodeData(params: {
  ticketCode: string;
  eventId: number;
  userId: number;
  registrationId: number;
}): string {
  return JSON.stringify({
    tc: params.ticketCode,
    eid: params.eventId,
    uid: params.userId,
    rid: params.registrationId,
    ts: Date.now(),
  });
}
