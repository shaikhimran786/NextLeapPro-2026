"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  MessageSquare, BarChart3, Calendar, Plus, Search, Edit, Trash2,
  Vote, CheckCircle, XCircle, Clock, Users, Eye, TrendingUp,
  ListChecks, ChartPie, Star, Sparkles
} from "@/lib/icons";

interface EngagementTopic {
  id: number;
  title: string;
  description: string | null;
  category: string;
  isActive: boolean;
  visibility: string;
  targetAudience: string[];
  createdAt: string;
  _count: { polls: number; schedules: number };
}

interface PollOption {
  id: number;
  label: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  responseCount: number;
}

interface Poll {
  id: number;
  topicId: number;
  question: string;
  pollType: string;
  description: string | null;
  imageUrl: string | null;
  isAnonymous: boolean;
  showResults: boolean;
  resultsVisibility: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  status: string;
  createdAt: string;
  topic: EngagementTopic;
  options: PollOption[];
  responseCount: number;
}

interface DailySchedule {
  id: number;
  scheduledDate: string;
  topicId: number;
  status: string;
  publishedAt: string | null;
  topic: EngagementTopic;
}

const pollTypes = [
  { value: "single", label: "Single Choice", icon: CheckCircle },
  { value: "multi", label: "Multiple Choice", icon: ListChecks },
  { value: "scale", label: "Rating Scale", icon: Star },
  { value: "open", label: "Open Text", icon: MessageSquare },
];

const topicCategories = [
  "general",
  "technology",
  "career",
  "skills",
  "industry",
  "trends",
  "learning",
  "feedback"
];

const pollStatuses = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700" },
  { value: "published", label: "Published", color: "bg-green-100 text-green-700" },
  { value: "closed", label: "Closed", color: "bg-red-100 text-red-700" },
];

export default function AdminEngagementPage() {
  const [topics, setTopics] = useState<EngagementTopic[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("polls");
  
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isPollDialogOpen, setIsPollDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  
  const [editingTopic, setEditingTopic] = useState<EngagementTopic | null>(null);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  
  const [newTopic, setNewTopic] = useState({
    title: "",
    description: "",
    category: "general",
    visibility: "public",
    targetAudience: [] as string[]
  });
  
  const [newPoll, setNewPoll] = useState({
    topicId: "",
    question: "",
    pollType: "single",
    description: "",
    isAnonymous: false,
    showResults: true,
    resultsVisibility: "after_vote",
    startDate: "",
    endDate: "",
    status: "draft",
    options: [
      { label: "", description: "" },
      { label: "", description: "" }
    ]
  });
  
  const [newSchedule, setNewSchedule] = useState({
    scheduledDate: "",
    topicId: ""
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEngagementData();
  }, []);

  async function fetchEngagementData() {
    try {
      const res = await fetch("/api/admin/engagement");
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
        setPolls(data.polls || []);
        setSchedules(data.schedules || []);
      } else if (res.status === 401) {
        toast.error("Admin access required");
      }
    } catch (error) {
      toast.error("Failed to load engagement data");
    } finally {
      setIsLoading(false);
    }
  }

  async function createTopic() {
    if (!newTopic.title) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/engagement/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTopic)
      });

      if (res.ok) {
        toast.success("Topic created successfully");
        setIsTopicDialogOpen(false);
        setNewTopic({
          title: "",
          description: "",
          category: "general",
          visibility: "public",
          targetAudience: []
        });
        fetchEngagementData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create topic");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateTopic() {
    if (!editingTopic) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/engagement/topics/${editingTopic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTopic)
      });

      if (res.ok) {
        toast.success("Topic updated successfully");
        setEditingTopic(null);
        fetchEngagementData();
      } else {
        toast.error("Failed to update topic");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteTopic(id: number) {
    if (!confirm("Are you sure you want to delete this topic? All associated polls will also be deleted.")) return;

    try {
      const res = await fetch(`/api/admin/engagement/topics/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Topic deleted");
        fetchEngagementData();
      } else {
        toast.error("Failed to delete topic");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function createPoll() {
    if (!newPoll.topicId || !newPoll.question) {
      toast.error("Topic and question are required");
      return;
    }

    const validOptions = newPoll.options.filter(opt => opt.label.trim());
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/engagement/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPoll,
          topicId: parseInt(newPoll.topicId),
          options: validOptions
        })
      });

      if (res.ok) {
        toast.success("Poll created successfully");
        setIsPollDialogOpen(false);
        setNewPoll({
          topicId: "",
          question: "",
          pollType: "single",
          description: "",
          isAnonymous: false,
          showResults: true,
          resultsVisibility: "after_vote",
          startDate: "",
          endDate: "",
          status: "draft",
          options: [
            { label: "", description: "" },
            { label: "", description: "" }
          ]
        });
        fetchEngagementData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create poll");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  async function updatePollStatus(pollId: number, status: string) {
    try {
      const res = await fetch(`/api/admin/engagement/polls/${pollId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast.success(`Poll ${status === "published" ? "published" : "updated"}`);
        fetchEngagementData();
      } else {
        toast.error("Failed to update poll");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function deletePoll(id: number) {
    if (!confirm("Are you sure you want to delete this poll? All responses will also be deleted.")) return;

    try {
      const res = await fetch(`/api/admin/engagement/polls/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Poll deleted");
        fetchEngagementData();
      } else {
        toast.error("Failed to delete poll");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function createSchedule() {
    if (!newSchedule.scheduledDate || !newSchedule.topicId) {
      toast.error("Date and topic are required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/engagement/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSchedule,
          topicId: parseInt(newSchedule.topicId)
        })
      });

      if (res.ok) {
        toast.success("Schedule created successfully");
        setIsScheduleDialogOpen(false);
        setNewSchedule({ scheduledDate: "", topicId: "" });
        fetchEngagementData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create schedule");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSchedule(id: number) {
    if (!confirm("Are you sure you want to remove this schedule?")) return;

    try {
      const res = await fetch(`/api/admin/engagement/schedule?id=${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Schedule removed");
        fetchEngagementData();
      } else {
        toast.error("Failed to remove schedule");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  const addPollOption = () => {
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, { label: "", description: "" }]
    });
  };

  const removePollOption = (index: number) => {
    if (newPoll.options.length <= 2) return;
    setNewPoll({
      ...newPoll,
      options: newPoll.options.filter((_, i) => i !== index)
    });
  };

  const updatePollOption = (index: number, field: string, value: string) => {
    const updated = [...newPoll.options];
    updated[index] = { ...updated[index], [field]: value };
    setNewPoll({ ...newPoll, options: updated });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = pollStatuses.find(s => s.value === status);
    return statusConfig?.color || "bg-slate-100 text-slate-700";
  };

  const filteredPolls = polls.filter(poll => 
    poll.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    poll.topic.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Engagement Management</h1>
          <p className="text-slate-600 mt-1">Create polls, surveys, and schedule daily engagement content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{topics.length}</p>
                <p className="text-sm text-slate-600">Topics</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Vote className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{polls.length}</p>
                <p className="text-sm text-slate-600">Total Polls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{polls.filter(p => p.status === "published").length}</p>
                <p className="text-sm text-slate-600">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{polls.reduce((acc, p) => acc + p.responseCount, 0)}</p>
                <p className="text-sm text-slate-600">Total Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="polls" className="gap-2">
              <Vote className="h-4 w-4" />
              Polls
            </TabsTrigger>
            <TabsTrigger value="topics" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Topics
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {activeTab === "polls" && (
              <Button onClick={() => setIsPollDialogOpen(true)} data-testid="button-add-poll">
                <Plus className="h-4 w-4 mr-2" />
                Add Poll
              </Button>
            )}
            {activeTab === "topics" && (
              <Button onClick={() => setIsTopicDialogOpen(true)} data-testid="button-add-topic">
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            )}
            {activeTab === "schedule" && (
              <Button onClick={() => setIsScheduleDialogOpen(true)} data-testid="button-add-schedule">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Survey
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="polls" className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search polls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-polls"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredPolls.length === 0 ? (
                <div className="text-center py-12">
                  <Vote className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900">No polls yet</h3>
                  <p className="text-slate-500 mt-1">Create your first poll to start engaging your audience</p>
                  <Button className="mt-4" onClick={() => setIsPollDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Poll
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPolls.map((poll) => (
                    <div key={poll.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors" data-testid={`poll-item-${poll.id}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusBadge(poll.status)}>
                              {poll.status}
                            </Badge>
                            <Badge variant="outline">
                              {pollTypes.find(t => t.value === poll.pollType)?.label || poll.pollType}
                            </Badge>
                            <Badge variant="secondary">{poll.topic.title}</Badge>
                          </div>
                          <h3 className="font-medium text-slate-900">{poll.question}</h3>
                          {poll.description && (
                            <p className="text-sm text-slate-500 mt-1">{poll.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {poll.responseCount} responses
                            </span>
                            <span className="flex items-center gap-1">
                              <ListChecks className="h-4 w-4" />
                              {poll.options.length} options
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {poll.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updatePollStatus(poll.id, "published")}
                              className="text-green-600"
                              data-testid={`button-publish-poll-${poll.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {poll.status === "published" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updatePollStatus(poll.id, "closed")}
                              className="text-red-600"
                              data-testid={`button-close-poll-${poll.id}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePoll(poll.id)}
                            className="text-red-600"
                            data-testid={`button-delete-poll-${poll.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {poll.options.length > 0 && poll.status !== "draft" && (
                        <div className="mt-4 space-y-2">
                          {poll.options.map((option) => {
                            const percentage = poll.responseCount > 0 
                              ? Math.round((option.responseCount / poll.responseCount) * 100) 
                              : 0;
                            return (
                              <div key={option.id} className="relative">
                                <div 
                                  className="absolute inset-0 bg-primary/10 rounded"
                                  style={{ width: `${percentage}%` }}
                                />
                                <div className="relative flex items-center justify-between px-3 py-2">
                                  <span className="text-sm">{option.label}</span>
                                  <span className="text-sm font-medium">{percentage}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              {topics.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900">No topics yet</h3>
                  <p className="text-slate-500 mt-1">Create topics to organize your polls and surveys</p>
                  <Button className="mt-4" onClick={() => setIsTopicDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Topic
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {topics.map((topic) => (
                    <div key={topic.id} className="border rounded-lg p-4 hover:border-primary/50 transition-colors" data-testid={`topic-item-${topic.id}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={topic.isActive ? "default" : "secondary"}>
                              {topic.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{topic.category}</Badge>
                          </div>
                          <h3 className="font-medium text-slate-900">{topic.title}</h3>
                          {topic.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{topic.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-3 text-sm text-slate-500">
                            <span>{topic._count.polls} polls</span>
                            <span>{topic._count.schedules} scheduled</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTopic(topic)}
                            data-testid={`button-edit-topic-${topic.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTopic(topic.id)}
                            className="text-red-600"
                            data-testid={`button-delete-topic-${topic.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              {schedules.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900">No schedules yet</h3>
                  <p className="text-slate-500 mt-1">Schedule daily surveys to engage your audience</p>
                  <Button className="mt-4" onClick={() => setIsScheduleDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Survey
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between border rounded-lg p-4" data-testid={`schedule-item-${schedule.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {new Date(schedule.scheduledDate).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </p>
                          <p className="text-sm text-slate-500">Topic: {schedule.topic.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={schedule.status === "published" ? "default" : "secondary"}>
                          {schedule.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSchedule(schedule.id)}
                          className="text-red-600"
                          data-testid={`button-delete-schedule-${schedule.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Topic Dialog */}
      <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Engagement Topic</DialogTitle>
            <DialogDescription>
              Topics help organize your polls and surveys by category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="topic-title">Title *</Label>
              <Input
                id="topic-title"
                value={newTopic.title}
                onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                placeholder="e.g., Career Development"
                data-testid="input-topic-title"
              />
            </div>
            <div>
              <Label htmlFor="topic-description">Description</Label>
              <Textarea
                id="topic-description"
                value={newTopic.description}
                onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                placeholder="Brief description of this topic..."
                data-testid="input-topic-description"
              />
            </div>
            <div>
              <Label htmlFor="topic-category">Category</Label>
              <Select value={newTopic.category} onValueChange={(v) => setNewTopic({ ...newTopic, category: v })}>
                <SelectTrigger data-testid="select-topic-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {topicCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTopicDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTopic} disabled={isSaving} data-testid="button-save-topic">
              {isSaving ? "Creating..." : "Create Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Topic Dialog */}
      <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>
          {editingTopic && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-topic-title">Title *</Label>
                <Input
                  id="edit-topic-title"
                  value={editingTopic.title}
                  onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                  data-testid="input-edit-topic-title"
                />
              </div>
              <div>
                <Label htmlFor="edit-topic-description">Description</Label>
                <Textarea
                  id="edit-topic-description"
                  value={editingTopic.description || ""}
                  onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                  data-testid="input-edit-topic-description"
                />
              </div>
              <div>
                <Label htmlFor="edit-topic-category">Category</Label>
                <Select value={editingTopic.category} onValueChange={(v) => setEditingTopic({ ...editingTopic, category: v })}>
                  <SelectTrigger data-testid="select-edit-topic-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topicCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-topic-active">Active</Label>
                <Switch
                  id="edit-topic-active"
                  checked={editingTopic.isActive}
                  onCheckedChange={(v) => setEditingTopic({ ...editingTopic, isActive: v })}
                  data-testid="switch-edit-topic-active"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTopic(null)}>
              Cancel
            </Button>
            <Button onClick={updateTopic} disabled={isSaving} data-testid="button-update-topic">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Poll Dialog */}
      <Dialog open={isPollDialogOpen} onOpenChange={setIsPollDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Poll</DialogTitle>
            <DialogDescription>
              Create an engaging poll for your audience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="poll-topic">Topic *</Label>
                <Select value={newPoll.topicId} onValueChange={(v) => setNewPoll({ ...newPoll, topicId: v })}>
                  <SelectTrigger data-testid="select-poll-topic">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="poll-type">Poll Type</Label>
                <Select value={newPoll.pollType} onValueChange={(v) => setNewPoll({ ...newPoll, pollType: v })}>
                  <SelectTrigger data-testid="select-poll-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pollTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="poll-question">Question *</Label>
              <Input
                id="poll-question"
                value={newPoll.question}
                onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                placeholder="What would you like to ask?"
                data-testid="input-poll-question"
              />
            </div>

            <div>
              <Label htmlFor="poll-description">Description (optional)</Label>
              <Textarea
                id="poll-description"
                value={newPoll.description}
                onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                placeholder="Add more context to your question..."
                data-testid="input-poll-description"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Answer Options</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPollOption} data-testid="button-add-option">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {newPoll.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) => updatePollOption(index, "label", e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      data-testid={`input-poll-option-${index}`}
                    />
                    {newPoll.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePollOption(index)}
                        className="text-red-600"
                        data-testid={`button-remove-option-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="poll-anonymous">Anonymous Voting</Label>
                <Switch
                  id="poll-anonymous"
                  checked={newPoll.isAnonymous}
                  onCheckedChange={(v) => setNewPoll({ ...newPoll, isAnonymous: v })}
                  data-testid="switch-poll-anonymous"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="poll-show-results">Show Results</Label>
                <Switch
                  id="poll-show-results"
                  checked={newPoll.showResults}
                  onCheckedChange={(v) => setNewPoll({ ...newPoll, showResults: v })}
                  data-testid="switch-poll-show-results"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="poll-status">Status</Label>
              <Select value={newPoll.status} onValueChange={(v) => setNewPoll({ ...newPoll, status: v })}>
                <SelectTrigger data-testid="select-poll-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Publish Immediately</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPollDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createPoll} disabled={isSaving} data-testid="button-save-poll">
              {isSaving ? "Creating..." : "Create Poll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Survey Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Daily Survey</DialogTitle>
            <DialogDescription>
              Schedule a topic to be featured on a specific date
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="schedule-date">Date *</Label>
              <Input
                id="schedule-date"
                type="date"
                value={newSchedule.scheduledDate}
                onChange={(e) => setNewSchedule({ ...newSchedule, scheduledDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                data-testid="input-schedule-date"
              />
            </div>
            <div>
              <Label htmlFor="schedule-topic">Topic *</Label>
              <Select value={newSchedule.topicId} onValueChange={(v) => setNewSchedule({ ...newSchedule, topicId: v })}>
                <SelectTrigger data-testid="select-schedule-topic">
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.filter(t => t.isActive).map((topic) => (
                    <SelectItem key={topic.id} value={topic.id.toString()}>
                      {topic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createSchedule} disabled={isSaving} data-testid="button-save-schedule">
              {isSaving ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
