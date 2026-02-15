"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users, IndianRupee, Star, Sparkles, TrendingUp, BookOpen, Play } from "@/lib/icons";
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

const overlayMessages = [
  { text: "Laid off, but not left behind.", icon: "💪" },
  { text: "Upgrade your skills.", icon: "📚" },
  { text: "Monetize your expertise.", icon: "💰" },
  { text: "Learn. Earn. Grow.", icon: "🚀" },
  { text: "A Community That Lifts You Up.", icon: "🤝" },
];

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

export function HeroSection({ siteSettings }: HeroSectionProps) {
  const subtitle =
    siteSettings?.heroSubtitle ||
    "Join thousands of professionals who turned career setbacks into comebacks. Learn in-demand skills, monetize your expertise, and grow with a community that has your back.";
  const cta = siteSettings?.heroCTA || "Start Your Comeback";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentOverlay, setCurrentOverlay] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");

    const tryPlay = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };

    video.load();
    tryPlay();

    video.addEventListener("canplay", tryPlay);
    video.addEventListener("loadeddata", tryPlay);

    return () => {
      video.removeEventListener("canplay", tryPlay);
      video.removeEventListener("loadeddata", tryPlay);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOverlay((prev) => (prev + 1) % overlayMessages.length);
    }, 3000);

    const handleVisibility = () => {
      if (document.hidden) return;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <section
      className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden"
      aria-label="Hero section - Welcome to Next Leap Pro"
      data-testid="hero-section"
    >
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/images/hero/hero-promo-poster.png"
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="hero-video"
          src="/videos/hero-promo.mp4"
          aria-hidden="true"
          suppressHydrationWarning
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/8 via-transparent to-transparent" />
      </div>

      <div className="absolute inset-0 opacity-[0.02] z-[1]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-10 sm:py-14 lg:py-0">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 xl:gap-24">

          <motion.div
            variants={containerVariants}
            initial={false}
            animate="visible"
            className="lg:w-[55%] xl:w-[52%] space-y-6 sm:space-y-7 text-center lg:text-left"
          >
            <motion.div variants={itemVariants}>
              <Image
                src="/logos/nlp-logo-white.png"
                alt="Next Leap Pro"
                width={280}
                height={70}
                className="h-12 sm:h-14 lg:h-16 w-auto mx-auto lg:mx-0 drop-shadow-lg"
                priority
                data-testid="hero-logo"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2.5 justify-center lg:justify-start">
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

            <motion.div variants={itemVariants}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-heading font-bold leading-[1.08] tracking-tight">
                <span className="text-white">Your Career Setback</span>
                <br />
                <span className="text-white">Is Your </span>
                <span className="text-gradient-animated">Comeback Story</span>
              </h1>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-xl leading-relaxed mx-auto lg:mx-0"
            >
              {subtitle}
            </motion.p>

            <motion.div variants={itemVariants}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentOverlay}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] backdrop-blur-md"
                  data-testid="hero-overlay-message"
                >
                  <span className="text-lg">{overlayMessages[currentOverlay].icon}</span>
                  <span className="text-sm sm:text-base font-semibold text-white/95 italic">
                    &ldquo;{overlayMessages[currentOverlay].text}&rdquo;
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="gradient"
                  className="w-full sm:w-auto rounded-full px-10 text-base h-13 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:scale-[1.02] transition-all font-semibold"
                  data-testid="button-get-started"
                >
                  {cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/events">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-8 text-base h-13 border-white/20 text-white hover:bg-white/10 hover:border-white/30 bg-white/[0.05] backdrop-blur-sm font-medium"
                  data-testid="button-explore-events"
                >
                  <Play className="mr-2 h-4 w-4" /> Explore Events
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-5 justify-center lg:justify-start pt-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-9 w-9 rounded-full border-2 border-black/30 shadow-sm ring-1 ring-white/15"
                      style={{
                        background: `linear-gradient(135deg, ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][i]}, ${['#ee5a24', '#009688', '#0077b6', '#52c41a'][i]})`
                      }}
                    />
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

          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="w-full lg:w-[45%] xl:w-[48%] relative hidden sm:block"
            data-testid="hero-video-container"
          >
            <div className="relative lg:pl-4 xl:pl-8">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/[0.08] group">
                <div className="relative aspect-[16/10] w-full bg-black/50 backdrop-blur-sm">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster="/images/hero/hero-promo-poster.png"
                    className="absolute inset-0 w-full h-full object-cover"
                    data-testid="hero-video-card"
                    src="/videos/hero-promo.mp4"
                    suppressHydrationWarning
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15 pointer-events-none" />

                  <div className="absolute top-4 left-4 z-10">
                    <Image
                      src="/logos/nlp-icon-white.png"
                      alt="NLP"
                      width={48}
                      height={48}
                      className="h-10 w-10 rounded-lg drop-shadow-md"
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`card-${currentOverlay}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className="bg-black/40 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/10">
                        <p className="text-white font-bold text-sm sm:text-base lg:text-lg text-center drop-shadow-md">
                          {overlayMessages[currentOverlay].text}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/10">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-white">10k+ Members</p>
                        <p className="text-white/60 text-xs">Join the community</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-medium text-white/70">Live</span>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                className="absolute -bottom-4 -left-2 lg:-bottom-5 lg:-left-4 bg-white/[0.95] backdrop-blur-xl rounded-2xl p-3.5 shadow-xl shadow-black/10 border border-white/60 z-20"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
                    <IndianRupee className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 leading-tight">&#8377;1,04,500</p>
                    <p className="text-[11px] text-slate-500 font-medium">Earned this month</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -top-4 -right-2 lg:-top-5 lg:-right-4 bg-white/[0.95] backdrop-blur-xl rounded-2xl p-3 shadow-xl shadow-black/10 border border-white/60 z-20"
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-md shadow-primary/30">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">85% Placement</p>
                    <p className="text-[10px] text-slate-500 font-medium">Success rate</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-1/3 -left-6 lg:-left-8 bg-white/[0.95] backdrop-blur-xl px-3.5 py-2.5 rounded-xl shadow-lg shadow-black/8 border border-white/60 z-20 hidden lg:flex items-center gap-2.5"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">500+ Courses</p>
                  <p className="text-[10px] text-slate-500">Expert-led content</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
