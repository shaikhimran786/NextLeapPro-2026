"use client";

import { useMemo, memo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, 
  IndianRupee, 
  TrendingUp, 
  GraduationCap, 
  Briefcase, 
  Home, 
  Heart,
  Building2,
  School,
  UserCircle,
  ArrowRight,
  CheckCircle2,
  Award,
  Handshake,
  ShoppingBag,
  Calendar,
  Mic,
  PenTool,
  Star,
  Zap,
  Crown,
  Rocket,
  MessageCircle,
  BadgeCheck,
  Sparkles,
  Quote,
  ChevronRight,
  Target,
  type LucideIcon
} from "@/lib/icons";

import "@/styles/how-it-works-animations.css";

function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1, rootMargin: "-50px", ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}

interface WhoCanJoinItem {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

interface JourneyStep {
  step: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  items: string[];
}

interface EarningPath {
  icon: LucideIcon;
  title: string;
  description: string;
  example: string;
  gradient: string;
}

interface SuccessStory {
  name: string;
  role: string;
  avatar: string;
  location: string;
  story: string;
  earnings: string;
  duration: string;
  highlight: string;
  gradient: string;
  bgGradient: string;
}

interface SubscriptionBenefit {
  icon: LucideIcon;
  text: string;
}

const WhoCanJoinCard = memo(function WhoCanJoinCard({ 
  group, 
  index 
}: { 
  group: WhoCanJoinItem; 
  index: number 
}) {
  const Icon = group.icon;
  return (
    <div
      className="group animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
      data-testid={`card-who-can-join-${index}`}
    >
      <Card className="h-full border-none shadow-lg bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
        <CardContent className="p-6 text-center relative">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${group.gradient} mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">
            {group.title}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">{group.description}</p>
        </CardContent>
      </Card>
    </div>
  );
});

const JourneyStepCard = memo(function JourneyStepCard({ 
  step, 
  index, 
  isLast 
}: { 
  step: JourneyStep; 
  index: number; 
  isLast: boolean 
}) {
  const Icon = step.icon;
  return (
    <div
      className="relative group animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
      data-testid={`step-journey-${step.step}`}
    >
      {!isLast && (
        <div className="hidden lg:block absolute top-16 left-[calc(50%+4rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-slate-200 to-slate-300" />
      )}
      
      <Card className="h-full border-none shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:rotate-6`}>
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {step.step}</span>
              <h3 className="font-heading font-bold text-lg text-slate-900">{step.title}</h3>
            </div>
          </div>
          <p className="text-sm text-primary font-medium mb-4 italic">{step.subtitle}</p>
          <ul className="space-y-3">
            {step.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
});

const EarningPathCard = memo(function EarningPathCard({ 
  path, 
  index 
}: { 
  path: EarningPath; 
  index: number 
}) {
  const Icon = path.icon;
  return (
    <div
      className="group animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
      data-testid={`card-earning-path-${index}`}
    >
      <Card className="h-full border-none shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
        <CardContent className="p-8">
          <div className="flex items-start gap-5">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${path.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-lg transition-transform duration-300 group-hover:rotate-6`}>
              <Icon className="h-7 w-7" />
            </div>
            <div className="flex-grow">
              <h3 className="font-heading font-bold text-xl text-slate-900 mb-2">
                {path.title}
              </h3>
              <p className="text-slate-600 mb-4 leading-relaxed">{path.description}</p>
              <div className="bg-gradient-to-r from-slate-50 to-green-50 rounded-xl p-4 border-l-4 border-green-500">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Real Example</p>
                <p className="text-sm text-slate-700">{path.example}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

const SuccessStoryCard = memo(function SuccessStoryCard({ 
  story, 
  index 
}: { 
  story: SuccessStory; 
  index: number 
}) {
  return (
    <div
      className="group animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
      data-testid={`card-success-story-${index}`}
    >
      <Card className={`h-full border-none shadow-xl overflow-hidden bg-gradient-to-br ${story.bgGradient} transition-all duration-300 hover:shadow-2xl hover:-translate-y-2`}>
        <CardContent className="p-6 relative">
          <Quote className="absolute top-4 right-4 h-8 w-8 text-slate-200" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${story.gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform duration-300 group-hover:scale-110`}>
              {story.avatar}
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900">{story.name}</h3>
              <p className="text-sm text-slate-600">{story.location}</p>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 mb-4 inline-block">
            <p className="text-sm font-semibold text-slate-700">{story.role}</p>
          </div>
          
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            "{story.story}"
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/80 rounded-lg p-3 text-center">
              <p className={`font-bold text-lg bg-gradient-to-r ${story.gradient} bg-clip-text text-transparent`}>
                {story.earnings}
              </p>
              <p className="text-xs text-slate-500">Earnings</p>
            </div>
            <div className="bg-white/80 rounded-lg p-3 text-center">
              <p className="font-semibold text-slate-700">{story.duration}</p>
              <p className="text-xs text-slate-500">Timeline</p>
            </div>
          </div>
          
          <div className={`bg-gradient-to-r ${story.gradient} text-white rounded-lg p-3`}>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm font-medium">{story.highlight}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

const SubscriptionBenefitItem = memo(function SubscriptionBenefitItem({ 
  benefit, 
  index 
}: { 
  benefit: SubscriptionBenefit; 
  index: number 
}) {
  const Icon = benefit.icon;
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 hover:bg-primary/5 hover:translate-x-1 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-blue-100 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-slate-700 font-medium">{benefit.text}</span>
    </div>
  );
});

function AnimatedSection({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  const { ref, isInView } = useInView();
  return (
    <div 
      ref={ref} 
      className={`transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function HowItWorksPage() {
  const { data: siteSettings } = useSWR('/api/settings', fetcher);
  
  const whoCanJoin = useMemo<WhoCanJoinItem[]>(() => [
    {
      icon: GraduationCap,
      title: "Students",
      description: "Build skills while studying, earn through micro-gigs, and kickstart your career before graduation.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Briefcase,
      title: "Working Professionals",
      description: "Upskill for promotions, build side income through mentoring, and expand your professional network.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: PenTool,
      title: "Freelancers",
      description: "Showcase your services, find clients, and build a sustainable freelance business.",
      gradient: "from-purple-500 to-violet-500",
    },
    {
      icon: Home,
      title: "Homemakers",
      description: "Learn new skills, offer services from home, and build financial independence on your schedule.",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: Heart,
      title: "Retired Professionals",
      description: "Share your lifetime of wisdom, mentor the next generation, and earn from consulting.",
      gradient: "from-orange-500 to-amber-500",
    },
    {
      icon: Mic,
      title: "Mentors & Coaches",
      description: "Build your brand, create communities, host events, and monetize your expertise.",
      gradient: "from-indigo-500 to-blue-500",
    },
    {
      icon: Building2,
      title: "Corporates & Startups",
      description: "Find skilled talent, run training programs, and engage with a pool of motivated professionals.",
      gradient: "from-slate-600 to-slate-800",
    },
    {
      icon: School,
      title: "Colleges & Universities",
      description: "Provide career opportunities to students, run placement drives, and connect with industry mentors.",
      gradient: "from-teal-500 to-cyan-600",
    },
  ], []);

  const journeySteps = useMemo<JourneyStep[]>(() => [
    {
      step: 1,
      title: "Join the Community",
      subtitle: "Apna profile banao",
      icon: UserCircle,
      gradient: "from-blue-500 to-blue-600",
      items: [
        "Create your profile with skills and interests",
        "Get your own public profile link",
        "Connect with like-minded people",
        "Join communities that match your goals",
      ],
    },
    {
      step: 2,
      title: "Start Learning",
      subtitle: "Seekhna shuru karo",
      icon: BookOpen,
      gradient: "from-green-500 to-green-600",
      items: [
        "Attend workshops, webinars, and bootcamps",
        "Learn from industry experts and mentors",
        "Earn badges and certificates",
        "Apply knowledge through practical projects",
      ],
    },
    {
      step: 3,
      title: "Explore Earning",
      subtitle: "Kamaai ke maukhe explore karo",
      icon: IndianRupee,
      gradient: "from-amber-500 to-orange-600",
      items: [
        "Offer services in the marketplace",
        "Complete micro-gigs for quick earnings",
        "Host paid workshops and masterclasses",
        "Provide mentoring and coaching sessions",
      ],
    },
    {
      step: 4,
      title: "Grow & Thrive",
      subtitle: "Aage badho aur chamko",
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-600",
      items: [
        "Build your reputation and visibility",
        "Get endorsements and followers",
        "Become a trusted community leader",
        "Unlock premium opportunities",
      ],
    },
  ], []);

  const earningPaths = useMemo<EarningPath[]>(() => [
    {
      icon: ShoppingBag,
      title: "Service Marketplace",
      description: "List your services — mentoring, coaching, design, content writing, research, and more. Get discovered and hired.",
      example: "A graphic designer lists thumbnail creation services and earns ₹500-2000 per project.",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: Calendar,
      title: "Paid Events",
      description: "Create and host workshops, masterclasses, or webinars. Earn from ticket sales directly.",
      example: "A marketing expert hosts a 2-hour masterclass and earns ₹15,000 from 50 attendees.",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      icon: Zap,
      title: "Micro-Gigs",
      description: "Complete small tasks for mentors, coaches, or startups — editing, research, social media, and more.",
      example: "A student edits 5 podcast episodes for a coach and earns ₹3,000 in a week.",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      icon: MessageCircle,
      title: "Mentoring & Consulting",
      description: "Offer 1-on-1 guidance sessions. Help others with your expertise and get paid for your time.",
      example: "A retired HR professional offers career counseling at ₹500 per 30-minute session.",
      gradient: "from-purple-500 to-pink-600",
    },
  ], []);

  const subscriptionBenefits = useMemo<SubscriptionBenefit[]>(() => [
    { icon: Crown, text: "Create and manage your own communities" },
    { icon: Calendar, text: "Host unlimited paid or free events" },
    { icon: ShoppingBag, text: "List services in the marketplace" },
    { icon: BadgeCheck, text: "Get verified profile badge" },
    { icon: Star, text: "Priority visibility in search results" },
    { icon: Target, text: "Access premium learning resources" },
    { icon: Rocket, text: "Advanced analytics and insights" },
    { icon: Handshake, text: "Connect with exclusive opportunities" },
  ], []);

  const successStories = useMemo<SuccessStory[]>(() => [
    {
      name: "Priya Sharma",
      role: "Engineering Student → Digital Marketer",
      avatar: "PS",
      location: "Mumbai",
      story: "Started as a 2nd-year engineering student with zero marketing knowledge. Attended free workshops, completed 15+ micro-gigs, and now earns ₹25,000/month while studying.",
      earnings: "₹25,000/month",
      duration: "6 months journey",
      highlight: "Built portfolio that landed her a pre-placement offer",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      name: "Rahul Verma",
      role: "IT Professional → Tech Mentor",
      avatar: "RV",
      location: "Bengaluru",
      story: "A software engineer who wanted to give back. Started sharing Python tips, built a community of 2,000+ members, and now offers weekend mentoring sessions.",
      earnings: "₹40,000/month side income",
      duration: "8 months journey",
      highlight: "Got hired as a consultant by 3 startups",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
    },
    {
      name: "Mr. Suresh Sharma",
      role: "Retired Banker → Finance Mentor",
      avatar: "SS",
      location: "Delhi",
      story: "After 35 years in banking, he found purpose in mentoring young professionals. Hosts monthly masterclasses on personal finance and career planning.",
      earnings: "₹30,000/month",
      duration: "4 months journey",
      highlight: "Mentored 100+ students and professionals",
      gradient: "from-orange-500 to-amber-500",
      bgGradient: "from-orange-50 to-amber-50",
    },
    {
      name: "Anita Kulkarni",
      role: "Homemaker → Leadership Coach",
      avatar: "AK",
      location: "Pune",
      story: "With 15 years of corporate HR experience, she started coaching from home. Built her own community and now runs a successful coaching business.",
      earnings: "₹50,000/month",
      duration: "10 months journey",
      highlight: "Grew community to 5,000+ followers",
      gradient: "from-purple-500 to-violet-500",
      bgGradient: "from-purple-50 to-violet-50",
    },
    {
      name: "Vikram Patel",
      role: "Freelance Designer → Agency Owner",
      avatar: "VP",
      location: "Ahmedabad",
      story: "Started offering design services on the marketplace. Quality work led to repeat clients, and he now manages a team of 5 designers.",
      earnings: "₹1.5 Lakh/month",
      duration: "12 months journey",
      highlight: "Built a design agency from scratch",
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-50 to-rose-50",
    },
    {
      name: "Dr. Meera Reddy",
      role: "Doctor → Healthcare Educator",
      avatar: "MR",
      location: "Hyderabad",
      story: "A practicing physician who started creating health awareness content. Her workshops on preventive care attract hundreds of attendees.",
      earnings: "₹35,000/month",
      duration: "5 months journey",
      highlight: "Reached 50,000+ people with health education",
      gradient: "from-teal-500 to-cyan-500",
      bgGradient: "from-teal-50 to-cyan-50",
    },
  ], []);

  const heroTiles = useMemo(() => [
    { icon: BookOpen, label: "Learn", sublabel: "Build Skills", gradient: "from-blue-500 to-blue-600", id: "learn" },
    { icon: IndianRupee, label: "Earn", sublabel: "Monetize Talents", gradient: "from-green-500 to-green-600", id: "earn" },
    { icon: TrendingUp, label: "Grow", sublabel: "Accelerate Career", gradient: "from-purple-500 to-purple-600", id: "grow" },
  ], []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section with CSS Animated Background */}
        <section className="relative bg-gradient-to-br from-primary/10 via-blue-50 to-green-50 py-24 overflow-hidden">
          {/* CSS Animated Floating Elements - No re-renders */}
          <div className="floating-orb floating-orb-1" aria-hidden="true" />
          <div className="floating-orb floating-orb-2" aria-hidden="true" />
          <div className="floating-orb floating-orb-3" aria-hidden="true" />
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <span 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-primary font-semibold text-sm mb-6 shadow-sm animate-fade-in-up"
            >
              <Sparkles className="h-4 w-4" />
              Your Journey Starts Here
            </span>
            
            <h1 
              className="text-4xl md:text-6xl font-heading font-bold text-slate-900 mb-6 animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              How{" "}
              <span className="bg-gradient-to-r from-primary via-blue-600 to-green-600 bg-clip-text text-transparent">
                Next Leap Pro
              </span>
              {" "}Works
            </h1>
            
            <p 
              className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              A trusted platform to{" "}
              <span className="font-semibold text-blue-600">learn new skills</span>,{" "}
              <span className="font-semibold text-green-600">earn through real opportunities</span>, and{" "}
              <span className="font-semibold text-purple-600">grow with a supportive community</span>.
            </p>
            
            <p 
              className="text-lg text-slate-500 max-w-2xl mx-auto italic mb-12 animate-fade-in-up"
              style={{ animationDelay: '400ms' }}
            >
              "A student wanting guidance, a professional wanting side income, or a retired person wanting to share wisdom — sabke liye ek hi jagah."
            </p>
            
            {/* Learn Earn Grow Visual */}
            <div 
              className="flex flex-wrap justify-center gap-4 md:gap-6 animate-fade-in-up"
              style={{ animationDelay: '500ms' }}
            >
              {heroTiles.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.label}: ${item.sublabel}`}
                    className="hero-tile flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-white/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                    data-testid={`hero-tile-${item.id}`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="font-heading font-bold text-xl text-slate-900">{item.label}</span>
                      <p className="text-sm text-slate-500">{item.sublabel}</p>
                    </div>
                    {index < 2 && (
                      <ChevronRight className="h-5 w-5 text-slate-300 hidden md:block ml-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Who Can Join Section */}
        <section className="py-24 bg-white relative">
          <div className="container mx-auto px-4">
            <AnimatedSection className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
                Everyone is Welcome
              </span>
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
                Who Can Join?
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Next Leap Pro welcomes everyone who wants to learn, share knowledge, and grow — no matter your background.
              </p>
            </AnimatedSection>
            
            <AnimatedSection>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {whoCanJoin.map((group, index) => (
                  <WhoCanJoinCard key={index} group={group} index={index} />
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Step-by-Step Journey */}
        <section className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(var(--primary-rgb),0.1)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <AnimatedSection className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-4">
                Simple 4-Step Process
              </span>
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
                Your Journey: Step by Step
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Follow these simple steps to start your journey of learning, earning, and growing.
              </p>
            </AnimatedSection>
            
            <AnimatedSection>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {journeySteps.map((step, index) => (
                  <JourneyStepCard 
                    key={index} 
                    step={step} 
                    index={index} 
                    isLast={index === journeySteps.length - 1} 
                  />
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Earning Paths Section */}
        <section className="py-24 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
          {/* CSS Animated Background */}
          <div className="floating-orb floating-orb-green" aria-hidden="true" />
          
          <div className="container mx-auto px-4 relative z-10">
            <AnimatedSection className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold text-sm mb-4">
                <IndianRupee className="h-4 w-4" />
                Multiple Ways to Earn
              </span>
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
                Explore Opportunities to Earn
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Whether you're a student, professional, or expert — there are multiple paths to start earning.
              </p>
            </AnimatedSection>
            
            <AnimatedSection>
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {earningPaths.map((path, index) => (
                  <EarningPathCard key={index} path={path} index={index} />
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Success Stories Section */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4">
            <AnimatedSection className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm mb-4">
                <Star className="h-4 w-4" />
                Real Success Stories
              </span>
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
                Transforming Lives Every Day
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Real journeys of people who used Next Leap Pro to transform their careers.
              </p>
            </AnimatedSection>
            
            <AnimatedSection>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {successStories.map((story, index) => (
                  <SuccessStoryCard key={index} story={story} index={index} />
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Subscription Benefits */}
        <section className="py-24 bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50 relative">
          <div className="container mx-auto px-4">
            <AnimatedSection className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4 transition-transform hover:scale-105">
                  <Crown className="h-4 w-4" />
                  Premium Benefits
                </span>
                <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
                  Unlock More with a Subscription
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Get premium access to tools that help you build, earn, and grow faster.
                </p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
                <div className="grid sm:grid-cols-2 gap-4">
                  {subscriptionBenefits.map((benefit, index) => (
                    <SubscriptionBenefitItem key={index} benefit={benefit} index={index} />
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Link href="/pricing">
                    <Button 
                      variant="gradient" 
                      size="lg" 
                      className="rounded-full px-10 h-14 text-lg shadow-xl transition-transform hover:scale-105" 
                      data-testid="button-view-pricing"
                    >
                      View Pricing Plans <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-r from-primary via-blue-600 to-purple-600 text-white relative overflow-hidden">
          {/* CSS Animated Background Elements */}
          <div className="floating-orb floating-orb-cta-1" aria-hidden="true" />
          <div className="floating-orb floating-orb-cta-2" aria-hidden="true" />
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <AnimatedSection>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-8 transition-transform hover:scale-110 hover:rotate-6">
                <Rocket className="h-10 w-10" />
              </div>
              
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
                Ready to Take Your Next Leap?
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
                Join thousands of students, professionals, and mentors who are learning, earning, and growing together.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/auth/register">
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="rounded-full px-10 text-lg h-14 shadow-xl transition-transform hover:scale-105" 
                    data-testid="button-join-now"
                  >
                    Join Next Leap Pro <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/events">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="rounded-full px-10 text-lg h-14 border-white text-white hover:bg-white/10 transition-transform hover:scale-105" 
                    data-testid="button-explore-events-cta"
                  >
                    Explore Events
                  </Button>
                </Link>
              </div>
              
              <p className="mt-10 text-white/70 text-lg italic">
                "Aapka agla kadam, aapki nayi shuruaat — Next Leap Pro ke saath."
              </p>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
