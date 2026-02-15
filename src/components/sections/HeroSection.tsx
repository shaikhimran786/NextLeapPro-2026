"use client";

import { useRef, useEffect, useState, useCallback } from "react";
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

const storyPhases = [
  {
    video: "/videos/hero-clip-1-struggle.mp4",
    overlay: "Laid off, but not left behind.",
    subtext: "In today's uncertain job market, one email can change everything.",
    icon: "💪",
    phase: "struggle" as const,
  },
  {
    video: "/videos/hero-clip-2-learning.mp4",
    overlay: "Upgrade your skills.",
    subtext: "Learn new in-demand skills from industry experts.",
    icon: "📚",
    phase: "learning" as const,
  },
  {
    video: "/videos/hero-clip-3-community.mp4",
    overlay: "Monetize your expertise.",
    subtext: "Earn from your talents through micro-gigs and mentoring.",
    icon: "💰",
    phase: "community" as const,
  },
  {
    video: "/videos/hero-clip-4-empowerment.mp4",
    overlay: "Learn. Earn. Grow.",
    subtext: "Grow with a powerful community that lifts you up.",
    icon: "🚀",
    phase: "empowerment" as const,
  },
  {
    video: "/videos/hero-clip-4-empowerment.mp4",
    overlay: "A Community That Lifts You Up.",
    subtext: "You don't have to grow alone. Build skills. Build income. Build confidence.",
    icon: "🤝",
    phase: "empowerment" as const,
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

export function HeroSection({ siteSettings }: HeroSectionProps) {
  const subtitle =
    siteSettings?.heroSubtitle ||
    "Join thousands of professionals who turned career setbacks into comebacks. Learn in-demand skills, monetize your expertise, and grow with a community that has your back.";
  const cta = siteSettings?.heroCTA || "Join the Community";

  const bgVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const cardVideoRef = useRef<HTMLVideoElement>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [logoRevealed, setLogoRevealed] = useState(false);

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
    const timer = setTimeout(() => setLogoRevealed(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    uniqueVideos.forEach((_, i) => {
      const video = bgVideoRefs.current[i];
      if (video) {
        video.muted = true;
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        video.load();
        const handler = () => tryPlayVideo(video);
        video.addEventListener("canplay", handler);
        tryPlayVideo(video);
      }
    });
  }, [tryPlayVideo]);

  useEffect(() => {
    const cardVideo = cardVideoRef.current;
    if (cardVideo) {
      cardVideo.muted = true;
      cardVideo.setAttribute("muted", "");
      cardVideo.setAttribute("playsinline", "");
      cardVideo.src = storyPhases[currentPhase].video;
      cardVideo.load();
      tryPlayVideo(cardVideo);
    }
  }, [currentPhase, tryPlayVideo]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % storyPhases.length);
    }, PHASE_DURATION);
    return () => clearInterval(interval);
  }, []);

  const currentStory = storyPhases[currentPhase];

  return (
    <section
      className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden"
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

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50" />
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-10 sm:py-14 lg:py-0">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 xl:gap-24">

          <motion.div
            variants={containerVariants}
            initial={false}
            animate="visible"
            className="lg:w-[55%] xl:w-[52%] space-y-6 sm:space-y-7 text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={logoRevealed ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <Image
                src="/logos/nlp-logo-white.png"
                alt="Next Leap Pro"
                width={280}
                height={70}
                className="h-14 sm:h-16 lg:h-[72px] w-auto mx-auto lg:mx-0 drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
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
                    ref={cardVideoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster="/images/hero/hero-promo-poster.png"
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                    data-testid="hero-video-card"
                    src={storyPhases[0].video}
                    suppressHydrationWarning
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15 pointer-events-none" />

                  <motion.div
                    className="absolute top-4 left-4 z-10"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                  >
                    <Image
                      src="/logos/nlp-icon-white.png"
                      alt="NextLeapPro"
                      width={48}
                      height={48}
                      className="h-10 w-10 rounded-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                    />
                  </motion.div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`card-${currentPhase}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.7 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className="bg-black/45 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/10 max-w-[85%]">
                        <p className="text-white font-bold text-sm sm:text-base lg:text-lg text-center drop-shadow-md">
                          {currentStory.overlay}
                        </p>
                        <p className="text-white/60 text-xs sm:text-sm text-center mt-1">
                          {currentStory.subtext}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="absolute top-4 right-4 z-10 flex gap-1">
                    {storyPhases.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-500 ${
                          i === currentPhase ? "w-5 bg-white" : "w-1.5 bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
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
