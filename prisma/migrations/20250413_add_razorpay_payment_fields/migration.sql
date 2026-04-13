-- AlterTable: Add Razorpay payment fields and paymentToken to EventRegistration
ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "paymentGateway" TEXT;
ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "paymentToken" TEXT;
ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT;
ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "razorpayPaymentId" TEXT;
ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "razorpaySignature" TEXT;

-- CreateIndex: Unique index on paymentToken
CREATE UNIQUE INDEX IF NOT EXISTS "EventRegistration_paymentToken_key" ON "EventRegistration"("paymentToken");
