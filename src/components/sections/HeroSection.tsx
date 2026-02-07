"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users, IndianRupee, Star } from "@/lib/icons";
import { HeroTitle, HeroAnimationConfig, HeroGradientsConfig } from "@/components/sections/HeroTitle";

const heroSlides = [
  {
    src: "/images/hero/hero-learn.jpg",
    alt: "Students and professionals engaged in a collaborative learning workshop",
    label: "Learn",
  },
  {
    src: "/images/hero/hero-earn.jpg",
    alt: "Professional working on laptop, building skills and earning opportunities",
    label: "Earn",
  },
  {
    src: "/images/hero/hero-grow.jpg",
    alt: "Team celebrating success and career growth together",
    label: "Grow",
  },
];

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
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const }
  }
};

export function HeroSection({ siteSettings }: HeroSectionProps) {
  const subtitle =
    siteSettings?.heroSubtitle ||
    "A powerful ecosystem built for students and professionals to gain in-demand skills, convert their talents into real earning opportunities, and accelerate career growth through structured learning, expert guidance, and a strong, opportunity-driven community.";
  const cta = siteSettings?.heroCTA || "Get Started";

  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section
      className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden"
      aria-label="Hero section - Welcome to Next Leap Pro"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-primary/[0.03]" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/[0.04] to-transparent hidden lg:block" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-6 sm:py-8 lg:py-0">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">

          <motion.div
            variants={containerVariants}
            initial={false}
            animate="visible"
            className="lg:w-[55%] xl:w-1/2 space-y-4 sm:space-y-5 text-center lg:text-left"
          >
            <motion.div variants={itemVariants} className="flex justify-center lg:justify-start">
              <Link
                href="/career"
                className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/[0.06] border border-primary/15 hover:border-primary/30 transition-all text-xs sm:text-sm"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute h-1.5 w-1.5 rounded-full bg-primary opacity-75" />
                  <span className="relative rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                <span className="font-medium text-slate-700">New: AI Career Coach</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl font-heading font-bold leading-[1.1] tracking-tight">
                <span className="text-slate-900">The platform to </span>
                <span className="text-gradient-animated">Learn. Earn. Grow.</span>
              </h1>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base lg:text-lg text-slate-500 max-w-xl leading-relaxed mx-auto lg:mx-0"
            >
              {subtitle}
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="gradient"
                  className="w-full sm:w-auto rounded-full px-7 text-base h-11 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all"
                  data-testid="button-get-started"
                >
                  {cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/events">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-7 text-base h-11 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  data-testid="button-explore-events"
                >
                  Explore Events
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-4 sm:gap-5 justify-center lg:justify-start pt-2 sm:pt-3"
            >
              <div className="flex -space-x-2.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][i]}, ${['#ee5a24', '#009688', '#0077b6', '#52c41a'][i]})`
                    }}
                  />
                ))}
                <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                  +9k
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-sm">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-semibold text-slate-800">4.9</span>
                <span className="text-slate-400">from 2,500+ reviews</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="w-full lg:w-[45%] xl:w-1/2 relative hidden sm:block"
            data-testid="hero-image-slider"
          >
            <div className="relative lg:pl-4 xl:pl-8">
              <motion.div
                className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200/60"
                initial={{ rotate: 1 }}
                whileHover={{ rotate: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative aspect-[4/3] lg:aspect-[16/11] w-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={heroSlides[currentSlide].src}
                        alt={heroSlides[currentSlide].alt}
                        fill
                        className="object-cover"
                        priority={currentSlide === 0}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

                <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 z-10">
                  <div className="flex items-center gap-2 text-white">
                    <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">10k+ Members</p>
                      <p className="text-white/70 text-xs">Join the community</p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 flex gap-1.5 z-10">
                  {heroSlides.map((slide, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentSlide
                          ? "w-6 bg-white"
                          : "w-1.5 bg-white/50 hover:bg-white/70"
                      }`}
                      aria-label={`Go to slide: ${slide.label}`}
                      data-testid={`slider-dot-${idx}`}
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-3 -left-3 lg:-bottom-4 lg:-left-2 bg-white rounded-xl p-3 shadow-lg shadow-slate-900/8 border border-slate-100 z-20"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <IndianRupee className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 leading-tight">&#8377;1,04,500</p>
                    <p className="text-[11px] text-slate-500">earned this month</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -top-3 -right-3 lg:-top-4 lg:-right-2 bg-white rounded-xl p-2.5 shadow-lg shadow-slate-900/8 border border-slate-100 z-20"
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-semibold text-xs text-slate-800">10k+ members</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute top-1/3 -left-6 bg-white px-3 py-2 rounded-lg shadow-md border border-slate-100 z-20 hidden lg:block"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-slate-600">Live Workshop</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-primary/[0.04] blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-purple-500/[0.03] blur-3xl rounded-full pointer-events-none" />
    </section>
  );
}
