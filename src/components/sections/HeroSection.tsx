"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Star, Sparkles } from "@/lib/icons";
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

const DEFAULT_HERO_TITLE = "The Career Ecosystem for Every Stage of Growth";

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
      className="relative min-h-screen flex items-center overflow-hidden -mt-16 md:-mt-[4.5rem] lg:-mt-20"
      aria-label="Hero section - Welcome to Next Leap Pro"
      data-testid="hero-section"
    >
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {uniqueVideos.map((videoSrc, index) => (
          <video
            key={videoSrc}
            ref={(el) => { bgVideoRefs.current[index] = el; }}
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/8 via-transparent to-transparent" />
      </div>

      <div className="absolute inset-0 opacity-[0.02] z-[1]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-10 sm:py-14 lg:py-0 pt-20 sm:pt-24 lg:pt-28">
        <div className="flex flex-col items-center">

          <motion.div
            variants={containerVariants}
            initial={false}
            animate="visible"
            className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-7 text-center"
          >

            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2.5 justify-center">
              <Link
                href="/career"
                className="group inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] hover:border-primary/40 hover:bg-primary/10 transition-all text-xs sm:text-sm backdrop-blur-sm"
                data-testid="badge-ai-career"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-white/90">AI Career Coach</span>
                <ArrowRight className="h-3 w-3 text-white/50 group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
              </Link>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-purple-500/15 border border-white/[0.1] text-xs sm:text-sm font-medium text-white/80 backdrop-blur-sm" data-testid="badge-ecosystem">
                No One Grows Alone
              </span>
            </motion.div>

            <motion.div variants={itemVariants} className="w-full flex justify-center">
              <h1 className="hero-title-stable w-full max-w-4xl text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-heading font-bold leading-[1.08] tracking-tight text-white">
                <HeroTitleTyping
                  text={title}
                  className="hero-title-typing-wrapper text-center"
                />
              </h1>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-xl leading-relaxed mx-auto"
            >
              {subtitle}
            </motion.p>

            <motion.div variants={itemVariants}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhase}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-1.5"
                >
                  <div
                    className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] backdrop-blur-md"
                    data-testid="hero-overlay-message"
                  >
                    <span className="text-lg">{currentStory.icon}</span>
                    <span className="text-sm sm:text-base font-semibold text-white/95 italic">
                      &ldquo;{currentStory.overlay}&rdquo;
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/50 pl-1" data-testid="hero-overlay-subtext">
                    {currentStory.subtext}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="gradient"
                  className="w-full sm:w-auto rounded-full px-10 text-base h-13 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:scale-[1.02] transition-all font-semibold"
                  data-testid="button-get-started"
                >
                  Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/events">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-8 text-base h-13 border-white/20 text-white hover:bg-white/10 hover:border-white/30 bg-white/[0.05] backdrop-blur-sm font-medium"
                  data-testid="button-explore-events"
                >
                  Explore Opportunities
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-5 justify-center pt-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {[
                    { src: "/images/personas/avatar-1.png", alt: "Member" },
                    { src: "/images/personas/avatar-2.png", alt: "Member" },
                    { src: "/images/personas/avatar-3.png", alt: "Member" },
                    { src: "/images/personas/avatar-4.png", alt: "Member" },
                  ].map((avatar, i) => (
                    <div
                      key={i}
                      className="h-9 w-9 rounded-full border-2 border-black/40 shadow-sm ring-1 ring-white/20 overflow-hidden"
                    >
                      <Image
                        src={avatar.src}
                        alt={avatar.alt}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  <div className="h-9 w-9 rounded-full border-2 border-black/30 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-1 ring-white/15">
                    +9k
                  </div>
                </div>
                <span className="text-sm font-medium text-white/75">Active Learners</span>
              </div>
              <div className="h-8 w-px bg-white/15 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-sm">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-semibold text-white/90">4.9</span>
                <span className="text-white/50">from 2,500+ reviews</span>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
