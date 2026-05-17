"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Star, Sparkles, Shield, CheckCircle, Users, TrendingUp, Award, Crown } from "@/lib/icons";
import { HeroTitleTyping } from "@/components/sections/HeroTitle";
import type { HeroAnimationConfig, HeroGradientsConfig } from "@/components/sections/HeroTitle";

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

const storyPhases = [
  {
    video: "/videos/hero-clip-2-learning.mp4",
    overlay: "Every great career starts with learning.",
    subtext: "From campus to career — your journey begins here.",
    icon: "🎓",
    phase: "student" as const,
  },
  {
    video: "/videos/hero-clip-1-struggle.mp4",
    overlay: "Jobs are uncertain. Skills are not.",
    subtext: "Layoffs happen. But your skills and community never leave you.",
    icon: "💼",
    phase: "struggle" as const,
  },
  {
    video: "/videos/hero-clip-3-community.mp4",
    overlay: "Turn your skills into real income.",
    subtext: "Freelance, mentor, consult — earn from what you know.",
    icon: "💰",
    phase: "earner" as const,
  },
  {
    video: "/videos/hero-clip-4-empowerment.mp4",
    overlay: "Lead. Guide. Inspire others.",
    subtext: "From learner to mentor — this is your full circle growth.",
    icon: "🚀",
    phase: "mentor" as const,
  },
];

const PHASE_DURATION = 6000;

const uniqueVideos = Array.from(new Set(storyPhases.map(p => p.video)));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const }
  }
};

const DEFAULT_HERO_TITLE = "Your career is bigger than one company.";

export function HeroSection({ siteSettings }: HeroSectionProps) {
  const title = siteSettings?.heroTitle || DEFAULT_HERO_TITLE;
  const subtitle =
    siteSettings?.heroSubtitle ||
    "Learn in-demand skills. Earn from real opportunities. Grow with a powerful community.";

  const bgVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [currentPhase, setCurrentPhase] = useState(0);
  const tryPlayVideo = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    if (video.paused) {
      video.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handlers: { video: HTMLVideoElement; handler: () => void }[] = [];
    uniqueVideos.forEach((_, i) => {
      const video = bgVideoRefs.current[i];
      if (video) {
        video.muted = true;
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        video.load();
        const handler = () => tryPlayVideo(video);
        video.addEventListener("canplay", handler);
        handlers.push({ video, handler });
        tryPlayVideo(video);
      }
    });
    return () => {
      handlers.forEach(({ video, handler }) => {
        video.removeEventListener("canplay", handler);
      });
    };
  }, [tryPlayVideo]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % storyPhases.length);
    }, PHASE_DURATION);
    return () => clearInterval(interval);
  }, []);

  const currentStory = storyPhases[currentPhase];

  return (
    <section
      className="relative min-h-screen overflow-hidden -mt-16 md:-mt-18 lg:-mt-20"
      aria-label="Hero section - Welcome to Next Leap Pro"
      data-testid="hero-section"
    >
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {uniqueVideos.map((videoSrc, index) => (
          <video
            key={videoSrc}
            ref={(el) => {
              bgVideoRefs.current[index] = el;
            }}
            autoPlay
            loop
            muted
            playsInline
            preload={index === 0 ? "auto" : "metadata"}
            poster={index === 0 ? "/images/hero/hero-promo-poster.png" : undefined}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: currentStory.video === videoSrc ? 1 : 0 }}
            src={videoSrc}
            aria-hidden="true"
            suppressHydrationWarning
          />
        ))}

        <div className="absolute inset-0 bg-slate-950/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_30%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_28%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-slate-950 to-transparent" />
      </div>

      <div className="absolute inset-0 opacity-[0.02] z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2" data-testid="hero-phase-indicators">
        {storyPhases.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPhase(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === currentPhase
                ? "w-8 bg-white"
                : "w-2 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to story phase ${index + 1}`}
            data-testid={`hero-phase-dot-${index}`}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-center">
          <motion.div variants={containerVariants} initial={false} animate="visible" className="space-y-8">
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-200">
                Executive growth ecosystem
              </span>
              <Link
                href="/career"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white transition-all duration-200 hover:border-primary/40 hover:bg-slate-900"
                data-testid="badge-ai-career"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                AI Career Coach
                <ArrowRight className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="max-w-4xl">
              <h1 className="hero-title-stable text-3xl sm:text-4xl md:text-5xl lg:text-[3.75rem] xl:text-5xl font-heading font-semibold tracking-tight leading-[1.1] text-white line-clamp-4">
                <HeroTitleTyping text={title} className="hero-title-typing-wrapper" />
              </h1>
            </motion.div>

            <motion.p variants={itemVariants} className="max-w-2xl text-base sm:text-lg text-slate-300 leading-8">
              {subtitle}
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="gradient"
                  className="w-full sm:w-auto rounded-full px-10 py-4 text-base font-semibold shadow-2xl shadow-primary/20 transition-all duration-300 hover:shadow-[0_25px_70px_-20px_rgba(56,189,248,0.65)]"
                  data-testid="button-get-started"
                >
                  Start Your Next Leap
                </Button>
              </Link>
              <Link href="/events">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-10 py-4 text-base text-white border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10"
                  data-testid="button-explore-events"
                >
                  Join the Community
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 gap-y-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Crown className="h-5 w-5 text-amber-300" />
                  </div>
                  <p className="self-center text-xs sm:text-sm uppercase tracking-[0.22em] sm:tracking-[0.26em] font-semibold text-amber-300">
                    Leadership-ready
                  </p>
                  <p className="col-span-2 text-base font-medium leading-6 text-white">
                    Designed for senior teams and Startup founders.
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 gap-y-3">
                  <div className="h-9 w-9 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-cyan-300" />
                  </div>
                  <p className="self-center text-xs sm:text-sm uppercase tracking-[0.22em] sm:tracking-[0.26em] font-semibold text-cyan-300">
                    Mentor ecosystem
                  </p>
                  <p className="col-span-2 text-base font-medium leading-6 text-white">
                    Verified advisors, peers, and partners.
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 gap-y-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-blue-300" />
                  </div>
                  <p className="self-center text-xs sm:text-sm uppercase tracking-[0.22em] sm:tracking-[0.26em] font-semibold text-blue-300">
                    Enterprise scale
                  </p>
                  <p className="col-span-2 text-base font-medium leading-6 text-white">
                    Secure networks for collaboration.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="relative isolate rounded-[2.5rem] border border-white/10 bg-slate-950/85 p-6 shadow-2xl shadow-slate-950/30 ring-1 ring-white/10 backdrop-blur-xl">
            <div className="absolute -inset-x-4 -top-8 blur-3xl bg-primary/10" aria-hidden="true" />
            <div className="relative space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-[0.32em] font-semibold text-primary">Enterprise trust</p>
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">A refined platform for modern professionals.</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  <Shield className="h-3 w-3" />
                  Verified network
                </div>
              </div>

              <p className="text-sm text-slate-200">
                A professional ecosystem built for leadership, innovation, mentorship, and trusted collaboration across teams and enterprises.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] font-bold text-cyan-300">Completion</p>
                      <p className="mt-2 text-2xl font-semibold text-white">95%+</p>
                      <p className="text-xs text-slate-300 mt-1">completion rate</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] font-bold text-blue-200">Community scale</p>
                      <p className="mt-2 text-2xl font-semibold text-white">120+</p>
                      <p className="text-xs text-slate-300 mt-1">active communities</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] font-bold text-cyan-200">Placement speed</p>
                      <p className="mt-2 text-2xl font-semibold text-white">30%</p>
                      <p className="text-xs text-slate-300 mt-1">faster referral hires</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] font-bold text-amber-200">Mentor access</p>
                      <p className="mt-2 text-2xl font-semibold text-white">24/7</p>
                      <p className="text-xs text-slate-300 mt-1">expert guidance</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <span className="font-semibold text-white">Focus:</span> {currentStory.overlay}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm text-slate-200">
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 inline-flex items-center gap-2 font-medium text-white">
            <Sparkles className="h-4 w-4 text-amber-300" />
            Leadership community
          </span>
          <span className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 inline-flex items-center gap-2 font-medium text-white">
            <Star className="h-4 w-4 text-cyan-300" />
            Trusted mentor ecosystem
          </span>
          <span className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 inline-flex items-center gap-2 font-medium text-white">
            <Shield className="h-4 w-4 text-emerald-300" />
            Secure collaboration
          </span>
        </div>
      </div>
    </section>
  );
}
