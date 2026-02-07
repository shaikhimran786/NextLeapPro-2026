import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { generateMeta } from "@/lib/metadata";

export const metadata: Metadata = generateMeta({
  title: "Terms of Service",
  description: "Read our terms of service to understand your rights and responsibilities when using Next Leap Pro.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-8">Terms of Service</h1>
            <p className="text-slate-600 mb-8">Last updated: November 29, 2024</p>

            <div className="prose prose-slate max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-slate-600 mb-4">
                  By accessing or using Next Leap Pro ("the Platform"), you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">2. Description of Service</h2>
                <p className="text-slate-600 mb-4">
                  Next Leap Pro is a platform that provides:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Access to learning events, workshops, and webinars</li>
                  <li>Community features for networking and collaboration</li>
                  <li>A marketplace for professional services</li>
                  <li>Subscription-based premium features</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">3. User Accounts</h2>
                <p className="text-slate-600 mb-4">
                  To access certain features, you must create an account. You are responsible for:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information</li>
                  <li>Updating your information to keep it current</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">4. Subscription and Payments</h2>
                <p className="text-slate-600 mb-4">
                  Some features require a paid subscription. By subscribing, you agree to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Pay all applicable fees as per the selected plan</li>
                  <li>Automatic renewal unless cancelled before the renewal date</li>
                  <li>Our refund policy as outlined in our Refund Policy</li>
                </ul>
                <p className="text-slate-600 mt-4">
                  All prices are displayed in Indian Rupees (INR) unless otherwise specified.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">5. User Content</h2>
                <p className="text-slate-600 mb-4">
                  You retain ownership of content you create on the Platform. By posting content, you grant us a 
                  non-exclusive, worldwide, royalty-free license to use, display, and distribute your content 
                  in connection with the Platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">6. Prohibited Conduct</h2>
                <p className="text-slate-600 mb-4">
                  You agree not to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Use the Platform for any illegal purpose</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Post false, misleading, or fraudulent content</li>
                  <li>Attempt to gain unauthorized access to the Platform</li>
                  <li>Interfere with the proper functioning of the Platform</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">7. Intellectual Property</h2>
                <p className="text-slate-600 mb-4">
                  The Platform and its original content, features, and functionality are owned by Next Leap Pro 
                  and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">8. Limitation of Liability</h2>
                <p className="text-slate-600 mb-4">
                  Next Leap Pro shall not be liable for any indirect, incidental, special, consequential, or 
                  punitive damages resulting from your use of or inability to use the Platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">9. Changes to Terms</h2>
                <p className="text-slate-600 mb-4">
                  We reserve the right to modify these terms at any time. We will notify users of any material 
                  changes via email or through the Platform. Continued use of the Platform after changes 
                  constitutes acceptance of the new terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">10. Contact Us</h2>
                <p className="text-slate-600">
                  If you have any questions about these Terms, please contact us at:
                  <br />
                  <a href="mailto:legal@nextleappro.com" className="text-primary hover:underline">legal@nextleappro.com</a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
