"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Calendar, MapPin, Globe, Users, IndianRupee, ArrowLeft, Edit, Image as ImageIcon, Tag, X, Loader2 } from "@/lib/icons";

const EVENT_CATEGORIES = [
  "workshop", "bootcamp", "conference", "webinar", "meetup", "hackathon", "seminar", "networking"
];

const EVENT_LEVELS = ["beginner", "intermediate", "advanced", "all_levels"];

const EVENT_MODES = ["online", "offline", "hybrid"];

const TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Singapore",
];

interface EventFormData {
  title: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  category: string;
  tags: string[];
  level: string;
  eventType: string;
  mode: string;
  startDate: string;
  endDate: string;
  timezone: string;
  capacity: number | null;
  price: number;
  venue: string;
  venueAddress: string;
  onlineLink: string;
  virtualLinkHidden: boolean;
  requiresApproval: boolean;
  status: string;
}

function formatDateForInput(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [formData, setFormData] = useState<EventFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            title: data.title || "",
            shortDescription: data.shortDescription || "",
            description: data.description || "",
            coverImage: data.coverImage || "",
            category: data.category || "workshop",
            tags: data.tags || [],
            level: data.level || "all_levels",
            eventType: data.eventType || "single",
            mode: data.mode || "online",
            startDate: formatDateForInput(data.startDate),
            endDate: formatDateForInput(data.endDate),
            timezone: data.timezone || "Asia/Kolkata",
            capacity: data.capacity,
            price: Number(data.price) || 0,
            venue: data.venue || "",
            venueAddress: data.venueAddress || "",
            onlineLink: data.onlineLink || "",
            virtualLinkHidden: data.virtualLinkHidden ?? true,
            requiresApproval: data.requiresApproval ?? false,
            status: data.status || "draft",
          });
        } else {
          toast.error("Event not found or access denied");
          router.push("/dashboard");
        }
      } catch (error) {
        toast.error("Failed to load event");
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, [eventId, router]);

  if (isLoading || !formData) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="mb-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[400px] w-full rounded-lg" />
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[250px] w-full rounded-lg" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  function updateField<K extends keyof EventFormData>(key: K, value: EventFormData[K]) {
    setFormData(prev => prev ? { ...prev, [key]: value } : prev);
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (formData && tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      updateField("tags", [...formData.tags, tag]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    if (formData) {
      updateField("tags", formData.tags.filter(t => t !== tag));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData) return;
    
    if (!formData.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error("Please set event dates");
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity || null,
          price: formData.price || 0,
        }),
      });

      if (res.ok) {
        toast.success("Event updated successfully!");
        router.push("/dashboard");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update event");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
              <Edit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900" data-testid="text-page-title">Edit Event</h1>
              <p className="text-slate-600">Update your event details</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>The essentials about your event</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Advanced React Workshop"
                      value={formData.title}
                      onChange={e => updateField("title", e.target.value)}
                      className="mt-1"
                      data-testid="input-event-title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="shortDescription">Short Description</Label>
                    <Input
                      id="shortDescription"
                      placeholder="A brief one-liner about your event"
                      value={formData.shortDescription}
                      onChange={e => updateField("shortDescription", e.target.value)}
                      className="mt-1"
                      maxLength={160}
                      data-testid="input-event-short-description"
                    />
                    <p className="text-xs text-slate-500 mt-1">{formData.shortDescription.length}/160 characters</p>
                  </div>

                  <div>
                    <Label htmlFor="description">Full Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your event in detail. What will attendees learn? What's the agenda?"
                      value={formData.description}
                      onChange={e => updateField("description", e.target.value)}
                      className="mt-1 min-h-[150px]"
                      data-testid="input-event-description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={v => updateField("category", v)}>
                        <SelectTrigger className="mt-1" data-testid="select-event-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="level">Level</Label>
                      <Select value={formData.level} onValueChange={v => updateField("level", v)}>
                        <SelectTrigger className="mt-1" data-testid="select-event-level">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_LEVELS.map(level => (
                            <SelectItem key={level} value={level}>
                              {level.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="Add a tag"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                        data-testid="input-event-tag"
                      />
                      <Button type="button" variant="outline" onClick={addTag} data-testid="button-add-tag">
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-1">{formData.tags.length}/5 tags</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Date & Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date & Time *</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={e => updateField("startDate", e.target.value)}
                        className="mt-1"
                        data-testid="input-event-start-date"
                      />
                    </div>

                    <div>
                      <Label htmlFor="endDate">End Date & Time *</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={e => updateField("endDate", e.target.value)}
                        className="mt-1"
                        data-testid="input-event-end-date"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={formData.timezone} onValueChange={v => updateField("timezone", v)}>
                      <SelectTrigger className="mt-1" data-testid="select-event-timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map(tz => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Event Mode</Label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {EVENT_MODES.map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateField("mode", mode)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.mode === mode
                              ? "border-primary bg-primary/5"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                          data-testid={`button-mode-${mode}`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {mode === "online" && <Globe className="h-4 w-4" />}
                            {mode === "offline" && <MapPin className="h-4 w-4" />}
                            {mode === "hybrid" && <Users className="h-4 w-4" />}
                            <span className="capitalize font-medium">{mode}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(formData.mode === "offline" || formData.mode === "hybrid") && (
                    <>
                      <div>
                        <Label htmlFor="venue">Venue Name</Label>
                        <Input
                          id="venue"
                          placeholder="e.g., WeWork, Tech Hub"
                          value={formData.venue}
                          onChange={e => updateField("venue", e.target.value)}
                          className="mt-1"
                          data-testid="input-event-venue"
                        />
                      </div>
                      <div>
                        <Label htmlFor="venueAddress">Venue Address</Label>
                        <Textarea
                          id="venueAddress"
                          placeholder="Full address of the venue"
                          value={formData.venueAddress}
                          onChange={e => updateField("venueAddress", e.target.value)}
                          className="mt-1"
                          data-testid="input-event-venue-address"
                        />
                      </div>
                    </>
                  )}

                  {(formData.mode === "online" || formData.mode === "hybrid") && (
                    <>
                      <div>
                        <Label htmlFor="onlineLink">Meeting Link</Label>
                        <Input
                          id="onlineLink"
                          placeholder="https://zoom.us/j/..."
                          value={formData.onlineLink}
                          onChange={e => updateField("onlineLink", e.target.value)}
                          className="mt-1"
                          data-testid="input-event-online-link"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Hide Link Until Registration</Label>
                          <p className="text-xs text-slate-500">Only show meeting link to registered attendees</p>
                        </div>
                        <Switch
                          checked={formData.virtualLinkHidden}
                          onCheckedChange={v => updateField("virtualLinkHidden", v)}
                          data-testid="switch-virtual-link-hidden"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Cover Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 mb-3">
                    <img
                      src={formData.coverImage}
                      alt="Event cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Input
                    placeholder="Cover image URL"
                    value={formData.coverImage}
                    onChange={e => updateField("coverImage", e.target.value)}
                    data-testid="input-event-cover-image"
                  />
                  <p className="text-xs text-slate-500 mt-1">Recommended: 1200x600px</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-primary" />
                    Pricing & Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="price">Price (INR)</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        placeholder="0 for free"
                        value={formData.price || ""}
                        onChange={e => updateField("price", parseInt(e.target.value) || 0)}
                        className="pl-8"
                        data-testid="input-event-price"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Leave 0 for a free event</p>
                  </div>

                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={formData.capacity || ""}
                      onChange={e => updateField("capacity", e.target.value ? parseInt(e.target.value) : null)}
                      className="mt-1"
                      data-testid="input-event-capacity"
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave empty for unlimited</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <Label>Require Approval</Label>
                      <p className="text-xs text-slate-500">Manually approve each registration</p>
                    </div>
                    <Switch
                      checked={formData.requiresApproval}
                      onCheckedChange={v => updateField("requiresApproval", v)}
                      data-testid="switch-requires-approval"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-50">
                <CardHeader>
                  <CardTitle>Update Event</CardTitle>
                  <CardDescription>
                    Save changes or update status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    disabled={isSubmitting}
                    data-testid="button-update-event"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  
                  {formData.status === "draft" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-green-600 border-green-200 hover:bg-green-50"
                      disabled={isSubmitting}
                      onClick={async () => {
                        updateField("status", "published");
                        const form = document.querySelector("form") as HTMLFormElement;
                        form?.requestSubmit();
                      }}
                      data-testid="button-publish-event"
                    >
                      Publish Event
                    </Button>
                  )}

                  <Link href={`/events/${eventId}`} className="block">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                    >
                      View Event Page
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
