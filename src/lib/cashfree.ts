import { Cashfree, CFEnvironment, CreateOrderRequest, OrderEntity } from "cashfree-pg";
import crypto from "crypto";

const appId = process.env.CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;

let cashfreeInstance: Cashfree | null = null;

export function getCashfreeInstance(): Cashfree {
  if (!appId || !secretKey) {
    throw new Error("Cashfree API keys not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables.");
  }
  
  if (!cashfreeInstance) {
    cashfreeInstance = new Cashfree(
      CFEnvironment.PRODUCTION,
      appId,
      secretKey
    );
  }
  
  return cashfreeInstance;
}

export function getCashfreeAppId(): string {
  if (!appId) {
    throw new Error("CASHFREE_APP_ID not configured");
  }
  return appId;
}

export function isCashfreeConfigured(): boolean {
  return !!(appId && secretKey);
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  if (!secretKey) {
    throw new Error("CASHFREE_SECRET_KEY not configured");
  }
  
  const data = timestamp + body;
  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(data)
    .digest("base64");
  
  return expectedSignature === signature;
}

export interface CashfreeOrderParams {
  orderId: string;
  orderAmount: number;
  orderCurrency?: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  customerName?: string;
  returnUrl?: string;
  notifyUrl?: string;
  orderNote?: string;
}

export interface CashfreeSubscriptionParams {
  subscriptionId: string;
  planId: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  customerName?: string;
  subscriptionExpiryTime?: string;
  subscriptionFirstChargeTime?: string;
  subscriptionNote?: string;
  returnUrl?: string;
  notifyUrl?: string;
}

export async function createOrder(params: CashfreeOrderParams): Promise<OrderEntity> {
  const cf = getCashfreeInstance();
  
  const request: CreateOrderRequest = {
    order_id: params.orderId,
    order_amount: params.orderAmount,
    order_currency: params.orderCurrency || "INR",
    customer_details: {
      customer_id: params.customerId,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      customer_name: params.customerName,
    },
    order_meta: {
      return_url: params.returnUrl,
      notify_url: params.notifyUrl,
    },
    order_note: params.orderNote,
  };

  const response = await cf.PGCreateOrder(request);
  return response.data;
}

export async function fetchOrder(orderId: string): Promise<OrderEntity> {
  const cf = getCashfreeInstance();
  const response = await cf.PGFetchOrder(orderId);
  return response.data;
}

export async function getPaymentSessionId(orderId: string): Promise<string | null> {
  try {
    const order = await fetchOrder(orderId);
    return order?.payment_session_id || null;
  } catch (error) {
    console.error("Failed to get payment session:", error);
    return null;
  }
}
