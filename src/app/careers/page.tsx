import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { generateMeta } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Briefcase, Heart, Zap, Users, Coffee } from "@/lib/icons";

export const metadata: Metadata = generateMeta({
  title: "Careers",
  description: "Join the Next Leap Pro team and help us empower millions to learn, earn, and grow.",
  path: "/careers",
});

const benefits = [
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive health insurance for you and your family" },
  { icon: Zap, title: "Learning Budget", description: "Annual budget for courses, conferences, and skill development" },
  { icon: Users, title: "Remote-First", description: "Work from anywhere in India with flexible hours" },
  { icon: Coffee, title: "Team Offsites", description: "Quarterly team meetups and annual company retreat" },
];

const openings = [
  {
    title: "Senior Full Stack Developer",
    department: "Engineering",
    location: "Remote (India)",
    type: "Full-time",
    description: "Build and scale our platform using Next.js, TypeScript, and PostgreSQL.",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote (India)",
    type: "Full-time",
    description: "Design intuitive and delightful user experiences for our learning platform.",
  },
  {
    title: "Community Manager",
    department: "Operations",
    location: "Bangalore / Remote",
    type: "Full-time",
    description: "Build and nurture our growing community of learners and creators.",
  },
  {
    title: "Content Marketing Lead",
    department: "Marketing",
    location: "Remote (India)",
    type: "Full-time",
    description: "Create compelling content that inspires people to learn and grow.",
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-gradient-to-br from-primary/10 via-blue-50 to-green-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
              Join Our Team
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Help us build the platform that empowers millions to learn new skills, 
              monetize their talents, and grow their careers.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-slate-900 text-center mb-12">
              Why Work With Us?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-none shadow-sm">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                    <p className="text-sm text-slate-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-slate-900 text-center mb-4">
              Open Positions
            </h2>
            <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
              We're always looking for talented people who share our mission. 
              Check out our current openings below.
            </p>
            <div className="max-w-3xl mx-auto space-y-4">
              {openings.map((job, index) => (
                <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-heading font-semibold text-lg text-slate-900">{job.title}</h3>
                        <p className="text-slate-600 text-sm mt-1">{job.description}</p>
                        <div className="flex flex-wrap gap-3 mt-3">
                          <div className="flex items-center text-sm text-slate-500">
                            <Briefcase className="h-4 w-4 mr-1" />
                            {job.department}
                          </div>
                          <div className="flex items-center text-sm text-slate-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location}
                          </div>
                          <div className="flex items-center text-sm text-slate-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {job.type}
                          </div>
                        </div>
                      </div>
                      <Button className="rounded-full shrink-0">
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-6">
              Don't See a Perfect Fit?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              We're always open to hearing from talented individuals. Send us your resume 
              and tell us how you'd like to contribute to our mission.
            </p>
            <a
              href="mailto:careers@nextleappro.com"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-slate-900 text-slate-900 rounded-full font-medium hover:bg-slate-900 hover:text-white transition-colors"
            >
              Send Your Resume
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
