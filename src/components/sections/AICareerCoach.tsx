"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { 
  Sparkles, Loader2, Target, TrendingUp, Briefcase, 
  IndianRupee, GraduationCap, Calendar, CheckCircle, 
  AlertCircle, Plus, X, Lightbulb, Rocket, Users, BookOpen
} from "@/lib/icons";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const experienceLevels = [
  { value: "student", label: "Student" },
  { value: "fresher", label: "Fresher (0-1 years)" },
  { value: "junior", label: "Junior (1-3 years)" },
  { value: "mid", label: "Mid-level (3-5 years)" },
  { value: "senior", label: "Senior (5-10 years)" },
  { value: "expert", label: "Expert (10+ years)" }
];

const incomeGoalOptions = [
  { value: "10k-25k", label: "₹10,000 - ₹25,000/month" },
  { value: "25k-50k", label: "₹25,000 - ₹50,000/month" },
  { value: "50k-1L", label: "₹50,000 - ₹1,00,000/month" },
  { value: "1L-2L", label: "₹1,00,000 - ₹2,00,000/month" },
  { value: "2L+", label: "₹2,00,000+/month" }
];

interface CareerInsight {
  id: number;
  insightType: string;
  title: string;
  summary: string;
  actionsJson: any;
  priority: number;
}

interface CareerProfile {
  id: number;
  interests: string[];
  learningGoals: string[];
  careerAspirations: string[];
  currentRole?: string;
  experienceLevel?: string;
  incomeGoals?: string;
}

export function AICareerCoach() {
  const { data, isLoading, error } = useSWR("/api/career/insights", fetcher);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("input");
  
  const [formData, setFormData] = useState({
    skills: [] as string[],
    interests: [] as string[],
    learningGoals: [] as string[],
    careerAspirations: [] as string[],
    currentRole: "",
    experienceLevel: "",
    incomeGoals: ""
  });
  
  const [inputValues, setInputValues] = useState({
    skills: "",
    interests: "",
    learningGoals: "",
    careerAspirations: ""
  });

  const hasInsights = data?.hasInsights;
  const careerProfile = data?.careerProfile;
  const insights = careerProfile?.insights || [];

  function addItem(field: 'skills' | 'interests' | 'learningGoals' | 'careerAspirations') {
    const value = inputValues[field].trim();
    if (value && !formData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value]
      }));
      setInputValues(prev => ({ ...prev, [field]: "" }));
    }
  }

  function removeItem(field: 'skills' | 'interests' | 'learningGoals' | 'careerAspirations', item: string) {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(i => i !== item)
    }));
  }

  async function handleGenerate() {
    if (formData.skills.length === 0 || formData.interests.length === 0 || 
        formData.learningGoals.length === 0 || formData.careerAspirations.length === 0) {
      toast.error("Please add at least one item in each category");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/career/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        mutate("/api/career/insights");
        setActiveTab("results");
        toast.success(`Career insights generated in ${(data.processingTime / 1000).toFixed(1)}s!`);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to generate insights");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  function renderTagInput(
    field: 'skills' | 'interests' | 'learningGoals' | 'careerAspirations',
    placeholder: string,
    icon: React.ReactNode
  ) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {icon}
          {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
        </Label>
        <div className="flex gap-2">
          <Input
            value={inputValues[field]}
            onChange={(e) => setInputValues(prev => ({ ...prev, [field]: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(field))}
            placeholder={placeholder}
            className="flex-1"
            data-testid={`input-career-${field}`}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => addItem(field)}
            data-testid={`button-add-${field}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData[field].length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData[field].map((item, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {item}
                <button 
                  onClick={() => removeItem(field, item)}
                  className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderInsightCard(insight: CareerInsight) {
    const icons: Record<string, React.ReactNode> = {
      career_path: <Target className="h-5 w-5 text-blue-600" />,
      skill_gaps: <TrendingUp className="h-5 w-5 text-orange-600" />,
      monetization: <IndianRupee className="h-5 w-5 text-green-600" />,
      recommendations: <Lightbulb className="h-5 w-5 text-purple-600" />
    };

    const colors: Record<string, string> = {
      career_path: "border-blue-200 bg-blue-50/50",
      skill_gaps: "border-orange-200 bg-orange-50/50",
      monetization: "border-green-200 bg-green-50/50",
      recommendations: "border-purple-200 bg-purple-50/50"
    };

    return (
      <Card key={insight.id} className={`${colors[insight.insightType]} border-2`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {icons[insight.insightType]}
            {insight.title}
          </CardTitle>
          <CardDescription>{insight.summary}</CardDescription>
        </CardHeader>
        <CardContent>
          {insight.insightType === "career_path" && insight.actionsJson?.milestones && (
            <div className="space-y-4">
              {insight.actionsJson.milestones.map((milestone: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    {i < insight.actionsJson.milestones.length - 1 && (
                      <div className="w-0.5 h-full bg-blue-200 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{milestone.goal}</span>
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {milestone.timeframe}
                      </Badge>
                    </div>
                    <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
                      {milestone.actions?.slice(0, 3).map((action: string, j: number) => (
                        <li key={j}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {insight.insightType === "skill_gaps" && insight.actionsJson?.skillGaps && (
            <div className="space-y-3">
              {insight.actionsJson.skillGaps.map((skill: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                  <Badge variant={skill.importance === "high" ? "destructive" : skill.importance === "medium" ? "default" : "secondary"}>
                    {skill.importance}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium">{skill.skill}</p>
                    {skill.resources && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {skill.resources.slice(0, 2).map((resource: string, j: number) => (
                          <Badge key={j} variant="outline" className="text-xs">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {resource}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {insight.insightType === "monetization" && insight.actionsJson?.tips && (
            <div className="space-y-3">
              {insight.actionsJson.tips.map((tip: any, i: number) => (
                <div key={i} className="p-3 bg-white rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{tip.method}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                        {tip.potentialEarning}
                      </Badge>
                      <Badge variant={tip.difficulty === "easy" ? "secondary" : tip.difficulty === "medium" ? "default" : "destructive"}>
                        {tip.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{tip.description}</p>
                  {tip.steps && (
                    <ol className="text-sm text-slate-600 list-decimal pl-4 space-y-1">
                      {tip.steps.slice(0, 3).map((step: string, j: number) => (
                        <li key={j}>{step}</li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          )}

          {insight.insightType === "recommendations" && insight.actionsJson && (
            <div className="grid gap-4 md:grid-cols-2">
              {insight.actionsJson.events && (
                <div>
                  <p className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Events to Attend
                  </p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {insight.actionsJson.events.map((event: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        {event}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {insight.actionsJson.communities && (
                <div>
                  <p className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Users className="h-4 w-4" /> Communities to Join
                  </p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {insight.actionsJson.communities.map((community: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        {community}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
        <CardTitle className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          AI Career Coach
        </CardTitle>
        <CardDescription>
          Get personalized career guidance, skill development roadmap, and monetization tips powered by AI
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={hasInsights && activeTab === "input" ? "results" : activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="input" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Your Profile
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!hasInsights} className="gap-2">
              <Rocket className="h-4 w-4" />
              Career Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-6">
            {renderTagInput("skills", "e.g., Python, Communication, Excel...", <Briefcase className="h-4 w-4" />)}
            {renderTagInput("interests", "e.g., AI, Startups, Finance...", <Target className="h-4 w-4" />)}
            {renderTagInput("learningGoals", "e.g., Learn React, Get AWS certified...", <GraduationCap className="h-4 w-4" />)}
            {renderTagInput("careerAspirations", "e.g., Become a product manager, Start a business...", <Rocket className="h-4 w-4" />)}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Current Role (optional)</Label>
                <Input
                  value={formData.currentRole}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentRole: e.target.value }))}
                  placeholder="e.g., Software Engineer"
                  data-testid="input-career-role"
                />
              </div>
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select 
                  value={formData.experienceLevel} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, experienceLevel: v }))}
                >
                  <SelectTrigger data-testid="select-career-experience">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Income Goals</Label>
                <Select 
                  value={formData.incomeGoals} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, incomeGoals: v }))}
                >
                  <SelectTrigger data-testid="select-career-income">
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeGoalOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-generate-career"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Insights... (this may take 15-30 seconds)
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Career Insights
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <AnimatePresence>
              {insights.map((insight: CareerInsight, index: number) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {renderInsightCard(insight)}
                </motion.div>
              ))}
            </AnimatePresence>

            {insights.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("input")}
                className="w-full"
              >
                Update Profile & Regenerate
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
