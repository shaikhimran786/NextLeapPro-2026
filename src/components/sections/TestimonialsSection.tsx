"use client";

import { useState, useEffect, useCallback } from "react";
import { Quote, Star, ChevronLeft, ChevronRight, Sparkles, BadgeCheck, ArrowRight } from "@/lib/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  formerRole?: string;
  persona: "student" | "mentor" | "coach" | "trainer" | "professional";
  gender: "male" | "female";
  avatar: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Priya Sharma",
    role: "Computer Science Student",
    persona: "student",
    gender: "female",
    avatar: "/avatars/female-1.webp",
    content: "Next Leap Pro helped me land my first internship! The workshops on resume building and mock interviews were exactly what I needed. The community support is incredible.",
    rating: 5,
  },
  {
    id: 2,
    name: "Rajesh Kumar",
    role: "Senior Software Engineer & Mentor",
    persona: "mentor",
    gender: "male",
    avatar: "/avatars/male-2.webp",
    content: "As a mentor, I love how easy it is to connect with eager learners. The platform's event management tools make hosting sessions seamless. Highly recommend for anyone looking to give back.",
    rating: 5,
  },
  {
    id: 3,
    name: "Ananya Patel",
    role: "Career Coach",
    persona: "coach",
    gender: "female",
    avatar: "/avatars/female-3.webp",
    content: "The creator tools are fantastic! I've built a thriving coaching practice through Next Leap Pro. The subscription model lets me focus on delivering value while the platform handles everything else.",
    rating: 5,
  },
  {
    id: 4,
    name: "Vikram Singh",
    role: "Corporate Trainer",
    persona: "trainer",
    gender: "male",
    avatar: "/avatars/male-4.webp",
    content: "Organizing bootcamps has never been easier. The event management, payment integration, and attendee tracking features are top-notch. My training business has grown 3x since joining.",
    rating: 5,
  },
  {
    id: 5,
    name: "Meera Joshi",
    role: "Marketing Professional",
    persona: "professional",
    gender: "female",
    avatar: "/avatars/female-5.webp",
    content: "I was looking to upskill in digital marketing. Found amazing workshops here and even connected with mentors who guided my career transition. Worth every rupee!",
    rating: 5,
  },
  {
    id: 6,
    name: "Arjun Reddy",
    role: "Final Year Engineering Student",
    persona: "student",
    gender: "male",
    avatar: "/avatars/male-6.webp",
    content: "The bootcamps on Next Leap Pro are incredible. I learned more in one weekend workshop than I did in an entire semester. Plus, the networking opportunities are unmatched!",
    rating: 5,
  },
  {
    id: 7,
    name: "Suresh Nair",
    role: "Career Coach",
    formerRole: "Corporate Manager",
    persona: "coach",
    gender: "male",
    avatar: "/avatars/male-7.webp",
    content: "I was laid off after 12 years in a corporate role. It was a tough phase. Through Next Leap Pro, I started offering career guidance sessions and slowly rebuilt my confidence. Today, I earn independently and help others navigate their careers.",
    rating: 5,
  },
  {
    id: 8,
    name: "Deepak Verma",
    role: "Mentor & Workshop Host",
    formerRole: "Senior Software Engineer",
    persona: "mentor",
    gender: "male",
    avatar: "/avatars/male-8.webp",
    content: "I always felt dependent on my salary. Next Leap Pro helped me start weekend workshops and consulting. Now I have a second income stream and peace of mind.",
    rating: 5,
  },
  {
    id: 9,
    name: "Ramesh Iyer",
    role: "Mentor & Guest Lecturer",
    formerRole: "Industry Expert (20+ yrs)",
    persona: "mentor",
    gender: "male",
    avatar: "/avatars/male-9.webp",
    content: "After 20 years in the industry, I wanted to share my experience. Next Leap Pro made it easy to start mentoring and guest lectures. It gave me purpose beyond my job.",
    rating: 5,
  },
  {
    id: 10,
    name: "Kavitha Menon",
    role: "Community Builder",
    formerRole: "Marketing Professional",
    persona: "professional",
    gender: "female",
    avatar: "/avatars/female-10.webp",
    content: "I was not happy with my job anymore. I wanted to do something meaningful. Through Next Leap Pro, I started community sessions and coaching. It changed how I look at my career.",
    rating: 5,
  },
  {
    id: 11,
    name: "Shalini Gupta",
    role: "Workshop Facilitator",
    formerRole: "Trainer",
    persona: "trainer",
    gender: "female",
    avatar: "/avatars/female-11.webp",
    content: "I used to struggle finding the right audience for my workshops. With Next Leap Pro, I now connect directly with learners and institutions. It simplified everything.",
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

          <div
            className="max-w-4xl mx-auto relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative h-[450px] md:h-[400px] flex items-center justify-center perspective-1000">
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
                  <div className="relative group">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${personaGradients[currentTestimonial.persona]} rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500`} />
                    
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-white/50">
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

                      <motion.p
                        className="text-lg md:text-xl text-slate-700 text-center leading-relaxed mb-8 italic"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        &ldquo;{currentTestimonial.content}&rdquo;
                      </motion.p>

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
                            <AvatarImage src={currentTestimonial.avatar} alt={`Profile photo of ${currentTestimonial.name}, ${currentTestimonial.role}`} loading="lazy" className="object-cover" />
                            <AvatarFallback className={`bg-gradient-to-br ${personaGradients[currentTestimonial.persona]} text-white font-semibold text-lg`}>
                              {currentTestimonial.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-slate-900 text-lg" data-testid={`text-name-${currentTestimonial.id}`}>
                              {currentTestimonial.name}
                            </h4>
                            <span className="inline-flex items-center gap-0.5 text-blue-500 shrink-0" aria-label="Verified User" data-testid={`icon-verified-${currentTestimonial.id}`}>
                              <BadgeCheck className="w-4.5 h-4.5" />
                              <span className="text-xs font-medium hidden sm:inline">Verified</span>
                            </span>
                          </div>
                          {currentTestimonial.formerRole ? (
                            <p className="text-sm text-slate-500 flex items-center gap-1" data-testid={`text-role-transition-${currentTestimonial.id}`}>
                              <span className="text-slate-400">{currentTestimonial.formerRole}</span>
                              <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                              <span className="text-primary font-medium">{currentTestimonial.role}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-slate-500">
                              {currentTestimonial.role}
                            </p>
                          )}
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

            <motion.div
              className="flex justify-center gap-2 mt-8"
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

            <motion.p
              className="text-center text-sm text-slate-400 mt-4 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Swipe or tap dots to navigate
            </motion.p>
          </div>

          <motion.div
            className="hidden lg:flex justify-center gap-3 mt-12 flex-wrap"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.button
                key={testimonial.id}
                onClick={() => goToSlide(index)}
                className={`relative p-2.5 rounded-xl transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-white shadow-lg scale-110 ring-2 ring-primary/20"
                    : "bg-white/50 hover:bg-white hover:shadow-md opacity-60 hover:opacity-100"
                }`}
                whileHover={{ scale: index === currentIndex ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Avatar className="h-9 w-9 shadow-sm transition-transform duration-200 hover:scale-110">
                  <AvatarImage src={testimonial.avatar} alt={`${testimonial.name}'s photo`} loading="lazy" className="object-cover" />
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
