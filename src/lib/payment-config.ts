export type PaymentProvider = "razorpay" | "cashfree";
export type PaymentRegion = "india" | "international";

export function getPaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER || "razorpay").toLowerCase();
  if (provider === "cashfree" || provider === "razorpay") {
    return provider;
  }
  return "razorpay";
}

export function getPaymentRegion(): PaymentRegion {
  const region = (process.env.REGION || "india").toLowerCase();
  if (region === "international") {
    return "international";
  }
  return "india";
}

export function getDefaultCurrency(): string {
  const region = getPaymentRegion();
  return region === "india" ? "INR" : "USD";
}

export function isEventPaymentEnabled(): boolean {
  const provider = getPaymentProvider();
  if (provider === "razorpay") {
    return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }
  return false;
}
