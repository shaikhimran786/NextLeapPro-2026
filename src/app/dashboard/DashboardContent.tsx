"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Users, 
  Briefcase, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  Star,
  BookOpen,
  Target,
  Award,
  Crown,
  Plus,
  Edit,
  Trash2,
  Globe,
  Lock
} from "@/lib/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatINR, formatDateTime } from "@/lib/utils";
import { SmartAvatarImage } from "@/components/ui/smart-image";
import { ImageOff } from "@/lib/icons";
import { getImageUrl, isValidImageSrc } from "@/lib/image-utils";

interface CreatedCommunity {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo: string;
  category: string;
  isPublic: boolean;
  _count?: { members: number };
}

interface CreatedEvent {
  id: number;
  title: string;
  slug: string | null;
  shortDescription: string | null;
  coverImage: string;
  category: string;
  mode: string;
  startDate: string;
  endDate: string;
  status: string;
  featured: boolean;
  price: number;
  capacity: number | null;
  _count?: { registrations: number };
}

interface UserData {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    subscriptionTier: string;
    subscriptionExpiry: string | null;
    hasSeenFeatureDemo?: boolean;
  };
  registeredEvents: Array<{
    id: number;
    event: {
      id: number;
      title: string;
      startDate: string;
      mode: string;
      coverImage: string;
    };
    status: string;
  }>;
  joinedCommunities: Array<{
    id: number;
    community: {
      id: number;
      name: string;
      logo: string;
      category: string;
    };
    role: string;
  }>;
  offeredServices: Array<{
    id: number;
    title: string;
    category: string;
    price: number;
    rating: number;
    reviewCount: number;
    coverImage: string;
    isActive: boolean;
    status: string;
  }>;
  createdCommunities?: CreatedCommunity[];
  createdEvents?: CreatedEvent[];
  isCreator?: boolean;
  stats: {
    eventsAttended: number;
    communitiesJoined: number;
    skillsLearned: number;
    servicesOffered: number;
    eventsCreated?: number;
  };
}

interface NewCommunity {
  name: string;
  description: string;
  category: string;
  location: string;
  logo: string;
  website: string;
  isPublic: boolean;
}

const defaultNewCommunity: NewCommunity = {
  name: "",
  description: "",
  category: "",
  location: "",
  logo: "",
  website: "",
  isPublic: true,
};

const MAX_CREATOR_COMMUNITIES = 3;

interface DashboardContentProps {
  initialPlansData?: {
    plans: Array<{
      name: string;
      price: number;
      interval: string;
      features: string[];
      isPopular: boolean;
      active: boolean;
    }>;
  };
}

export default function DashboardContent({ initialPlansData }: DashboardContentProps = {}) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createdCommunities, setCreatedCommunities] = useState<CreatedCommunity[]>([]);
  const [createdEvents, setCreatedEvents] = useState<CreatedEvent[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState<NewCommunity>(defaultNewCommunity);
  const [editingCommunity, setEditingCommunity] = useState<CreatedCommunity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchAllData() {
      try {
        // Fetch dashboard data first to determine if user is creator
        const dashboardRes = await fetch("/api/user/dashboard");
        if (!dashboardRes.ok) {
          setIsLoading(false);
          return;
        }
        const dashboardData = await dashboardRes.json();
        setUserData(dashboardData);

        // If user is creator, fetch communities and events in parallel
        if (dashboardData.isCreator) {
          const [communitiesRes] = await Promise.all([
            fetch("/api/communities?owned=true"),
          ]);

          if (communitiesRes.ok) {
            const communitiesData = await communitiesRes.json();
            setCreatedCommunities(communitiesData.communities || []);
          }

          // Set created events from dashboard data
          if (dashboardData.createdEvents) {
            setCreatedEvents(dashboardData.createdEvents as CreatedEvent[]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllData();
  }, []);

  async function fetchCreatedEvents() {
    try {
      const res = await fetch("/api/user/dashboard");
      if (res.ok) {
        const data = await res.json();
        if (data.createdEvents) {
          setCreatedEvents(data.createdEvents as CreatedEvent[]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch created events:", error);
    }
  }

  async function fetchCreatedCommunities() {
    try {
      const res = await fetch("/api/communities?owned=true");
      if (res.ok) {
        const data = await res.json();
        setCreatedCommunities(data.communities || []);
      }
    } catch (error) {
      console.error("Failed to fetch created communities");
    }
  }

  async function createCommunity() {
    if (!newCommunity.name || !newCommunity.description || !newCommunity.category) {
      toast.error("Please fill in required fields: Name, Description, and Category");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCommunity),
      });

      if (res.ok) {
        toast.success("Community created successfully!");
        setIsCreateDialogOpen(false);
        setNewCommunity(defaultNewCommunity);
        fetchCreatedCommunities();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create community");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateCommunity() {
    if (!editingCommunity) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/communities/${editingCommunity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCommunity),
      });

      if (res.ok) {
        toast.success("Community updated successfully!");
        setIsEditDialogOpen(false);
        setEditingCommunity(null);
        fetchCreatedCommunities();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update community");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteCommunity(id: number) {
    if (!confirm("Are you sure you want to delete this community? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/communities/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Community deleted successfully");
        fetchCreatedCommunities();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete community");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function deleteEvent(id: number) {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Event deleted successfully");
        setCreatedEvents(prev => prev.filter(e => e.id !== id));
        fetchCreatedEvents();
      } else {
        const data = await res.json();
        if (data.hasRegistrations) {
          toast.error("Cannot delete: This event has registrations. Cancel it first and notify attendees.");
        } else {
          toast.error(data.error || "Failed to delete event");
        }
      }
    } catch (error) {
      toast.error("An error occurred while deleting the event");
    }
  }

  async function publishEvent(id: number) {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });

      if (res.ok) {
        toast.success("Event published successfully! It's now visible to everyone.");
        setCreatedEvents(prev => prev.map(e => e.id === id ? { ...e, status: "published" } : e));
        fetchCreatedEvents();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to publish event");
      }
    } catch (error) {
      toast.error("An error occurred while publishing the event");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar initialPlansData={initialPlansData} />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar initialPlansData={initialPlansData} />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600 mb-4">Unable to load dashboard data.</p>
            <Link href="/auth/login?redirect=/dashboard">
              <Button>Sign In</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const data = userData;
  const isPro = data.user.subscriptionTier !== "free";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialPlansData={initialPlansData} />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">
                Welcome back, {data.user.firstName}!
              </h1>
              <p className="text-slate-600 mt-1">
                Track your progress and continue your learning journey.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/events">
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Browse Events
                </Button>
              </Link>
              {data.isCreator && (
                <>
                  <Link href="/events/create">
                    <Button className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-500" data-testid="button-dashboard-create-event">
                      <Plus className="h-4 w-4" />
                      Create Event
                    </Button>
                  </Link>
                  <Link href="/communities/create">
                    <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500" data-testid="button-dashboard-create-community">
                      <Plus className="h-4 w-4" />
                      Create Community
                    </Button>
                  </Link>
                </>
              )}
              {!isPro && (
                <Link href="/pricing">
                  <Button className="gap-2 bg-gradient-primary">
                    <TrendingUp className="h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{data.stats.eventsAttended}</p>
                    <p className="text-sm text-slate-500">Events Attended</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{data.stats.communitiesJoined}</p>
                    <p className="text-sm text-slate-500">Communities</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{data.stats.skillsLearned}</p>
                    <p className="text-sm text-slate-500">Skills Learned</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-none shadow-sm ${isPro ? 'bg-gradient-primary text-white' : 'bg-white'}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${isPro ? 'bg-white/20' : 'bg-primary/10'} flex items-center justify-center`}>
                    <CreditCard className={`h-6 w-6 ${isPro ? 'text-white' : 'text-primary'}`} />
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${isPro ? 'text-white' : 'text-slate-900'}`}>
                      {data.user.subscriptionTier.charAt(0).toUpperCase() + data.user.subscriptionTier.slice(1)} Plan
                    </p>
                    <p className={`text-sm ${isPro ? 'text-white/80' : 'text-slate-500'}`}>
                      {isPro ? 'Active' : 'Free tier'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Upcoming Events
                  </CardTitle>
                  <Link href="/events" className="text-sm text-primary hover:underline">
                    View All
                  </Link>
                </CardHeader>
                <CardContent>
                  {data.registeredEvents.length > 0 ? (
                    <div className="space-y-4">
                      {data.registeredEvents.slice(0, 3).map((reg) => (
                        <div key={reg.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="h-16 w-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                            {reg.event.coverImage && (
                              <img src={reg.event.coverImage} alt={reg.event.title} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="font-medium text-slate-900 truncate">{reg.event.title}</h4>
                            <p className="text-sm text-slate-500" suppressHydrationWarning>
                              {formatDateTime(reg.event.startDate)}
                            </p>
                            <Badge variant="secondary" className="mt-1">{reg.event.mode}</Badge>
                          </div>
                          <Link href={`/events/${reg.event.id}`}>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500">No upcoming events</p>
                      <Link href="/events">
                        <Button variant="link" className="mt-2">Browse Events</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Your Communities
                  </CardTitle>
                  <Link href="/communities" className="text-sm text-primary hover:underline">
                    View All
                  </Link>
                </CardHeader>
                <CardContent>
                  {data.joinedCommunities.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {data.joinedCommunities.slice(0, 4).map((membership) => (
                        <div key={membership.id} className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 transition-colors">
                          <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                            <SmartAvatarImage
                              src={membership.community.logo}
                              alt={membership.community.name}
                              className="h-full w-full object-cover"
                              fallbackClassName="h-full w-full"
                            />
                          </div>
                          <div className="min-w-0 flex-grow">
                            <h4 className="font-medium text-slate-900 truncate">{membership.community.name}</h4>
                            <p className="text-xs text-slate-500">{membership.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500">You haven't joined any communities yet</p>
                      <Link href="/communities">
                        <Button variant="link" className="mt-2">Explore Communities</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    My Services
                  </CardTitle>
                  <Link href="/services/create" className="text-sm text-primary hover:underline">
                    Offer Service
                  </Link>
                </CardHeader>
                <CardContent>
                  {data.offeredServices && data.offeredServices.length > 0 ? (
                    <div className="space-y-4">
                      {data.offeredServices.slice(0, 3).map((service) => (
                        <div key={service.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="h-16 w-20 rounded-lg overflow-hidden flex-shrink-0">
                            <SmartAvatarImage
                              src={service.coverImage}
                              alt={service.title}
                              className="h-full w-full object-cover"
                              fallbackClassName="h-full w-full"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="font-medium text-slate-900 truncate">{service.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span suppressHydrationWarning>{formatINR(service.price)}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span>{Number(service.rating).toFixed(1)}</span>
                              </div>
                            </div>
                            <Badge 
                              variant={service.isActive && service.status === "active" ? "secondary" : "destructive"} 
                              className="mt-1 text-xs"
                            >
                              {service.isActive && service.status === "active" ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <Link href={`/services/${service.id}`}>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                      {data.offeredServices.length > 3 && (
                        <Link href="/services" className="block text-center text-sm text-primary hover:underline pt-2">
                          View all {data.offeredServices.length} services
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500">You haven't offered any services yet</p>
                      <p className="text-sm text-slate-400 mt-1">Share your skills and earn money</p>
                      <Link href="/services/create">
                        <Button variant="link" className="mt-2">Offer a Service</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {data.isCreator && (
                <Card className="border-none shadow-sm border-2 border-amber-100">
                  <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-500" />
                      My Created Communities
                      <Badge variant="outline" className="ml-2 text-xs bg-white">
                        {createdCommunities.length}/{MAX_CREATOR_COMMUNITIES}
                      </Badge>
                    </CardTitle>
                    {createdCommunities.length < MAX_CREATOR_COMMUNITIES && (
                      <Button
                        size="sm"
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-gradient-primary"
                        data-testid="button-add-creator-community"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Community
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4">
                    {createdCommunities.length > 0 ? (
                      <div className="space-y-4">
                        {createdCommunities.map((community) => (
                          <div key={community.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border">
                            <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                              <SmartAvatarImage
                                src={community.logo}
                                alt={community.name}
                                className="h-full w-full object-cover"
                                fallbackClassName="h-full w-full"
                              />
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-slate-900 truncate">{community.name}</h4>
                                {community.isPublic ? (
                                  <Globe className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Lock className="h-3 w-3 text-slate-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-500">
                                <span>{community.category}</span>
                                <span>•</span>
                                <span>{community._count?.members || 0} members</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCommunity(community);
                                  setIsEditDialogOpen(true);
                                }}
                                data-testid={`button-edit-creator-community-${community.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteCommunity(community.id)}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-delete-creator-community-${community.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Crown className="h-12 w-12 mx-auto text-amber-200 mb-3" />
                        <p className="text-slate-500">You haven't created any communities yet</p>
                        <p className="text-sm text-slate-400 mt-1">As a Creator, you can create up to {MAX_CREATOR_COMMUNITIES} communities</p>
                        <Button
                          variant="link"
                          className="mt-2"
                          onClick={() => setIsCreateDialogOpen(true)}
                        >
                          Create Your First Community
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {data.isCreator && (
                <Card className="border-none shadow-sm border-2 border-purple-100">
                  <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      My Created Events
                      <Badge variant="outline" className="ml-2 text-xs bg-white">
                        {createdEvents.length} events
                      </Badge>
                    </CardTitle>
                    <Link href="/events/create">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-indigo-500"
                        data-testid="button-add-creator-event"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create Event
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {createdEvents.length > 0 ? (
                      <div className="space-y-4">
                        {createdEvents.map((event) => (
                          <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border">
                            <div className="h-12 w-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                              {isValidImageSrc(event.coverImage) && (
                                <img src={getImageUrl(event.coverImage)} alt={event.title} className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-slate-900 truncate">{event.title}</h4>
                                <Badge variant={event.status === "published" ? "secondary" : "outline"} className="text-xs">
                                  {event.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-500">
                                <span>{event.category}</span>
                                <span>•</span>
                                <span>{event.mode}</span>
                                <span>•</span>
                                <span>{event._count?.registrations || 0} registrations</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {event.status === "draft" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => publishEvent(event.id)}
                                  className="text-green-600 hover:text-green-700"
                                  data-testid={`button-publish-creator-event-${event.id}`}
                                >
                                  Publish
                                </Button>
                              )}
                              <Link href={`/events/${event.id}/edit`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-edit-creator-event-${event.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteEvent(event.id)}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-delete-creator-event-${event.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto text-purple-200 mb-3" />
                        <p className="text-slate-500">You haven't created any events yet</p>
                        <p className="text-sm text-slate-400 mt-1">As a Creator, you can create unlimited events</p>
                        <Link href="/events/create">
                          <Button
                            variant="link"
                            className="mt-2"
                          >
                            Create Your First Event
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Profile Completion</span>
                      <span className="font-medium">60%</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Monthly Goal</span>
                      <span className="font-medium">2/5 events</span>
                    </div>
                    <Progress value={40} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-blue-50">
                <CardContent className="p-6">
                  <Award className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-heading font-semibold text-lg text-slate-900 mb-2">
                    Unlock Premium Features
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Get access to exclusive events, recordings, and certificates.
                  </p>
                  <Link href="/pricing">
                    <Button className="w-full rounded-full bg-gradient-primary">
                      Explore Plans
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/events" className="block">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Calendar className="h-4 w-4" />
                      Register for an Event
                    </Button>
                  </Link>
                  <Link href="/communities" className="block">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Users className="h-4 w-4" />
                      Join a Community
                    </Button>
                  </Link>
                  <Link href="/services" className="block">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Briefcase className="h-4 w-4" />
                      Hire a Mentor
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Create New Community
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-name">Name *</Label>
              <Input
                id="new-name"
                value={newCommunity.name}
                onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                placeholder="Enter community name"
                data-testid="input-creator-community-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-description">Description *</Label>
              <Textarea
                id="new-description"
                value={newCommunity.description}
                onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                rows={3}
                placeholder="Describe your community"
                data-testid="input-creator-community-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-category">Category *</Label>
                <Input
                  id="new-category"
                  value={newCommunity.category}
                  onChange={(e) => setNewCommunity({ ...newCommunity, category: e.target.value })}
                  placeholder="e.g., Technology, Business"
                  data-testid="input-creator-community-category"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-location">Location</Label>
                <Input
                  id="new-location"
                  value={newCommunity.location}
                  onChange={(e) => setNewCommunity({ ...newCommunity, location: e.target.value })}
                  placeholder="e.g., Mumbai, India"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-logo">Logo URL</Label>
                <Input
                  id="new-logo"
                  value={newCommunity.logo}
                  onChange={(e) => setNewCommunity({ ...newCommunity, logo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-website">Website</Label>
                <Input
                  id="new-website"
                  value={newCommunity.website}
                  onChange={(e) => setNewCommunity({ ...newCommunity, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="new-isPublic"
                checked={newCommunity.isPublic}
                onCheckedChange={(checked) => setNewCommunity({ ...newCommunity, isPublic: checked })}
              />
              <Label htmlFor="new-isPublic">Public Community</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setNewCommunity(defaultNewCommunity);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={createCommunity} 
              disabled={isSubmitting}
              data-testid="button-create-creator-community"
            >
              {isSubmitting ? "Creating..." : "Create Community"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Community
            </DialogTitle>
          </DialogHeader>
          {editingCommunity && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingCommunity.name}
                  onChange={(e) => setEditingCommunity({ ...editingCommunity, name: e.target.value })}
                  data-testid="input-edit-creator-community-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingCommunity.description}
                  onChange={(e) => setEditingCommunity({ ...editingCommunity, description: e.target.value })}
                  rows={3}
                  data-testid="input-edit-creator-community-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={editingCommunity.category}
                    onChange={(e) => setEditingCommunity({ ...editingCommunity, category: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-logo">Logo URL</Label>
                  <Input
                    id="edit-logo"
                    value={editingCommunity.logo}
                    onChange={(e) => setEditingCommunity({ ...editingCommunity, logo: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isPublic"
                  checked={editingCommunity.isPublic}
                  onCheckedChange={(checked) => setEditingCommunity({ ...editingCommunity, isPublic: checked })}
                />
                <Label htmlFor="edit-isPublic">Public Community</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingCommunity(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={updateCommunity} 
              disabled={isSubmitting}
              data-testid="button-update-creator-community"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
