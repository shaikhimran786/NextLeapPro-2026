"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";
import useSWR from "swr";

// Type definitions for hero animation settings
export interface HeroAnimationConfig {
  type: "none" | "fade" | "slide" | "scale" | "bounce" | "typewriter";
  duration: number;
  delay: number;
  stagger: number;
  easing: string;
  loop: boolean;
}

export interface HeroGradientsConfig {
  source: "brand" | "custom";
  angle: number;
  learn: [string, string];
  earn: [string, string];
  grow: [string, string];
}

// Default gradient colors (brand colors)
const DEFAULT_GRADIENTS: HeroGradientsConfig = {
  source: "brand",
  angle: 90,
  learn: ["#E8348A", "#FF66B2"],
  earn: ["#007BFF", "#00A6FF"],
  grow: ["#28A745", "#6BE07B"],
};

// Default animation config
const DEFAULT_ANIMATION: HeroAnimationConfig = {
  type: "fade",
  duration: 0.8,
  delay: 0.1,
  stagger: 0.15,
  easing: "easeOut",
  loop: false,
};

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Animation variants for each animation type
function getAnimationVariants(
  config: HeroAnimationConfig,
  shouldReduceMotion: boolean
): Variants {
  if (shouldReduceMotion || config.type === "none") {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
    };
  }

  const easing = config.easing as any;

  switch (config.type) {
    case "fade":
      return {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: config.duration, ease: easing },
        },
      };
    case "slide":
      return {
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: config.duration, ease: easing },
        },
      };
    case "scale":
      return {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: config.duration, ease: easing },
        },
      };
    case "bounce":
      return {
        hidden: { opacity: 0, y: -50 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 15,
            duration: config.duration,
          },
        },
      };
    case "typewriter":
      return {
        hidden: { opacity: 0, x: -10 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: config.duration * 0.5, ease: easing },
        },
      };
    default:
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      };
  }
}

// Tokenizer: splits text and wraps Learn/Earn/Grow with gradient spans
function tokenizeHeroText(
  text: string,
  gradients: HeroGradientsConfig
): React.ReactNode[] {
  const keywords = ["Learn", "Earn", "Grow"];
  const keywordGradients: Record<string, [string, string]> = {
    Learn: gradients.learn,
    Earn: gradients.earn,
    Grow: gradients.grow,
  };

  // Create regex pattern for all keywords (case-insensitive matching)
  const pattern = new RegExp(`(${keywords.join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const matchedKeyword = keywords.find(
      (kw) => kw.toLowerCase() === part.toLowerCase()
    );

    if (matchedKeyword) {
      const [fromColor, toColor] = keywordGradients[matchedKeyword];
      const gradientStyle = {
        background: `linear-gradient(${gradients.angle}deg, ${fromColor}, ${toColor})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      };

      return (
        <span
          key={`${matchedKeyword}-${index}`}
          style={gradientStyle}
          className="font-bold"
          data-testid={`gradient-${matchedKeyword.toLowerCase()}`}
        >
          {matchedKeyword}
        </span>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
}

// Component props
interface HeroTitleProps {
  className?: string;
  overrideTitle?: string;
  overrideAnimation?: HeroAnimationConfig;
  overrideGradients?: HeroGradientsConfig;
  isPreview?: boolean;
}

export function HeroTitle({
  className = "",
  overrideTitle,
  overrideAnimation,
  overrideGradients,
  isPreview = false,
}: HeroTitleProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);

  // Fetch settings from API (skip if preview mode with overrides)
  const { data: settings } = useSWR(
    !isPreview ? "/api/admin/settings" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // Ensure client-side rendering for Framer Motion
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Parse animation config
  const animationConfig = useMemo<HeroAnimationConfig>(() => {
    if (overrideAnimation) return overrideAnimation;
    if (settings?.heroAnimation) {
      return typeof settings.heroAnimation === "string"
        ? JSON.parse(settings.heroAnimation)
        : settings.heroAnimation;
    }
    return DEFAULT_ANIMATION;
  }, [settings?.heroAnimation, overrideAnimation]);

  // Parse gradients config
  const gradientsConfig = useMemo<HeroGradientsConfig>(() => {
    if (overrideGradients) return overrideGradients;
    if (settings?.heroGradients) {
      return typeof settings.heroGradients === "string"
        ? JSON.parse(settings.heroGradients)
        : settings.heroGradients;
    }
    return DEFAULT_GRADIENTS;
  }, [settings?.heroGradients, overrideGradients]);

  // Get title text
  const titleText = overrideTitle || settings?.heroTitle || "Learn. Earn. And Grow.";

  // Tokenize title into words for animation
  const words = useMemo(() => {
    return titleText.split(" ").filter((word: string) => word.length > 0);
  }, [titleText]);

  // Get animation variants
  const variants = useMemo(
    () => getAnimationVariants(animationConfig, shouldReduceMotion || false),
    [animationConfig, shouldReduceMotion]
  );

  // Container variants for stagger effect
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: animationConfig.stagger,
        delayChildren: animationConfig.delay,
      },
    },
  };

  // Render static version on server
  if (!isClient) {
    return (
      <h1
        className={`text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight ${className}`}
        data-testid="hero-title"
      >
        {tokenizeHeroText(titleText, gradientsConfig)}
      </h1>
    );
  }

  // Render animated version on client
  return (
    <motion.h1
      className={`text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      key={isPreview ? "preview" : "hero-title"}
      data-testid="hero-title"
    >
      {words.map((word: string, wordIndex: number) => (
        <motion.span
          key={`word-${wordIndex}`}
          variants={variants}
          className="inline-block mr-[0.25em]"
          style={{ whiteSpace: "pre" }}
        >
          {tokenizeHeroText(word, gradientsConfig)}
        </motion.span>
      ))}
    </motion.h1>
  );
}

// Export defaults for admin UI
export { DEFAULT_ANIMATION, DEFAULT_GRADIENTS };
