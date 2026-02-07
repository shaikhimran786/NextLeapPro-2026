"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, ArrowUpRight } from "@/lib/icons";
import { SmartImage } from "@/components/ui/smart-image";
import { motion } from "framer-motion";

interface CommunityCardProps {
  id: number;
  name: string;
  description: string;
  logo: string;
  category: string;
  memberCount: number;
  location?: string | null;
  tags?: string[];
  index?: number;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Technology: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Design: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Business: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  Marketing: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Education: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  "Career Growth": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  Finance: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Health: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  default: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

const categoryGradients: Record<string, string> = {
  Technology: "from-blue-500 to-cyan-500",
  Design: "from-purple-500 to-pink-500",
  Business: "from-green-500 to-emerald-500",
  Marketing: "from-orange-500 to-amber-500",
  Education: "from-cyan-500 to-teal-500",
  "Career Growth": "from-indigo-500 to-violet-500",
  Finance: "from-emerald-500 to-green-500",
  Health: "from-rose-500 to-pink-500",
  default: "from-primary to-blue-600",
};

export function CommunityCard({
  id,
  name,
  description,
  logo,
  category,
  memberCount,
  location,
  tags = [],
  index = 0,
}: CommunityCardProps) {
  const colorScheme = categoryColors[category] || categoryColors.default;
  const gradient = categoryGradients[category] || categoryGradients.default;

  return (
    <Link href={`/communities/${id}`} className="block h-full">
      <motion.div
        className="relative h-full group"
        whileHover="hover"
        initial="rest"
        animate="rest"
      >
        {/* Gradient Border Effect */}
        <motion.div
          className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-500`}
          variants={{
            rest: { opacity: 0 },
            hover: { opacity: 0.4 },
          }}
        />
        
        <Card 
          className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-none shadow-md hover:shadow-xl transition-all duration-500 h-full rounded-2xl"
          data-testid={`community-card-${id}`}
        >
          {/* Decorative Corner Accent */}
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-bl-full`} />
          
          <CardContent className="p-6 relative">
            {/* Header with Logo and Category */}
            <div className="flex items-start gap-4 mb-4">
              <motion.div 
                className="relative"
                variants={{
                  rest: { scale: 1, rotate: 0 },
                  hover: { scale: 1.05, rotate: 3 },
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-xl blur-sm opacity-30`} />
                <div className="relative h-16 w-16 rounded-xl overflow-hidden ring-2 ring-white shadow-md">
                  <SmartImage
                    src={logo}
                    alt={`${name} community logo - ${category}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                    fallbackType="logo"
                  />
                </div>
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <motion.h3 
                  className="font-heading font-bold text-lg line-clamp-1 text-slate-900"
                  variants={{
                    rest: { color: "#0f172a" },
                    hover: { color: "#FF0099" },
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {name}
                </motion.h3>
                <Badge 
                  className={`mt-1.5 ${colorScheme.bg} ${colorScheme.text} ${colorScheme.border} border font-medium`}
                >
                  {category}
                </Badge>
              </div>

              {/* Hover Arrow Indicator */}
              <motion.div
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                variants={{
                  rest: { x: -5, opacity: 0 },
                  hover: { x: 0, opacity: 1 },
                }}
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center`}>
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
              {description}
            </p>

            {/* Tags with Animation */}
            {tags.length > 0 && (
              <motion.div 
                className="flex flex-wrap gap-1.5 mb-4"
                variants={{
                  rest: {},
                  hover: {
                    transition: { staggerChildren: 0.05 }
                  }
                }}
              >
                {tags.slice(0, 3).map((tag, idx) => (
                  <motion.span
                    key={idx}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors cursor-default"
                    variants={{
                      rest: { y: 0 },
                      hover: { y: -2 },
                    }}
                  >
                    {tag}
                  </motion.span>
                ))}
                {tags.length > 3 && (
                  <span className="text-xs px-2.5 py-1 text-slate-400">
                    +{tags.length - 3} more
                  </span>
                )}
              </motion.div>
            )}

            {/* Footer Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <motion.div 
                className="flex items-center gap-2 text-sm"
                variants={{
                  rest: { scale: 1 },
                  hover: { scale: 1.05 },
                }}
              >
                <div className={`w-7 h-7 rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center`}>
                  <Users className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-slate-700 font-medium" suppressHydrationWarning>
                  {memberCount.toLocaleString("en-IN")}
                </span>
                <span className="text-slate-400 text-xs">members</span>
              </motion.div>
              
              {location && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="truncate max-w-[100px]">{location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
