import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { generateMeta } from "@/lib/metadata";

export const metadata: Metadata = generateMeta({
  title: "Privacy Policy",
  description: "Learn how Next Leap Pro collects, uses, and protects your personal information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-8">Privacy Policy</h1>
            <p className="text-slate-600 mb-8">Last updated: November 29, 2024</p>

            <div className="prose prose-slate max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">1. Introduction</h2>
                <p className="text-slate-600 mb-4">
                  Next Leap Pro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you use our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">2. Information We Collect</h2>
                <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Personal Information</h3>
                <p className="text-slate-600 mb-4">
                  We may collect the following personal information:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Name and contact information (email address, phone number)</li>
                  <li>Account credentials</li>
                  <li>Profile information (bio, skills, professional background)</li>
                  <li>Payment information (processed securely by our payment partners)</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Usage Information</h3>
                <p className="text-slate-600 mb-4">
                  We automatically collect certain information when you use the Platform:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Device and browser information</li>
                  <li>IP address and location data</li>
                  <li>Usage patterns and preferences</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">3. How We Use Your Information</h2>
                <p className="text-slate-600 mb-4">
                  We use your information to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Provide and maintain our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Personalize your experience on the Platform</li>
                  <li>Send promotional communications (with your consent)</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Improve our Platform and develop new features</li>
                  <li>Detect and prevent fraud or abuse</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">4. Information Sharing</h2>
                <p className="text-slate-600 mb-4">
                  We may share your information with:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Service providers who assist in our operations</li>
                  <li>Event organizers (for registered events)</li>
                  <li>Community administrators (for joined communities)</li>
                  <li>Legal authorities when required by law</li>
                </ul>
                <p className="text-slate-600 mt-4">
                  We do not sell your personal information to third parties.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">5. Data Security</h2>
                <p className="text-slate-600 mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information, 
                  including encryption, secure servers, and access controls. However, no method of transmission over 
                  the Internet is 100% secure.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">6. Your Rights</h2>
                <p className="text-slate-600 mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Withdraw consent for marketing communications</li>
                  <li>Export your data in a portable format</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">7. Cookies</h2>
                <p className="text-slate-600 mb-4">
                  We use cookies and similar technologies to enhance your experience, analyze usage, and 
                  personalize content. You can control cookies through your browser settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">8. Children's Privacy</h2>
                <p className="text-slate-600 mb-4">
                  Our Platform is not intended for children under 13 years of age. We do not knowingly collect 
                  personal information from children under 13.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">9. Changes to This Policy</h2>
                <p className="text-slate-600 mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by 
                  posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">10. Contact Us</h2>
                <p className="text-slate-600">
                  If you have any questions about this Privacy Policy, please contact us at:
                  <br />
                  <a href="mailto:privacy@nextleappro.com" className="text-primary hover:underline">privacy@nextleappro.com</a>
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
