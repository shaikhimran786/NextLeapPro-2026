"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote, CheckCircle2, TrendingUp, Sparkles,
  MessageSquare, Users, ChevronRight, Loader2
} from "@/lib/icons";
import Link from "next/link";

// Lazy-load confetti to reduce initial bundle size
async function fireConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface PollOption {
  id: number;
  label: string;
  description?: string;
  responseCount?: number;
  percentage?: number;
}

interface Poll {
  id: number;
  question: string;
  pollType: string;
  description?: string;
  topic: { title: string; category: string };
  options: PollOption[];
  totalResponses?: number;
}

interface PollData {
  poll: Poll | null;
  hasVoted: boolean;
  userResponse?: { optionId: number };
}

export function DailyPollSection() {
  const { data, isLoading, error } = useSWR<PollData>(
    "/api/engagement/today",
    fetcher,
    { refreshInterval: 30000 }
  );

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justVoted, setJustVoted] = useState(false);

  if (isLoading) {
    return null;
  }

  if (error || !data?.poll) {
    return null;
  }

  const { poll, hasVoted, userResponse } = data;
  const showResults = hasVoted || justVoted;

  async function handleVote() {
    if (!selectedOption || !poll) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/engagement/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pollId: poll.id,
          optionId: selectedOption
        })
      });

      if (res.ok) {
        fireConfetti();
        toast.success("Vote submitted!");
        setJustVoted(true);
        mutate("/api/engagement/today");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to submit vote");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50/50 to-white">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-2xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <Badge className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 border border-purple-200">
                <Vote className="w-4 h-4 mr-2" />
                Daily Poll
              </Badge>
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">
              Share Your{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Opinion
              </span>
            </h2>
            <p className="text-slate-600 mt-2">
              Join the conversation and see what others think
            </p>
          </div>

          <Card className="border-none shadow-lg bg-white overflow-hidden" data-testid="card-daily-poll">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border-b">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {poll.topic.title}
                  </Badge>
                  <CardTitle className="text-lg md:text-xl font-semibold text-slate-900">
                    {poll.question}
                  </CardTitle>
                  {poll.description && (
                    <p className="text-sm text-slate-600 mt-2">{poll.description}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {showResults ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {poll.options.map((option, index) => {
                      const isSelected = userResponse?.optionId === option.id || selectedOption === option.id;
                      const percentage = option.percentage || 0;
                      
                      return (
                        <motion.div
                          key={option.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: index * 0.1 }}
                          className={`relative rounded-lg overflow-hidden border ${
                            isSelected ? "border-purple-500 ring-2 ring-purple-200" : "border-slate-200"
                          }`}
                          data-testid={`poll-result-${option.id}`}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 + 0.2 }}
                          />
                          <div className="relative flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                              )}
                              <span className="font-medium text-slate-900">{option.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600">
                                {option.responseCount || 0} votes
                              </span>
                              <span className="font-bold text-purple-600">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    <div className="flex items-center justify-between pt-4 border-t mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="h-4 w-4" />
                        <span>{poll.totalResponses || 0} total responses</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Voted
                      </Badge>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="voting"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <RadioGroup
                      value={selectedOption?.toString() || ""}
                      onValueChange={(value) => setSelectedOption(parseInt(value))}
                      className="space-y-3"
                    >
                      {poll.options.map((option, index) => (
                        <motion.div
                          key={option.id}
                          variants={itemVariants}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Label
                            htmlFor={`option-${option.id}`}
                            className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                              selectedOption === option.id
                                ? "border-purple-500 bg-purple-50"
                                : "border-slate-200 hover:border-purple-300 hover:bg-purple-50/50"
                            }`}
                            data-testid={`poll-option-${option.id}`}
                          >
                            <RadioGroupItem
                              value={option.id.toString()}
                              id={`option-${option.id}`}
                              className="text-purple-600"
                            />
                            <span className="font-medium text-slate-900">{option.label}</span>
                          </Label>
                        </motion.div>
                      ))}
                    </RadioGroup>

                    <Button
                      onClick={handleVote}
                      disabled={!selectedOption || isSubmitting}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      data-testid="button-submit-vote"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Vote className="h-4 w-4 mr-2" />
                          Submit Vote
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/engagement" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium">
              <Sparkles className="h-4 w-4" />
              View More Polls & Surveys
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
