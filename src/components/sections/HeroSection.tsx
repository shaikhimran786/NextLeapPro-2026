"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Users, IndianRupee, Star, Sparkles, TrendingUp, BookOpen } from "@/lib/icons";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
};

export function HeroSection({ siteSettings }: HeroSectionProps) {
  const subtitle =
    siteSettings?.heroSubtitle ||
    "A powerful ecosystem built for students and professionals to gain in-demand skills, convert their talents into real earning opportunities, and accelerate career growth through structured learning, expert guidance, and a strong, opportunity-driven community.";
  const cta = siteSettings?.heroCTA || "Get Started";

  const videoRef = useRef<HTMLVideoElement>(null);

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
    video.addEventListener("loadedmetadata", tryPlay);

    return () => {
      video.removeEventListener("canplay", tryPlay);
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("loadedmetadata", tryPlay);
    };
  }, []);

  return (
    <section
      className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden"
      aria-label="Hero section - Welcome to Next Leap Pro"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent" />

      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-8 sm:py-10 lg:py-0">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-12 xl:gap-20">

          <motion.div
            variants={containerVariants}
            initial={false}
            animate="visible"
            className="lg:w-[55%] xl:w-1/2 space-y-5 sm:space-y-6 text-center lg:text-left"
          >
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2.5 justify-center lg:justify-start">
              <Link
                href="/career"
                className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] hover:border-primary/40 hover:bg-primary/10 transition-all text-xs sm:text-sm backdrop-blur-sm"
                data-testid="badge-ai-career"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-white/90">New: AI Career Coach</span>
                <ArrowRight className="h-3 w-3 text-white/50 group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
              </Link>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-purple-500/15 border border-white/[0.1] text-xs sm:text-sm font-medium text-white/80 backdrop-blur-sm" data-testid="badge-ecosystem">
                The Ultimate Career Ecosystem
              </span>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-heading font-bold leading-[1.08] tracking-tight">
                <span className="text-white">The platform to </span>
                <br className="hidden sm:block" />
                <span className="text-gradient-animated">Learn. Earn. Grow.</span>
              </h1>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-xl leading-relaxed mx-auto lg:mx-0"
            >
              {subtitle}
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="gradient"
                  className="w-full sm:w-auto rounded-full px-8 text-base h-12 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:scale-[1.02] transition-all"
                  data-testid="button-get-started"
                >
                  {cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/events">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-8 text-base h-12 border-white/20 text-white hover:bg-white/10 hover:border-white/30 bg-white/[0.05] backdrop-blur-sm"
                  data-testid="button-explore-events"
                >
                  Explore Events
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-5 justify-center lg:justify-start pt-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-9 w-9 rounded-full border-2 border-slate-900 shadow-sm ring-1 ring-white/10"
                      style={{
                        background: `linear-gradient(135deg, ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][i]}, ${['#ee5a24', '#009688', '#0077b6', '#52c41a'][i]})`
                      }}
                    />
                  ))}
                  <div className="h-9 w-9 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-1 ring-white/10">
                    +9k
                  </div>
                </div>
                <span className="text-sm font-medium text-white/70">Active Learners</span>
              </div>
              <div className="h-8 w-px bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-sm">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-semibold text-white/90">4.9</span>
                <span className="text-slate-500">from 2,500+ reviews</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="w-full lg:w-[45%] xl:w-1/2 relative hidden sm:block"
            data-testid="hero-video-container"
          >
            <div className="relative lg:pl-4 xl:pl-8">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-white/[0.08] group">
                <div className="relative aspect-[16/10] w-full bg-slate-900">
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
                    suppressHydrationWarning
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />
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
