import { requireAuthOrRedirect } from "@/components/auth/RequireAuth";
import { AICareerCoach } from "@/components/sections/AICareerCoach";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "AI Career Coach | Next Leap Pro",
  description: "Get personalized career guidance, skill development roadmap, and monetization tips powered by AI"
};

export default async function CareerPage() {
  await requireAuthOrRedirect("/career");
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-3">
                Your Personal Career Coach
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Powered by AI, our career coach analyzes your skills, interests, and goals to provide 
                personalized guidance, identify skill gaps, and suggest ways to earn with your expertise.
              </p>
            </div>
            
            <AICareerCoach />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
