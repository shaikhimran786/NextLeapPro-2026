"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Sparkles, Loader2, Wand2, Copy, CheckCircle, 
  Calendar, Users, Tag, Clock, IndianRupee
} from "@/lib/icons";

interface GeneratedEvent {
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  tags: string[];
  level: string;
  agenda: Array<{ time: string; title: string; description: string }>;
  speakers?: Array<{ name: string; title: string; bio: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  suggestedPrice?: number;
  suggestedCapacity?: number;
}

interface AIEventGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventGenerated: (event: GeneratedEvent) => void;
}

const eventTypes = ["workshop", "webinar", "bootcamp", "conference", "meetup", "hackathon", "seminar", "networking"];
const eventModes = ["online", "offline", "hybrid"];
const targetAudiences = [
  "College Students",
  "Fresh Graduates",
  "Working Professionals",
  "Entrepreneurs",
  "Freelancers",
  "Career Changers",
  "Tech Professionals",
  "Non-Tech Professionals",
  "All Levels"
];

export function AIEventGenerator({ open, onOpenChange, onEventGenerated }: AIEventGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEvent, setGeneratedEvent] = useState<GeneratedEvent | null>(null);
  const [activeTab, setActiveTab] = useState("form");
  
  const [formData, setFormData] = useState({
    topic: "",
    targetAudience: "",
    eventType: "workshop",
    mode: "online",
    duration: "",
    additionalContext: ""
  });

  async function handleGenerate() {
    if (!formData.topic || !formData.targetAudience) {
      toast.error("Please enter a topic and target audience");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/events/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: formData.topic,
          targetAudience: formData.targetAudience,
          eventType: formData.eventType,
          mode: formData.mode,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          additionalContext: formData.additionalContext
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedEvent(data.generatedContent);
        setActiveTab("preview");
        toast.success(`Event generated in ${(data.processingTime / 1000).toFixed(1)}s!`);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to generate event");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleUseEvent() {
    if (generatedEvent) {
      onEventGenerated(generatedEvent);
      onOpenChange(false);
      setGeneratedEvent(null);
      setActiveTab("form");
      setFormData({
        topic: "",
        targetAudience: "",
        eventType: "workshop",
        mode: "online",
        duration: "",
        additionalContext: ""
      });
    }
  }

  function handleClose() {
    onOpenChange(false);
    setGeneratedEvent(null);
    setActiveTab("form");
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            AI Event Generator
          </DialogTitle>
          <DialogDescription>
            Generate complete event content using AI. Describe your event idea and let AI create the details.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form" className="gap-2">
              <Wand2 className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedEvent} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="topic">Event Topic / Theme *</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., Building a Personal Brand on LinkedIn, Introduction to Python Programming"
                  data-testid="input-ai-topic"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Be specific about what you want to teach or discuss
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAudience">Target Audience *</Label>
                  <Select 
                    value={formData.targetAudience} 
                    onValueChange={(v) => setFormData({ ...formData, targetAudience: v })}
                  >
                    <SelectTrigger data-testid="select-ai-audience">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetAudiences.map((audience) => (
                        <SelectItem key={audience} value={audience}>
                          {audience}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select 
                    value={formData.eventType} 
                    onValueChange={(v) => setFormData({ ...formData, eventType: v })}
                  >
                    <SelectTrigger data-testid="select-ai-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mode">Event Mode</Label>
                  <Select 
                    value={formData.mode} 
                    onValueChange={(v) => setFormData({ ...formData, mode: v })}
                  >
                    <SelectTrigger data-testid="select-ai-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventModes.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 90"
                    data-testid="input-ai-duration"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="additionalContext">Additional Context (optional)</Label>
                <Textarea
                  id="additionalContext"
                  value={formData.additionalContext}
                  onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
                  placeholder="Any specific requirements, key topics to cover, or special considerations..."
                  rows={3}
                  data-testid="input-ai-context"
                />
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !formData.topic || !formData.targetAudience}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-generate-ai"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating... (this may take 10-20 seconds)
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Event Content
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 mt-4">
            {generatedEvent && (
              <>
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Generated Event
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-xl text-slate-900">{generatedEvent.title}</h3>
                      <p className="text-slate-600 mt-1">{generatedEvent.shortDescription}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge>{generatedEvent.category}</Badge>
                      <Badge variant="outline">{generatedEvent.level}</Badge>
                      {generatedEvent.tags.slice(0, 4).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-slate-500" />
                        <span>Suggested Price: {generatedEvent.suggestedPrice === 0 ? "Free" : `₹${generatedEvent.suggestedPrice}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span>Suggested Capacity: {generatedEvent.suggestedCapacity}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                      <div className="prose prose-sm max-w-none text-slate-600 bg-white p-3 rounded-lg border max-h-48 overflow-y-auto">
                        {generatedEvent.description.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>

                    {generatedEvent.agenda && generatedEvent.agenda.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">Agenda ({generatedEvent.agenda.length} items)</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {generatedEvent.agenda.map((item, i) => (
                            <div key={i} className="flex gap-3 text-sm bg-white p-2 rounded border">
                              <span className="font-medium text-primary whitespace-nowrap">{item.time}</span>
                              <span className="text-slate-900">{item.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedEvent.faqs && generatedEvent.faqs.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">FAQs ({generatedEvent.faqs.length})</h4>
                        <div className="text-sm text-slate-600">
                          {generatedEvent.faqs.slice(0, 2).map((faq, i) => (
                            <div key={i} className="bg-white p-2 rounded border mb-2">
                              <p className="font-medium">Q: {faq.question}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("form")}
                    className="flex-1"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button 
                    onClick={handleUseEvent}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                    data-testid="button-use-generated"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Use This Event
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
