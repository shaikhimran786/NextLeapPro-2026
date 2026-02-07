"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Users, IndianRupee, Star } from "@/lib/icons";
import { HeroTitle, HeroAnimationConfig, HeroGradientsConfig } from "@/components/sections/HeroTitle";

interface SiteSettings {
  heroTitle?: string;
  heroSubtitle?: string;
  heroCTA?: string;
  heroImage?: string | null;
  heroAnimation?: HeroAnimationConfig | null;
  heroGradients?: HeroGradientsConfig | null;
}

interface HeroSectionProps {
  siteSettings?: SiteSettings | null;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export function HeroSection({ siteSettings }: HeroSectionProps) {
  const title = siteSettings?.heroTitle || "Learn. Earn. And Grow.";
  const subtitle =
    siteSettings?.heroSubtitle ||
    "The platform for students and professionals to master new skills, monetize their talents, and accelerate their career growth through community and events.";
  const cta = siteSettings?.heroCTA || "Get Started";

  // Avatar placeholders for social proof
  const avatars = [1, 2, 3, 4];

  return (
    <section className="relative pt-16 pb-24 md:pt-20 md:pb-32 overflow-hidden" aria-label="Hero section - Welcome to Next Leap Pro">
      <div className="container mx-auto px-4">
        {/* Announcement Badge */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center lg:justify-start mb-8"
        >
          <Link
            href="/career"
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-pink-500/10 border border-primary/20 hover:border-primary/40 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-2 w-2 rounded-full bg-primary opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-sm font-medium text-slate-700">New: AI Career Coach</span>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial={false}
            animate="visible"
            className="lg:w-1/2 space-y-6 z-10 text-center lg:text-left"
          >
            <motion.div variants={itemVariants}>
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
                The Ultimate Career Ecosystem
              </span>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-[1.1] tracking-tight">
                <span className="text-slate-900">The platform to </span>
                <span className="text-gradient-animated">Learn. Earn. Grow.</span>
              </h1>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed mx-auto lg:mx-0"
            >
              {subtitle}
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="gradient"
                  className="rounded-full px-8 text-lg h-12 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  data-testid="button-get-started"
                >
                  {cta} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/events">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 text-lg h-12"
                  data-testid="button-explore-events"
                >
                  Explore Events
                </Button>
              </Link>
            </motion.div>

            {/* Social Proof Section */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center gap-6 pt-6 justify-center lg:justify-start"
            >
              {/* Avatar Stack */}
              <div className="flex -space-x-3">
                {avatars.map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-slate-200 to-slate-300 shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][i]} 0%, ${['#ee5a24', '#009688', '#0077b6', '#52c41a'][i]} 100%)`
                    }}
                  />
                ))}
                <div className="h-10 w-10 rounded-full border-2 border-white bg-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  +9k
                </div>
              </div>

              {/* Rating */}
              <div className="text-sm">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 font-semibold text-slate-900">4.9</span>
                </div>
                <p className="text-slate-500">from 2,500+ reviews</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Hero Image */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="relative">
              {/* Main Image */}
              <motion.div
                className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-xl md:shadow-2xl border-4 md:border-8 border-white"
                initial={{ rotate: 2 }}
                whileHover={{ rotate: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="relative h-[280px] sm:h-[350px] md:h-[400px] lg:h-[480px] w-full">
                  <Image
                    src={siteSettings?.heroImage || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800"}
                    alt="Diverse group of students and professionals collaborating on learning projects at Next Leap Pro"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Overlay Content */}
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-bold">10k+ Members</span>
                  </div>
                  <p className="text-white/80 text-sm md:text-base">
                    Join the fastest growing career community.
                  </p>
                </div>
              </motion.div>

              {/* Floating Earnings Card */}
              <motion.div
                className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-white rounded-xl md:rounded-2xl p-3 md:p-4 shadow-xl border border-slate-100 z-20 hidden sm:block"
                initial={false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-slate-900">₹1,04,500</p>
                    <p className="text-xs md:text-sm text-slate-500">earned this month</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating Members Card */}
              <motion.div
                className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-white rounded-xl md:rounded-2xl p-2.5 md:p-3 shadow-xl border border-slate-100 z-20 hidden sm:block"
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <span className="font-semibold text-sm md:text-base text-slate-900">10k+ members</span>
                </div>
              </motion.div>

              {/* Animated Badge - Workshop */}
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute top-1/4 -left-8 md:-left-12 bg-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl shadow-lg z-20 hidden md:block"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs md:text-sm font-medium text-slate-700">Live Workshop</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-primary/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-500/5 blur-3xl rounded-full pointer-events-none hidden lg:block" />
    </section>
  );
}
