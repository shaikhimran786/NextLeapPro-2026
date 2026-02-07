import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { generateMeta } from "@/lib/metadata";
import { BookOpen, IndianRupee, TrendingUp, Users, Target, Heart, Zap, Globe } from "@/lib/icons";

export const metadata: Metadata = generateMeta({
  title: "About Us",
  description: "Learn about Next Leap Pro - the platform helping students and professionals learn, earn, and grow their careers.",
  path: "/about",
});

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We're on a mission to democratize skill development and career growth for everyone in India and beyond.",
  },
  {
    icon: Heart,
    title: "Community First",
    description: "We believe in the power of communities to support, inspire, and elevate each other.",
  },
  {
    icon: Zap,
    title: "Action-Oriented",
    description: "We focus on practical skills and real opportunities, not just theoretical knowledge.",
  },
  {
    icon: Globe,
    title: "Inclusive Growth",
    description: "We're committed to making quality learning and earning opportunities accessible to all.",
  },
];

const stats = [
  { value: "10,000+", label: "Active Learners" },
  { value: "500+", label: "Expert Mentors" },
  { value: "200+", label: "Communities" },
  { value: "₹5Cr+", label: "Earned by Members" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-gradient-to-br from-primary/10 via-blue-50 to-green-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
              About Next Leap Pro
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              We're building the platform where students and professionals come to learn new skills, 
              monetize their talents, and accelerate their career growth.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-heading font-bold text-slate-900 mb-6">Our Story</h2>
                <div className="space-y-4 text-slate-600">
                  <p>
                    Next Leap Pro was born from a simple observation: talented individuals in India often 
                    struggle to find the right opportunities to learn, grow, and earn, despite having 
                    incredible potential.
                  </p>
                  <p>
                    We created a platform that brings together expert-led events, vibrant communities, 
                    and a services marketplace—all in one place. Whether you're a student looking to 
                    build skills, a professional seeking to upskill, or a mentor wanting to share 
                    your expertise, Next Leap Pro is your launchpad.
                  </p>
                  <p>
                    Today, we're proud to support thousands of learners and creators across India, 
                    helping them take their next leap in their careers.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm text-center">
                  <BookOpen className="h-10 w-10 text-blue-600 mb-3" />
                  <span className="font-heading font-bold text-2xl text-slate-900">Learn</span>
                  <span className="text-sm text-slate-500 mt-1">Build Skills</span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm text-center">
                  <IndianRupee className="h-10 w-10 text-green-600 mb-3" />
                  <span className="font-heading font-bold text-2xl text-slate-900">Earn</span>
                  <span className="text-sm text-slate-500 mt-1">Monetize Talents</span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm text-center">
                  <TrendingUp className="h-10 w-10 text-purple-600 mb-3" />
                  <span className="font-heading font-bold text-2xl text-slate-900">Grow</span>
                  <span className="text-sm text-slate-500 mt-1">Accelerate Career</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-slate-900 text-center mb-12">
              Our Values
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-slate-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-slate-600 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-primary text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-heading font-bold mb-2">{stat.value}</div>
                  <div className="text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-6">
              Join Our Community
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              Be part of a growing community of learners, creators, and professionals 
              who are taking their careers to the next level.
            </p>
            <a
              href="/auth/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-primary text-white rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Get Started for Free
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
