import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { generateMeta } from "@/lib/metadata";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Mail } from "@/lib/icons";

export const metadata: Metadata = generateMeta({
  title: "Refund Policy",
  description: "Understand our refund policy for subscriptions, events, and services on Next Leap Pro.",
  path: "/refund",
});

export default function RefundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-8">Refund Policy</h1>
            <p className="text-slate-600 mb-8">Last updated: November 29, 2024</p>

            <Card className="border-none shadow-sm mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-heading font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Quick Summary
                </h2>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-600">Subscriptions: Full refund within 7 days of purchase (no questions asked)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-600">Events: Full refund up to 48 hours before the event</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-600">Services: Refund available if service not delivered as promised</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="prose prose-slate max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">1. Subscription Refunds</h2>
                <p className="text-slate-600 mb-4">
                  We want you to be completely satisfied with your subscription. Here's our refund policy for subscriptions:
                </p>
                
                <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Eligibility</h3>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Full refund available within 7 days of initial purchase</li>
                  <li>No questions asked during the 7-day period</li>
                  <li>After 7 days, refunds are provided on a case-by-case basis</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">What's Not Refundable</h3>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Partial month/year subscriptions after the 7-day period</li>
                  <li>Subscription upgrades (though you can downgrade)</li>
                  <li>Add-on purchases after they've been used</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">2. Event Refunds</h2>
                <p className="text-slate-600 mb-4">
                  For paid events on our platform:
                </p>

                <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Refund Timeline</h3>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li><strong>More than 48 hours before:</strong> Full refund</li>
                  <li><strong>24-48 hours before:</strong> 50% refund</li>
                  <li><strong>Less than 24 hours:</strong> No refund (except in emergencies)</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Event Cancellation by Organizer</h3>
                <p className="text-slate-600 mb-4">
                  If an event is cancelled by the organizer, you will receive a full refund within 5-7 business days.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">3. Service Marketplace Refunds</h2>
                <p className="text-slate-600 mb-4">
                  For services purchased through our marketplace:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Refunds available if service not delivered as described</li>
                  <li>Disputes should be raised within 7 days of service completion</li>
                  <li>We will mediate between service provider and client</li>
                  <li>Refund amount depends on the nature of the dispute</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">4. How to Request a Refund</h2>
                <p className="text-slate-600 mb-4">
                  To request a refund:
                </p>
                <ol className="list-decimal pl-6 text-slate-600 space-y-2">
                  <li>Log in to your account</li>
                  <li>Go to your purchase history or subscription settings</li>
                  <li>Click "Request Refund" on the relevant item</li>
                  <li>Provide a reason for the refund request</li>
                  <li>Submit the request</li>
                </ol>
                <p className="text-slate-600 mt-4">
                  Alternatively, you can email us at{" "}
                  <a href="mailto:refunds@nextleappro.com" className="text-primary hover:underline">
                    refunds@nextleappro.com
                  </a>{" "}
                  with your order details.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">5. Refund Processing</h2>
                <p className="text-slate-600 mb-4">
                  Once approved, refunds will be processed as follows:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Credit/Debit Card: 5-10 business days</li>
                  <li>UPI: 2-5 business days</li>
                  <li>Net Banking: 5-7 business days</li>
                  <li>Wallet: Instant to 24 hours</li>
                </ul>
                <p className="text-slate-600 mt-4">
                  Refunds will be credited to the original payment method unless otherwise requested.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">6. Contact Us</h2>
                <Card className="border-none bg-primary/5">
                  <CardContent className="p-6 flex items-start gap-4">
                    <Mail className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">Have questions about refunds?</p>
                      <p className="text-slate-600 mt-1">
                        Email us at{" "}
                        <a href="mailto:refunds@nextleappro.com" className="text-primary hover:underline">
                          refunds@nextleappro.com
                        </a>
                      </p>
                      <p className="text-sm text-slate-500 mt-2">We respond within 24 hours on business days.</p>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
