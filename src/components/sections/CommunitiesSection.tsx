"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CommunityCard } from "@/components/shared/CommunityCard";
import { ArrowRight, Users, Sparkles } from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Community {
  id: number;
  name: string;
  description: string;
  logo: string;
  category: string;
  memberCount: number;
  location: string | null;
  tags: string[];
}

interface CommunitiesSectionProps {
  communities: Community[];
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
  hidden: { 
    opacity: 0, 
    y: 60,
    scale: 0.9,
  },
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

const headerVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
    },
  },
};

export function CommunitiesSection({ communities }: CommunitiesSectionProps) {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 right-10 w-80 h-80 bg-gradient-to-br from-blue-500/8 to-cyan-500/8 rounded-full blur-3xl"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-br from-purple-500/8 to-pink-500/8 rounded-full blur-3xl"
          animate={{
            y: [0, 15, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Animated Header */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            },
          }}
        >
          <motion.div variants={headerVariants}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex items-center gap-2 mb-3"
            >
              <Badge className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border border-blue-200/50 backdrop-blur-sm">
                <Users className="w-4 h-4 mr-2" />
                Communities
              </Badge>
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-primary bg-clip-text text-transparent">
                Connect
              </span>{" "}
              & Collaborate
            </h2>
            <p className="text-slate-600 mt-2 max-w-md">
              Join vibrant communities of learners, mentors, and creators
            </p>
          </motion.div>
          
          <motion.div variants={headerVariants}>
            <Link href="/communities">
              <Button 
                variant="outline" 
                className="gap-2 group rounded-full border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                data-testid="button-view-all-communities"
              >
                Explore All
                <motion.span
                  className="inline-block"
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <ArrowRight size={16} className="group-hover:text-primary transition-colors" />
                </motion.span>
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Animated Cards Grid */}
        {communities.length > 0 ? (
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {communities.map((community, index) => (
              <motion.div
                key={community.id}
                variants={cardVariants}
                whileHover={{ 
                  y: -8,
                  transition: { type: "spring", stiffness: 400, damping: 25 }
                }}
                className="h-full"
              >
                <CommunityCard
                  id={community.id}
                  name={community.name}
                  description={community.description}
                  logo={community.logo}
                  category={community.category}
                  memberCount={community.memberCount}
                  location={community.location}
                  tags={community.tags}
                  index={index}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <p className="text-slate-500 text-lg">No communities yet. Be the first to create one!</p>
            <Link href="/communities/create">
              <Button variant="gradient" className="mt-6 rounded-full">
                Create Community
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Bottom CTA */}
        {communities.length > 0 && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-slate-500 text-sm">
              Discover {communities.length}+ communities and growing
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
