"use client";

import { useState, useEffect, useCallback } from "react";
import { Quote, Star, ChevronLeft, ChevronRight, Sparkles } from "@/lib/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  persona: "student" | "mentor" | "coach" | "trainer" | "professional";
  avatar?: string;
  content: string;
  rating: number;
}

function getDiceBearAvatar(name: string): string {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent`;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Priya Sharma",
    role: "Computer Science Student",
    persona: "student",
    avatar: getDiceBearAvatar("Priya Sharma"),
    content: "Next Leap Pro helped me land my first internship! The workshops on resume building and mock interviews were exactly what I needed. The community support is incredible.",
    rating: 5,
  },
  {
    id: 2,
    name: "Rajesh Kumar",
    role: "Senior Software Engineer & Mentor",
    persona: "mentor",
    avatar: getDiceBearAvatar("Rajesh Kumar"),
    content: "As a mentor, I love how easy it is to connect with eager learners. The platform's event management tools make hosting sessions seamless. Highly recommend for anyone looking to give back.",
    rating: 5,
  },
  {
    id: 3,
    name: "Ananya Patel",
    role: "Career Coach",
    persona: "coach",
    avatar: getDiceBearAvatar("Ananya Patel"),
    content: "The creator tools are fantastic! I've built a thriving coaching practice through Next Leap Pro. The subscription model lets me focus on delivering value while the platform handles everything else.",
    rating: 5,
  },
  {
    id: 4,
    name: "Vikram Singh",
    role: "Corporate Trainer",
    persona: "trainer",
    avatar: getDiceBearAvatar("Vikram Singh"),
    content: "Organizing bootcamps has never been easier. The event management, payment integration, and attendee tracking features are top-notch. My training business has grown 3x since joining.",
    rating: 5,
  },
  {
    id: 5,
    name: "Meera Joshi",
    role: "Marketing Professional",
    persona: "professional",
    avatar: getDiceBearAvatar("Meera Joshi"),
    content: "I was looking to upskill in digital marketing. Found amazing workshops here and even connected with mentors who guided my career transition. Worth every rupee!",
    rating: 5,
  },
  {
    id: 6,
    name: "Arjun Reddy",
    role: "Final Year Engineering Student",
    persona: "student",
    avatar: getDiceBearAvatar("Arjun Reddy"),
    content: "The bootcamps on Next Leap Pro are incredible. I learned more in one weekend workshop than I did in an entire semester. Plus, the networking opportunities are unmatched!",
    rating: 5,
  },
];

const personaGradients: Record<Testimonial["persona"], string> = {
  student: "from-blue-500 to-cyan-500",
  mentor: "from-purple-500 to-pink-500",
  coach: "from-green-500 to-emerald-500",
  trainer: "from-orange-500 to-amber-500",
  professional: "from-indigo-500 to-violet-500",
};

const personaColors: Record<Testimonial["persona"], string> = {
  student: "bg-blue-100 text-blue-700 border-blue-200",
  mentor: "bg-purple-100 text-purple-700 border-purple-200",
  coach: "bg-green-100 text-green-700 border-green-200",
  trainer: "bg-orange-100 text-orange-700 border-orange-200",
  professional: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const personaLabels: Record<Testimonial["persona"], string> = {
  student: "Student",
  mentor: "Mentor",
  coach: "Coach",
  trainer: "Trainer",
  professional: "Professional",
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 400 : -400,
    opacity: 0,
    scale: 0.9,
    rotateY: direction > 0 ? 15 : -15,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -400 : 400,
    opacity: 0,
    scale: 0.9,
    rotateY: direction > 0 ? -15 : 15,
  }),
};

const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      if (newDirection === 1) {
        return (prev + 1) % testimonials.length;
      }
      return prev === 0 ? testimonials.length - 1 : prev - 1;
    });
  }, []);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      paginate(1);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, paginate]);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-3xl"
          animate={floatingAnimation}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/5 to-green-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <MotionConfig transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}>
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <Badge className="px-4 py-2 text-sm bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border border-primary/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Testimonials
              </Badge>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
              <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Loved
              </span>{" "}
              by Learners & Creators
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Join thousands of students, mentors, coaches, and professionals transforming their careers
            </p>
          </motion.div>

          {/* Carousel Container */}
          <div
            className="max-w-4xl mx-auto relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Main Testimonial Card */}
            <div className="relative h-[400px] md:h-[350px] flex items-center justify-center perspective-1000">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute w-full"
                  data-testid={`card-testimonial-${currentTestimonial.id}`}
                >
                  {/* Glassmorphism Card */}
                  <div className="relative group">
                    {/* Gradient Border Effect */}
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${personaGradients[currentTestimonial.persona]} rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500`} />
                    
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-white/50">
                      {/* Quote Icon */}
                      <motion.div
                        className="absolute -top-4 -left-4"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      >
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${personaGradients[currentTestimonial.persona]} flex items-center justify-center shadow-lg`}>
                          <Quote className="w-6 h-6 text-white" />
                        </div>
                      </motion.div>

                      {/* Stars */}
                      <motion.div
                        className="flex gap-1 mb-6 justify-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                          >
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* Quote Content */}
                      <motion.p
                        className="text-lg md:text-xl text-slate-700 text-center leading-relaxed mb-8 italic"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        "{currentTestimonial.content}"
                      </motion.p>

                      {/* Author Info */}
                      <motion.div
                        className="flex items-center justify-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.div
                          className="relative"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <div className={`absolute -inset-1 bg-gradient-to-r ${personaGradients[currentTestimonial.persona]} rounded-full blur-sm opacity-50`} />
                          <Avatar className="h-14 w-14 relative ring-2 ring-white shadow-md">
                            <AvatarImage src={currentTestimonial.avatar} alt={`Profile photo of ${currentTestimonial.name}, ${currentTestimonial.role}`} loading="lazy" />
                            <AvatarFallback className={`bg-gradient-to-br ${personaGradients[currentTestimonial.persona]} text-white font-semibold text-lg`}>
                              {currentTestimonial.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <div className="text-left">
                          <h4 className="font-semibold text-slate-900 text-lg">
                            {currentTestimonial.name}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {currentTestimonial.role}
                          </p>
                        </div>
                        <Badge className={`${personaColors[currentTestimonial.persona]} border ml-2`}>
                          {personaLabels[currentTestimonial.persona]}
                        </Badge>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="hidden md:block"
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => paginate(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-16 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
                data-testid="button-prev-testimonial"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => paginate(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-16 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
                data-testid="button-next-testimonial"
              >
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
              </Button>
            </motion.div>

            {/* Dot Indicators */}
            <motion.div
              className="flex justify-center gap-3 mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {testimonials.map((testimonial, index) => (
                <motion.button
                  key={testimonial.id}
                  onClick={() => goToSlide(index)}
                  className={`relative h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? "w-8 bg-gradient-to-r from-primary to-purple-500" 
                      : "w-3 bg-slate-300 hover:bg-slate-400"
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  data-testid={`dot-testimonial-${index}`}
                >
                  {index === currentIndex && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-purple-500"
                      layoutId="activeDot"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>

            {/* Mobile Swipe Hint */}
            <motion.p
              className="text-center text-sm text-slate-400 mt-4 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Swipe or tap dots to navigate
            </motion.p>
          </div>

          {/* Mini Testimonial Previews */}
          <motion.div
            className="hidden lg:flex justify-center gap-4 mt-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.button
                key={testimonial.id}
                onClick={() => goToSlide(index)}
                className={`relative p-3 rounded-xl transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-white shadow-lg scale-110 ring-2 ring-primary/20"
                    : "bg-white/50 hover:bg-white hover:shadow-md opacity-60 hover:opacity-100"
                }`}
                whileHover={{ scale: index === currentIndex ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Avatar className="h-10 w-10 shadow-sm transition-transform duration-200 hover:scale-110">
                  <AvatarImage src={testimonial.avatar} alt={`${testimonial.name}'s photo`} loading="lazy" />
                  <AvatarFallback className={`bg-gradient-to-br ${personaGradients[testimonial.persona]} text-white text-sm font-medium`}>
                    {testimonial.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                {index === currentIndex && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                    layoutId="activePreview"
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </MotionConfig>
      </div>
    </section>
  );
}
