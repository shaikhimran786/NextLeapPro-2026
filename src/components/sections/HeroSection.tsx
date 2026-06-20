"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Star,
  Sparkles,
  CheckCircle,
  Users,
  TrendingUp,
  Award,
  Crown,
} from "@/lib/icons";
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

const DEFAULT_HERO_SUBTITLE =
  "Next Leap Pro brings together India's professionals, students, returning women, and independent founders with the mentors, communities, and real opportunities to learn new skills, earn from their expertise, and keep growing, whatever comes next.";

// Each persona maps to a real audience segment from the platform's own
// community stories, shown as Indian faces for an India-first audience so
// visitors can recognise themselves. Ordered as a career arc: first job to
// giving back as a mentor.
const personas = [
  {
    image: "/images/personas/persona-student.webp",
    segment: "Students & graduates",
    line: "Land your first role with workshops, mentors, and mock interviews.",
    alt: "A young Indian student from the Next Leap Pro community",
    icon: Sparkles,
    accent: "from-violet-500 to-purple-500",
    dot: "bg-violet-500",
  },
  {
    image: "/images/personas/persona-professional.webp",
    segment: "Professionals & career switchers",
    line: "Upskill, switch fields, or restart after a layoff or career break.",
    alt: "An Indian working professional changing careers on Next Leap Pro",
    icon: TrendingUp,
    accent: "from-blue-500 to-sky-500",
    dot: "bg-blue-500",
  },
  {
    image: "/images/personas/persona-coach.webp",
    segment: "Coaches, creators & founders",
    line: "Turn your expertise into a thriving practice and community.",
    alt: "An Indian coach and creator building a practice on Next Leap Pro",
    icon: Crown,
    accent: "from-pink-500 to-rose-500",
    dot: "bg-pink-500",
  },
  {
    image: "/images/personas/persona-mentor.webp",
    segment: "Mentors & industry experts",
    line: "Share what you know and guide the next generation of talent.",
    alt: "An Indian senior professional and mentor from the Next Leap Pro community",
    icon: Users,
    accent: "from-emerald-500 to-green-500",
    dot: "bg-emerald-500",
  },
];

const PERSONA_DURATION = 4000;

const stats = [
  { icon: CheckCircle, value: "95%+", label: "Completion rate", color: "text-violet-300" },
  { icon: Users, value: "60+", label: "Active members", color: "text-sky-300" },
  { icon: TrendingUp, value: "30%", label: "Faster referral hires", color: "text-emerald-300" },
  { icon: Award, value: "24/7", label: "Mentor access", color: "text-amber-300" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

export function HeroSection({ siteSettings }: HeroSectionProps) {
  const subtitle = siteSettings?.heroSubtitle || DEFAULT_HERO_SUBTITLE;
  const primaryCtaLabel = siteSettings?.heroCTA || "Start Your Next Leap";
  const customTitle = siteSettings?.heroTitle;
  const shouldReduceMotion = useReducedMotion();

  const [current, setCurrent] = useState(0);

  // Auto-advance the persona slider, but pause for reduced-motion users.
  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % personas.length);
    }, PERSONA_DURATION);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  const active = personas[current];

  return (
    <section
      className="relative overflow-hidden bg-slate-50"
      aria-label="Welcome to Next Leap Pro"
      data-testid="hero-section"
    >
      {/* Soft, warm background accents (decorative) */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/60 to-white" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-pink-300/20 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-0 sm:pt-16 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left: message + CTA */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-7"
          >
            <motion.div variants={itemVariants}>
              <Link
                href="/career"
                className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary shadow-sm transition-colors hover:border-primary/40"
                data-testid="badge-ai-career"
              >
                <Sparkles className="h-4 w-4" />
                AI Career Coach
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-heading text-3xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.9rem] xl:text-5xl"
            >
              {customTitle ? (
                customTitle
              ) : (
                <>
                  Your career is{" "}
                  <span className="bg-gradient-to-r from-primary via-pink-500 to-blue-600 bg-clip-text text-transparent">
                    bigger than any one job.
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8"
            >
              {subtitle}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link href="/auth/register" className="sm:w-auto">
                <Button
                  size="lg"
                  variant="gradient"
                  className="group w-full rounded-full px-8 py-4 text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 sm:w-auto"
                  data-testid="button-get-started"
                >
                  {primaryCtaLabel}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/communities" className="sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full border-slate-300 bg-white px-8 py-4 text-base font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
                  data-testid="button-explore-community"
                >
                  Join the Community
                </Button>
              </Link>
            </motion.div>

            <motion.p variants={itemVariants} className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Free signup to learn , earn and grow together.
            </motion.p>
          </motion.div>

          {/* Right: persona slider — every segment of the audience */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="relative mx-auto w-full max-w-sm lg:max-w-md"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/70 bg-slate-200 shadow-2xl shadow-slate-300/50 ring-1 ring-slate-900/5">
              {personas.map((persona, index) => (
                <Image
                  key={persona.image}
                  src={persona.image}
                  alt={index === current ? persona.alt : ""}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  className="object-cover object-top transition-opacity duration-700 ease-in-out"
                  style={{ opacity: index === current ? 1 : 0 }}
                  aria-hidden={index !== current}
                />
              ))}

              {/* Scrim for caption legibility */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/15 to-transparent"
                aria-hidden="true"
              />

              {/* Floating trust chip */}
              <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md backdrop-blur">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                Loved by learners, trainers, mentors & coaches
              </div>

              {/* Segment caption */}
              <div className="absolute inset-x-5 bottom-5" aria-live="polite">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${active.accent} px-3 py-1 text-xs font-bold text-white shadow`}
                >
                  <active.icon className="h-3.5 w-3.5" />
                  {active.segment}
                </span>
                <p className="mt-2 text-sm font-medium leading-6 text-white drop-shadow">
                  {active.line}
                </p>
              </div>
            </div>

            {/* Slider controls */}
            <div
              className="mt-5 flex items-center justify-center gap-2"
              role="tablist"
              aria-label="Who Next Leap Pro is for"
              data-testid="hero-persona-indicators"
            >
              {personas.map((persona, index) => (
                <button
                  key={persona.segment}
                  type="button"
                  role="tab"
                  aria-selected={index === current}
                  aria-label={persona.segment}
                  onClick={() => setCurrent(index)}
                  className={`h-2 rounded-full transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    index === current ? `w-8 ${persona.dot}` : "w-2 bg-slate-300 hover:bg-slate-400"
                  }`}
                  data-testid={`hero-persona-dot-${index}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="relative mt-12 sm:mt-16">
        <div className="bg-slate-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <dl className="grid grid-cols-2 divide-slate-700/60 py-6 sm:grid-cols-4 sm:divide-x">
              {stats.map(({ icon: Icon, value, label, color }) => (
                <div key={label} className="flex items-center justify-center gap-3 px-4 py-3">
                  <Icon className={`h-6 w-6 shrink-0 ${color}`} aria-hidden="true" />
                  <div>
                    <dt className="sr-only">{label}</dt>
                    <dd className="text-2xl font-bold leading-none text-white">{value}</dd>
                    <p className="mt-1 text-xs text-slate-300">{label}</p>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
