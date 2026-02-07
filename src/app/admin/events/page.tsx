"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar, Users, MapPin, Edit, Trash2, Eye, Plus, Search, Filter, 
  IndianRupee, Star, Globe, Video, Clock, Tag, CheckCircle, XCircle,
  Ticket, Link as LinkIcon, Crown, Building2, UserCog, Sparkles
} from "@/lib/icons";
import { AIEventGenerator } from "@/components/admin/AIEventGenerator";
import { formatINR, formatDateTime } from "@/lib/utils";
import { ImageUploader } from "@/components/ui/image-uploader";
import { getImageUrl } from "@/lib/image-utils";

interface Community {
  id: number;
  name: string;
  slug: string;
}

interface OrganizerUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface CommunityEventLink {
  communityId: number;
  community: Community;
}

interface Event {
  id: number;
  title: string;
  slug: string | null;
  shortDescription: string | null;
  description: string;
  coverImage: string;
  theme: string;
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
  currency: string;
  venue: string | null;
  venueAddress: string | null;
  venueMapUrl: string | null;
  onlineLink: string | null;
  virtualLinkHidden: boolean;
  status: string;
  featured: boolean;
  requiresApproval: boolean;
  maxTickets: number | null;
  agenda: any;
  sponsors: any;
  speakers: any;
  faqs: any;
  viewCount: number;
  organizer: { id: number; firstName: string; lastName: string; email: string };
  communityEvents?: CommunityEventLink[];
  _count?: { registrations: number; ticketTypes: number };
  createdAt: string;
  createdByAdmin: boolean;
}

interface NewEvent {
  title: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  theme: string;
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
  currency: string;
  venue: string;
  venueAddress: string;
  venueMapUrl: string;
  onlineLink: string;
  virtualLinkHidden: boolean;
  status: string;
  featured: boolean;
  requiresApproval: boolean;
  maxTickets: number | null;
  agenda?: any[];
  speakers?: any[];
  faqs?: any[];
}

const eventCategories = ["Workshop", "Webinar", "Bootcamp", "Conference", "Meetup", "Hackathon", "Seminar", "Networking"];
const eventTypes = ["workshop", "webinar", "bootcamp", "conference", "meetup", "hackathon", "seminar", "networking"];
const eventLevels = ["beginner", "intermediate", "advanced", "all"];
const eventModes = ["online", "offline", "hybrid"];
const eventStatuses = ["draft", "published", "cancelled", "completed"];
const eventThemes = ["default", "professional", "creative", "tech", "casual", "formal"];

const defaultNewEvent: NewEvent = {
  title: "",
  shortDescription: "",
  description: "",
  coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
  theme: "default",
  category: "Workshop",
  tags: [],
  level: "beginner",
  eventType: "workshop",
  mode: "online",
  startDate: "",
  endDate: "",
  timezone: "IST",
  capacity: null,
  price: 0,
  currency: "INR",
  venue: "",
  venueAddress: "",
  venueMapUrl: "",
  onlineLink: "",
  virtualLinkHidden: true,
  status: "draft",
  featured: false,
  requiresApproval: false,
  maxTickets: null,
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEvent>(defaultNewEvent);
  const [isSaving, setIsSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [users, setUsers] = useState<OrganizerUser[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [selectedOrganizerId, setSelectedOrganizerId] = useState<string>("");
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchCommunities();
    fetchUsers();
  }, []);

  async function fetchEvents() {
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      } else if (res.status === 403) {
        toast.error("Admin access required");
      }
    } catch (error) {
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCommunities() {
    try {
      const res = await fetch("/api/admin/communities");
      if (res.ok) {
        const data = await res.json();
        setCommunities(data.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })));
      }
    } catch (error) {
      console.error("Failed to load communities:", error);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users?limit=500");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users?.map((u: any) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email
        })) || []);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }

  async function reassignOrganizer(eventId: number, newOrganizerId: number) {
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: newOrganizerId }),
      });

      if (res.ok) {
        toast.success("Organizer reassigned successfully");
        fetchEvents();
      } else {
        toast.error("Failed to reassign organizer");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function assignToCommunity(eventId: number, communityId: number) {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/community`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId }),
      });

      if (res.ok) {
        toast.success("Event assigned to community");
        fetchEvents();
      } else {
        toast.error("Failed to assign event to community");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function removeFromCommunity(eventId: number, communityId: number) {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/community`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId }),
      });

      if (res.ok) {
        toast.success("Event removed from community");
        fetchEvents();
      } else {
        toast.error("Failed to remove event from community");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function createEvent() {
    if (!newEvent.title || !newEvent.description || !newEvent.startDate || !newEvent.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        toast.success("Event created successfully");
        setIsAddDialogOpen(false);
        setNewEvent(defaultNewEvent);
        setTagsInput("");
        fetchEvents();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create event");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateEventStatus(id: number, status: string) {
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success("Event status updated");
        fetchEvents();
      } else {
        toast.error("Failed to update event");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function toggleFeatured(id: number, featured: boolean) {
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      });

      if (res.ok) {
        toast.success(featured ? "Event featured" : "Event unfeatured");
        fetchEvents();
      } else {
        toast.error("Failed to update event");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function deleteEvent(id: number) {
    if (!confirm("Are you sure you want to delete this event? This will also delete all registrations.")) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Event deleted");
        fetchEvents();
      } else {
        toast.error("Failed to delete event");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function saveEvent() {
    if (!editingEvent) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingEvent,
          tags: editTagsInput.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        toast.success("Event updated successfully");
        setIsEditDialogOpen(false);
        setEditingEvent(null);
        fetchEvents();
      } else {
        toast.error("Failed to update event");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    const matchesMode = modeFilter === "all" || event.mode === modeFilter;
    return matchesSearch && matchesStatus && matchesMode;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-slate-100 text-slate-700",
      published: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      completed: "bg-blue-100 text-blue-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getModeBadge = (mode: string) => {
    const colors: Record<string, string> = {
      online: "bg-purple-100 text-purple-700",
      offline: "bg-orange-100 text-orange-700",
      hybrid: "bg-cyan-100 text-cyan-700",
    };
    return colors[mode] || "bg-slate-100 text-slate-700";
  };

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
          <h1 className="text-3xl font-heading font-bold text-slate-900">Events Management</h1>
          <p className="text-slate-600 mt-1">Create, manage, and track all events on the platform</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsAIGeneratorOpen(true)} 
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
            data-testid="button-ai-generate"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-event">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-sm text-slate-600">Total Events</p>
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
                <p className="text-2xl font-bold">{events.filter(e => e.status === "published").length}</p>
                <p className="text-sm text-slate-600">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.filter(e => e.featured).length}</p>
                <p className="text-sm text-slate-600">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.reduce((acc, e) => acc + (e._count?.registrations || 0), 0)}</p>
                <p className="text-sm text-slate-600">Total Registrations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-events"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {eventStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="w-32" data-testid="select-mode-filter">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {eventModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-slate-600">Event</th>
                  <th className="pb-3 font-medium text-slate-600">Date & Time</th>
                  <th className="pb-3 font-medium text-slate-600">Mode</th>
                  <th className="pb-3 font-medium text-slate-600">Price</th>
                  <th className="pb-3 font-medium text-slate-600">Registrations</th>
                  <th className="pb-3 font-medium text-slate-600">Status</th>
                  <th className="pb-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {event.coverImage && (
                            <img src={getImageUrl(event.coverImage)} alt={event.title} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 truncate">{event.title}</p>
                            {event.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-slate-500">{event.category} • {event.level}</p>
                          {event.createdByAdmin && (
                            <Badge variant="outline" className="text-xs mt-1">Admin Created</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="text-sm text-slate-900" suppressHydrationWarning>
                        {formatDateTime(event.startDate)}
                      </p>
                      <p className="text-xs text-slate-500">{event.timezone}</p>
                    </td>
                    <td className="py-4">
                      <Badge className={getModeBadge(event.mode)}>
                        {event.mode === "online" && <Video className="h-3 w-3 mr-1" />}
                        {event.mode === "offline" && <MapPin className="h-3 w-3 mr-1" />}
                        {event.mode === "hybrid" && <Globe className="h-3 w-3 mr-1" />}
                        {event.mode}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <p className="text-sm font-medium" suppressHydrationWarning>
                        {event.price > 0 ? formatINR(event.price) : <span className="text-green-600">Free</span>}
                      </p>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Users className="h-4 w-4" />
                        {event._count?.registrations || 0}
                        {event.capacity && <span className="text-slate-400">/ {event.capacity}</span>}
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge className={getStatusBadge(event.status)}>
                        {event.status}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeatured(event.id, !event.featured)}
                          className={event.featured ? "text-yellow-600" : "text-slate-400"}
                          title={event.featured ? "Remove from featured" : "Add to featured"}
                          data-testid={`button-feature-event-${event.id}`}
                        >
                          <Star className={`h-4 w-4 ${event.featured ? "fill-yellow-500" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEvent(event);
                            setEditTagsInput(event.tags?.join(", ") || "");
                            setIsEditDialogOpen(true);
                          }}
                          data-testid={`button-edit-event-${event.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {event.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateEventStatus(event.id, "published")}
                            className="text-green-600 hover:text-green-700"
                            data-testid={`button-publish-event-${event.id}`}
                          >
                            Publish
                          </Button>
                        )}
                        {event.status === "published" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateEventStatus(event.id, "cancelled")}
                            className="text-orange-600 hover:text-orange-700"
                            data-testid={`button-cancel-event-${event.id}`}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEvent(event.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-event-${event.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEvents.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No events found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>Create a new event for the platform</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="datetime">Date & Time</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="new-title">Title *</Label>
                <Input
                  id="new-title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Enter event title"
                  data-testid="input-new-event-title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-short-desc">Short Description</Label>
                <Input
                  id="new-short-desc"
                  value={newEvent.shortDescription}
                  onChange={(e) => setNewEvent({ ...newEvent, shortDescription: e.target.value })}
                  placeholder="Brief description for event cards"
                  data-testid="input-new-event-short-desc"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-description">Full Description *</Label>
                <Textarea
                  id="new-description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={4}
                  placeholder="Detailed event description"
                  data-testid="input-new-event-description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-cover">Cover Image URL</Label>
                <Input
                  id="new-cover"
                  value={newEvent.coverImage}
                  onChange={(e) => setNewEvent({ ...newEvent, coverImage: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-new-event-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category *</Label>
                  <Select
                    value={newEvent.category}
                    onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}
                  >
                    <SelectTrigger data-testid="select-new-event-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Event Type *</Label>
                  <Select
                    value={newEvent.eventType}
                    onValueChange={(value) => setNewEvent({ ...newEvent, eventType: value })}
                  >
                    <SelectTrigger data-testid="select-new-event-type">
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
                <div className="grid gap-2">
                  <Label>Level</Label>
                  <Select
                    value={newEvent.level}
                    onValueChange={(value) => setNewEvent({ ...newEvent, level: value })}
                  >
                    <SelectTrigger data-testid="select-new-event-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Theme</Label>
                  <Select
                    value={newEvent.theme}
                    onValueChange={(value) => setNewEvent({ ...newEvent, theme: value })}
                  >
                    <SelectTrigger data-testid="select-new-event-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventThemes.map((theme) => (
                        <SelectItem key={theme} value={theme}>
                          {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-tags">Tags (comma-separated)</Label>
                <Input
                  id="new-tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="react, javascript, frontend"
                  data-testid="input-new-event-tags"
                />
              </div>
            </TabsContent>

            <TabsContent value="datetime" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-start">Start Date & Time *</Label>
                  <Input
                    id="new-start"
                    type="datetime-local"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    data-testid="input-new-event-start"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-end">End Date & Time *</Label>
                  <Input
                    id="new-end"
                    type="datetime-local"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    data-testid="input-new-event-end"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Timezone</Label>
                <Select
                  value={newEvent.timezone}
                  onValueChange={(value) => setNewEvent({ ...newEvent, timezone: value })}
                >
                  <SelectTrigger data-testid="select-new-event-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IST">IST (India Standard Time)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                    <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>Mode *</Label>
                <Select
                  value={newEvent.mode}
                  onValueChange={(value) => setNewEvent({ ...newEvent, mode: value })}
                >
                  <SelectTrigger data-testid="select-new-event-mode">
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
              
              {(newEvent.mode === "online" || newEvent.mode === "hybrid") && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="new-online-link">Online Meeting Link</Label>
                    <Input
                      id="new-online-link"
                      value={newEvent.onlineLink}
                      onChange={(e) => setNewEvent({ ...newEvent, onlineLink: e.target.value })}
                      placeholder="Zoom/Meet/Teams link"
                      data-testid="input-new-event-online-link"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newEvent.virtualLinkHidden}
                      onCheckedChange={(checked) => setNewEvent({ ...newEvent, virtualLinkHidden: checked })}
                      data-testid="switch-new-event-virtual-link-hidden"
                    />
                    <Label>Hide virtual link until registration is approved</Label>
                  </div>
                </>
              )}
              
              {(newEvent.mode === "offline" || newEvent.mode === "hybrid") && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="new-venue">Venue Name</Label>
                    <Input
                      id="new-venue"
                      value={newEvent.venue}
                      onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                      placeholder="Conference Center, Hotel, etc."
                      data-testid="input-new-event-venue"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-venue-address">Venue Address</Label>
                    <Textarea
                      id="new-venue-address"
                      value={newEvent.venueAddress}
                      onChange={(e) => setNewEvent({ ...newEvent, venueAddress: e.target.value })}
                      rows={2}
                      placeholder="Full address"
                      data-testid="input-new-event-venue-address"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-map-url">Google Maps URL</Label>
                    <Input
                      id="new-map-url"
                      value={newEvent.venueMapUrl}
                      onChange={(e) => setNewEvent({ ...newEvent, venueMapUrl: e.target.value })}
                      placeholder="https://maps.google.com/..."
                      data-testid="input-new-event-map-url"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-price">Price (INR)</Label>
                  <Input
                    id="new-price"
                    type="number"
                    value={newEvent.price}
                    onChange={(e) => setNewEvent({ ...newEvent, price: parseFloat(e.target.value) || 0 })}
                    data-testid="input-new-event-price"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-capacity">Capacity</Label>
                  <Input
                    id="new-capacity"
                    type="number"
                    value={newEvent.capacity || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Unlimited"
                    data-testid="input-new-event-capacity"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-max-tickets">Max Tickets</Label>
                  <Input
                    id="new-max-tickets"
                    type="number"
                    value={newEvent.maxTickets || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, maxTickets: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Unlimited"
                    data-testid="input-new-event-max-tickets"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={newEvent.status}
                    onValueChange={(value) => setNewEvent({ ...newEvent, status: value })}
                  >
                    <SelectTrigger data-testid="select-new-event-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Featured Event</Label>
                    <p className="text-sm text-slate-500">Show on homepage and in featured sections</p>
                  </div>
                  <Switch
                    checked={newEvent.featured}
                    onCheckedChange={(checked) => setNewEvent({ ...newEvent, featured: checked })}
                    data-testid="switch-new-event-featured"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Requires Approval</Label>
                    <p className="text-sm text-slate-500">Manually approve registrations before confirmation</p>
                  </div>
                  <Switch
                    checked={newEvent.requiresApproval}
                    onCheckedChange={(checked) => setNewEvent({ ...newEvent, requiresApproval: checked })}
                    data-testid="switch-new-event-requires-approval"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createEvent} disabled={isSaving} data-testid="button-create-event">
              {isSaving ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event details</DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="datetime">Date & Time</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    data-testid="input-edit-event-title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-short-desc">Short Description</Label>
                  <Input
                    id="edit-short-desc"
                    value={editingEvent.shortDescription || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, shortDescription: e.target.value })}
                    data-testid="input-edit-event-short-desc"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    rows={4}
                    data-testid="input-edit-event-description"
                  />
                </div>
                <ImageUploader
                  value={editingEvent.coverImage}
                  onChange={(url) => setEditingEvent({ ...editingEvent, coverImage: url || "" })}
                  entityType="events"
                  entityId={editingEvent.id}
                  imageType="cover"
                  label="Cover Image"
                  placeholder="Upload event cover image"
                  aspectRatio="video"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select
                      value={editingEvent.category}
                      onValueChange={(value) => setEditingEvent({ ...editingEvent, category: value })}
                    >
                      <SelectTrigger data-testid="select-edit-event-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Level</Label>
                    <Select
                      value={editingEvent.level}
                      onValueChange={(value) => setEditingEvent({ ...editingEvent, level: value })}
                    >
                      <SelectTrigger data-testid="select-edit-event-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                  <Input
                    id="edit-tags"
                    value={editTagsInput}
                    onChange={(e) => setEditTagsInput(e.target.value)}
                    data-testid="input-edit-event-tags"
                  />
                </div>
              </TabsContent>

              <TabsContent value="datetime" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-start">Start Date & Time</Label>
                    <Input
                      id="edit-start"
                      type="datetime-local"
                      value={editingEvent.startDate ? new Date(editingEvent.startDate).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, startDate: e.target.value })}
                      data-testid="input-edit-event-start"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-end">End Date & Time</Label>
                    <Input
                      id="edit-end"
                      type="datetime-local"
                      value={editingEvent.endDate ? new Date(editingEvent.endDate).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, endDate: e.target.value })}
                      data-testid="input-edit-event-end"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Timezone</Label>
                  <Select
                    value={editingEvent.timezone}
                    onValueChange={(value) => setEditingEvent({ ...editingEvent, timezone: value })}
                  >
                    <SelectTrigger data-testid="select-edit-event-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IST">IST (India Standard Time)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                      <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-4 mt-4">
                <div className="grid gap-2">
                  <Label>Mode</Label>
                  <Select
                    value={editingEvent.mode}
                    onValueChange={(value) => setEditingEvent({ ...editingEvent, mode: value })}
                  >
                    <SelectTrigger data-testid="select-edit-event-mode">
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
                
                {(editingEvent.mode === "online" || editingEvent.mode === "hybrid") && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-online-link">Online Meeting Link</Label>
                      <Input
                        id="edit-online-link"
                        value={editingEvent.onlineLink || ""}
                        onChange={(e) => setEditingEvent({ ...editingEvent, onlineLink: e.target.value })}
                        data-testid="input-edit-event-online-link"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingEvent.virtualLinkHidden}
                        onCheckedChange={(checked) => setEditingEvent({ ...editingEvent, virtualLinkHidden: checked })}
                        data-testid="switch-edit-event-virtual-link-hidden"
                      />
                      <Label>Hide virtual link until registration is approved</Label>
                    </div>
                  </>
                )}
                
                {(editingEvent.mode === "offline" || editingEvent.mode === "hybrid") && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-venue">Venue Name</Label>
                      <Input
                        id="edit-venue"
                        value={editingEvent.venue || ""}
                        onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                        data-testid="input-edit-event-venue"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-venue-address">Venue Address</Label>
                      <Textarea
                        id="edit-venue-address"
                        value={editingEvent.venueAddress || ""}
                        onChange={(e) => setEditingEvent({ ...editingEvent, venueAddress: e.target.value })}
                        rows={2}
                        data-testid="input-edit-event-venue-address"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-map-url">Google Maps URL</Label>
                      <Input
                        id="edit-map-url"
                        value={editingEvent.venueMapUrl || ""}
                        onChange={(e) => setEditingEvent({ ...editingEvent, venueMapUrl: e.target.value })}
                        data-testid="input-edit-event-map-url"
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Price (INR)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={editingEvent.price}
                      onChange={(e) => setEditingEvent({ ...editingEvent, price: parseFloat(e.target.value) || 0 })}
                      data-testid="input-edit-event-price"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-capacity">Capacity</Label>
                    <Input
                      id="edit-capacity"
                      type="number"
                      value={editingEvent.capacity || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, capacity: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Unlimited"
                      data-testid="input-edit-event-capacity"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-max-tickets">Max Tickets</Label>
                    <Input
                      id="edit-max-tickets"
                      type="number"
                      value={editingEvent.maxTickets || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, maxTickets: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Unlimited"
                      data-testid="input-edit-event-max-tickets"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={editingEvent.status}
                      onValueChange={(value) => setEditingEvent({ ...editingEvent, status: value })}
                    >
                      <SelectTrigger data-testid="select-edit-event-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Featured Event</Label>
                      <p className="text-sm text-slate-500">Show on homepage and in featured sections</p>
                    </div>
                    <Switch
                      checked={editingEvent.featured}
                      onCheckedChange={(checked) => setEditingEvent({ ...editingEvent, featured: checked })}
                      data-testid="switch-edit-event-featured"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Requires Approval</Label>
                      <p className="text-sm text-slate-500">Manually approve registrations before confirmation</p>
                    </div>
                    <Switch
                      checked={editingEvent.requiresApproval}
                      onCheckedChange={(checked) => setEditingEvent({ ...editingEvent, requiresApproval: checked })}
                      data-testid="switch-edit-event-requires-approval"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="admin" className="space-y-6 mt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-800 mb-2">
                    <Crown className="h-5 w-5" />
                    <span className="font-semibold">Admin Controls</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    These settings are only available to administrators. Changes here can affect event ownership and community associations.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      Reassign Organizer
                    </Label>
                    <p className="text-sm text-slate-500 mb-2">
                      Current organizer: {editingEvent.organizer.firstName} {editingEvent.organizer.lastName} ({editingEvent.organizer.email})
                    </p>
                    <div className="flex gap-2">
                      <Select
                        value={selectedOrganizerId}
                        onValueChange={setSelectedOrganizerId}
                      >
                        <SelectTrigger className="flex-1" data-testid="select-reassign-organizer">
                          <SelectValue placeholder="Select new organizer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem 
                              key={user.id} 
                              value={user.id.toString()}
                              disabled={user.id === editingEvent.organizer.id}
                            >
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (selectedOrganizerId) {
                            reassignOrganizer(editingEvent.id, parseInt(selectedOrganizerId));
                            setSelectedOrganizerId("");
                          }
                        }}
                        disabled={!selectedOrganizerId}
                        data-testid="button-reassign-organizer"
                      >
                        Reassign
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4" />
                      Community Association
                    </Label>
                    
                    {editingEvent.communityEvents && editingEvent.communityEvents.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-slate-500">Currently assigned to:</p>
                        {editingEvent.communityEvents.map((ce) => (
                          <div key={ce.communityId} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                            <span className="text-sm font-medium">{ce.community.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => removeFromCommunity(editingEvent.id, ce.communityId)}
                              data-testid={`button-remove-community-${ce.communityId}`}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 mb-4">Not assigned to any community</p>
                    )}

                    <div className="flex gap-2">
                      <Select
                        value={selectedCommunityId}
                        onValueChange={setSelectedCommunityId}
                      >
                        <SelectTrigger className="flex-1" data-testid="select-assign-community">
                          <SelectValue placeholder="Select a community..." />
                        </SelectTrigger>
                        <SelectContent>
                          {communities
                            .filter(c => !editingEvent.communityEvents?.some(ce => ce.communityId === c.id))
                            .map((community) => (
                              <SelectItem key={community.id} value={community.id.toString()}>
                                {community.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (selectedCommunityId) {
                            assignToCommunity(editingEvent.id, parseInt(selectedCommunityId));
                            setSelectedCommunityId("");
                          }
                        }}
                        disabled={!selectedCommunityId}
                        data-testid="button-assign-community"
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEvent} disabled={isSaving} data-testid="button-save-event">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AIEventGenerator
        open={isAIGeneratorOpen}
        onOpenChange={setIsAIGeneratorOpen}
        onEventGenerated={(generatedContent) => {
          setNewEvent({
            ...defaultNewEvent,
            title: generatedContent.title,
            shortDescription: generatedContent.shortDescription,
            description: generatedContent.description,
            category: generatedContent.category,
            level: generatedContent.level,
            tags: generatedContent.tags,
            faqs: generatedContent.faqs || [],
            speakers: generatedContent.speakers || [],
            agenda: generatedContent.agenda || [],
            price: generatedContent.suggestedPrice || 0,
            capacity: generatedContent.suggestedCapacity || 100
          });
          setTagsInput(generatedContent.tags.join(", "));
          setIsAddDialogOpen(true);
          toast.success("AI-generated content loaded! Review and customize before saving.");
        }}
      />
    </div>
  );
}
