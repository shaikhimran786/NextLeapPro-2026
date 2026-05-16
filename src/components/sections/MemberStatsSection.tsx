"use client";

import { Users, Crown, Calendar, UsersRound, TrendingUp, Sparkles } from "@/lib/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import { motion } from "framer-motion";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface MemberStats {
  totalMembers: number;
  activeSubscribers: number;
  totalEvents: number;
  totalCommunities: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

const statsConfig = [
  {
    key: "totalMembers",
    label: "Active Members",
    icon: Users,
    gradient: "from-blue-500 to-indigo-600",
    bgGradient: "from-blue-50 via-indigo-50 to-purple-50",
    borderColor: "border-blue-200/50",
  },
  {
    key: "totalEvents",
    label: "Total Events",
    icon: Calendar,
    gradient: "from-green-500 to-emerald-600",
    bgGradient: "from-green-50 via-emerald-50 to-teal-50",
    borderColor: "border-green-200/50",
  },
  {
    key: "totalCommunities",
    label: "Communities",
    icon: UsersRound,
    gradient: "from-purple-500 to-pink-600",
    bgGradient: "from-purple-50 via-pink-50 to-rose-50",
    borderColor: "border-purple-200/50",
  },
];

export function MemberStatsSection() {
  const { data: memberStats, isLoading } = useSWR<MemberStats>(
    "/api/stats/members",
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      suspense: false,
    }
  );

  if (isLoading || !memberStats) {
    return (
      <section className="py-16 relative overflow-hidden bg-gradient-to-b from-white via-slate-50/30 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 relative overflow-hidden bg-gradient-to-b from-white via-slate-50/30 to-white">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-20 w-72 h-72 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"
          animate={{
            y: [0, -15, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        />
        <motion.div
          className="absolute bottom-10 right-20 w-80 h-80 bg-gradient-to-br from-amber-500/5 to-pink-500/5 rounded-full blur-3xl"
          animate={{
            y: [0, 10, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: 1,
          }}
        />
      </div>

      <div className="container mx-auto px-4 z-10">
        <motion.div 
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {/* Header */}
          <motion.div 
            className="text-center mb-12"
            variants={cardVariants}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <Badge className="px-4 py-2 text-sm bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border border-primary/20 backdrop-blur-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Growing Platform
              </Badge>
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900">
              Join Our{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Growing Community
              </span>
            </h2>
            <p className="text-slate-600 mt-3 max-w-xl mx-auto">
              Thousands of learners, professionals, and creators are already growing with us
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            variants={containerVariants}
          >
            {statsConfig.map((stat, index) => {
              const Icon = stat.icon;
              const value = memberStats[stat.key as keyof MemberStats];
              
              return (
                <motion.div
                  key={stat.key}
                  variants={cardVariants}
                  whileHover={{ 
                    y: -5,
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                >
                  <Card 
                    className={`border ${stat.borderColor} shadow-lg bg-gradient-to-br ${stat.bgGradient} hover:shadow-xl transition-all duration-300 h-full group`}
                    data-testid={`card-stat-${stat.key}`}
                  >
                    <CardContent className="p-5 md:p-6">
                      <div className="flex flex-col items-center text-center gap-4">
                        <motion.div 
                          className={`h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Icon className="h-7 w-7 md:h-8 md:w-8 text-white" />
                        </motion.div>
                        <div>
                          <motion.p 
                            className="text-3xl md:text-4xl font-bold text-slate-900"
                            suppressHydrationWarning
                            data-testid={`text-${stat.key}-count`}
                          >
                            {value.toLocaleString()}+
                          </motion.p>
                          <p className="text-sm md:text-base font-medium text-slate-600 mt-1">
                            {stat.label}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Achievement Badge */}
          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-slate-700">
                India's fastest growing learning & earning platform
              </span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
