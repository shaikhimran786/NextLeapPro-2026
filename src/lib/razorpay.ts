import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

let razorpayInstance: InstanceType<typeof Razorpay> | null = null;

export function getRazorpayInstance(): InstanceType<typeof Razorpay> {
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay API keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables."
    );
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
}

export function getRazorpayKeyId(): string {
  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID not configured");
  }
  return keyId;
}

export function isRazorpayConfigured(): boolean {
  return !!(keyId && keySecret);
}

/**
 * Verify Razorpay webhook signature using HMAC SHA-256.
 * Uses the webhook secret (not the API key secret).
 * Razorpay signs the raw request body and sends the signature as hex in X-Razorpay-Signature.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET not configured");
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  // Use constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    // Buffer lengths differ — signature is invalid
    return false;
  }
}

/**
 * Verify Razorpay payment signature from checkout callback.
 * Uses the API key secret (not the webhook secret).
 * The signed data is "orderId|paymentId".
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET not configured");
  }

  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

export interface RazorpayOrderParams {
  amount: number; // In smallest currency unit (paise for INR)
  currency?: string;
  receipt: string; // Max 40 chars, used as internal order reference
  notes?: Record<string, string>;
}

export async function createOrder(params: RazorpayOrderParams) {
  const rz = getRazorpayInstance();
  return rz.orders.create({
    amount: params.amount,
    currency: params.currency || "INR",
    receipt: params.receipt,
    notes: params.notes || {},
  });
}

export async function fetchPayment(paymentId: string) {
  const rz = getRazorpayInstance();
  return rz.payments.fetch(paymentId);
}
