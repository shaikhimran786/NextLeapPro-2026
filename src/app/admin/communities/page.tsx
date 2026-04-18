"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Users, MapPin, Edit, Trash2, Eye, Search, Globe, Lock, Plus, Crown, UserCog } from "@/lib/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/ui/image-uploader";
import { getImageUrl } from "@/lib/image-utils";

interface Creator {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Community {
  id: number;
  name: string;
  slug: string | null;
  description: string;
  shortDescription: string | null;
  logo: string;
  coverImage: string | null;
  profileImage?: string | null;
  category: string;
  tags: string[];
  location: string | null;
  city: string | null;
  country: string | null;
  timezone: string;
  language: string;
  website: string | null;
  mode: string;
  membershipType: string;
  meetupFrequency: string | null;
  maxMembers: number | null;
  primaryColor: string | null;
  featured: boolean;
  verified: boolean;
  isPublic: boolean;
  creatorId: number | null;
  creator: Creator | null;
  createdByAdmin: boolean;
  _count?: { members: number };
  createdAt: string;
}

interface NewCommunity {
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  location: string;
  city: string;
  country: string;
  timezone: string;
  language: string;
  logo: string;
  coverImage: string;
  website: string;
  mode: string;
  membershipType: string;
  meetupFrequency: string;
  maxMembers: number | null;
  primaryColor: string;
  featured: boolean;
  verified: boolean;
  isPublic: boolean;
}

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
  "UTC"
];

const LANGUAGES = ["English", "Hindi", "Spanish", "French", "German", "Chinese", "Japanese", "Arabic", "Portuguese", "Other"];

const MODES = [
  { value: "online", label: "Online Only" },
  { value: "offline", label: "In-Person Only" },
  { value: "hybrid", label: "Hybrid (Both)" }
];

const MEMBERSHIP_TYPES = [
  { value: "open", label: "Open (Anyone can join)" },
  { value: "approval", label: "Approval Required" },
  { value: "invite", label: "Invite Only" }
];

const MEETUP_FREQUENCIES = [
  { value: "", label: "Not Specified" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "irregular", label: "Irregular/As needed" }
];

const CATEGORIES = [
  "Technology",
  "Business",
  "Education",
  "Health & Wellness",
  "Arts & Culture",
  "Sports & Fitness",
  "Career Development",
  "Entrepreneurship",
  "Social Impact",
  "Hobbies",
  "Other"
];

const defaultNewCommunity: NewCommunity = {
  name: "",
  description: "",
  shortDescription: "",
  category: "",
  location: "",
  city: "",
  country: "",
  timezone: "Asia/Kolkata",
  language: "English",
  logo: "",
  coverImage: "",
  website: "",
  mode: "hybrid",
  membershipType: "open",
  meetupFrequency: "",
  maxMembers: null,
  primaryColor: "",
  featured: false,
  verified: false,
  isPublic: true,
};

interface UserOption {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuditEntry {
  id: number;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  actor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState<NewCommunity>(defaultNewCommunity);
  const [isCreating, setIsCreating] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPageSize, setAuditPageSize] = useState(50);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [slugConflictOpen, setSlugConflictOpen] = useState(false);
  const [resetUrlConfirmOpen, setResetUrlConfirmOpen] = useState(false);

  useEffect(() => {
    fetchCommunities();
    fetchUsers();
  }, []);

  async function fetchCommunities() {
    try {
      const res = await fetch("/api/admin/communities");
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
      }
    } catch (error) {
      toast.error("Failed to load communities");
    } finally {
      setIsLoading(false);
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

  async function reassignCreator(communityId: number, newCreatorId: number | null) {
    try {
      const res = await fetch(`/api/admin/communities/${communityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: newCreatorId }),
      });

      if (res.ok) {
        toast.success(newCreatorId ? "Creator reassigned successfully" : "Creator removed");
        fetchCommunities();
        setSelectedCreatorId("");
      } else {
        toast.error("Failed to reassign creator");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function togglePublic(id: number, isPublic: boolean) {
    try {
      const res = await fetch(`/api/admin/communities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic }),
      });

      if (res.ok) {
        toast.success(`Community ${isPublic ? "made public" : "set to private"}`);
        fetchCommunities();
      } else {
        toast.error("Failed to update community");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function deleteCommunity(id: number) {
    if (!confirm("Are you sure you want to delete this community? This will also delete all chapters and memberships.")) return;

    try {
      const res = await fetch(`/api/admin/communities/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Community deleted");
        fetchCommunities();
      } else {
        toast.error("Failed to delete community");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function fetchAudit(communityId: number) {
    setIsLoadingAudit(true);
    try {
      const res = await fetch(`/api/admin/communities/${communityId}/audit`);
      if (res.ok) {
        const data = await res.json();
        setAuditEntries(data.entries ?? []);
        setAuditTotal(data.total ?? (data.entries?.length ?? 0));
        setAuditPageSize(data.pageSize ?? 50);
      } else {
        setAuditEntries([]);
        setAuditTotal(0);
      }
    } catch {
      setAuditEntries([]);
      setAuditTotal(0);
    } finally {
      setIsLoadingAudit(false);
    }
  }

  async function saveCommunity(opts: { forceSlug?: boolean; slugOverride?: string | null } = {}) {
    if (!editingCommunity) return;
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = { ...editingCommunity };
      if (opts.slugOverride !== undefined) payload.slug = opts.slugOverride;
      if (opts.forceSlug) payload.forceSlug = true;

      const res = await fetch(`/api/admin/communities/${editingCommunity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Community updated successfully");
        setSlugConflictOpen(false);
        setResetUrlConfirmOpen(false);
        setIsDialogOpen(false);
        setEditingCommunity(null);
        fetchCommunities();
      } else if (res.status === 409) {
        setSlugConflictOpen(true);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to update community");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  async function resetCommunityUrl() {
    if (!editingCommunity) return;
    await saveCommunity({ slugOverride: null });
    if (editingCommunity) {
      await fetchAudit(editingCommunity.id);
    }
  }

  async function createCommunity() {
    if (!newCommunity.name || !newCommunity.description || !newCommunity.category) {
      toast.error("Please fill in required fields: Name, Description, and Category");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCommunity),
      });

      if (res.ok) {
        toast.success("Community created successfully");
        setIsCreateDialogOpen(false);
        setNewCommunity(defaultNewCommunity);
        fetchCommunities();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create community");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsCreating(false);
    }
  }

  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-3xl font-heading font-bold text-slate-900">Communities Management</h1>
          <p className="text-slate-600 mt-1">Manage communities, approve new ones, and monitor membership</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-primary"
          data-testid="button-add-community"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Community
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-communities"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <Card key={community.id} className="overflow-hidden">
                <div className="h-24 bg-gradient-primary relative">
                  {community.coverImage && (
                    <img src={getImageUrl(community.coverImage)} alt="" className="h-full w-full object-cover" />
                  )}
                  <div className="absolute -bottom-8 left-4">
                    <div className="h-16 w-16 rounded-xl border-4 border-white bg-white overflow-hidden shadow-lg">
                      {community.logo ? (
                        <img src={getImageUrl(community.logo)} alt={community.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                          <Users className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <CardContent className="pt-10 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{community.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{community.description}</p>
                    </div>
                    <Badge variant={community.isPublic ? "default" : "secondary"}>
                      {community.isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                      {community.isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {community._count?.members || 0} members
                    </div>
                    {community.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {community.location}
                      </div>
                    )}
                  </div>
                  
                  {community.creator && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <Crown className="h-3 w-3 text-amber-500" />
                      <span>Created by: {community.creator.firstName} {community.creator.lastName}</span>
                    </div>
                  )}
                  {community.createdByAdmin && !community.creator && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <Badge variant="outline" className="text-xs">Admin Created</Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingCommunity(community);
                        setIsDialogOpen(true);
                        fetchAudit(community.id);
                      }}
                      data-testid={`button-edit-community-${community.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublic(community.id, !community.isPublic)}
                      data-testid={`button-toggle-public-${community.id}`}
                    >
                      {community.isPublic ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCommunity(community.id)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-delete-community-${community.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredCommunities.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No communities found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Community</DialogTitle>
          </DialogHeader>
          {editingCommunity && (
            <div className="grid gap-6 py-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">Basic Information</h4>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={editingCommunity.name}
                      onChange={(e) => setEditingCommunity({ ...editingCommunity, name: e.target.value })}
                      data-testid="input-community-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-shortDescription">Short Description</Label>
                    <Input
                      id="edit-shortDescription"
                      value={editingCommunity.shortDescription || ""}
                      onChange={(e) => setEditingCommunity({ ...editingCommunity, shortDescription: e.target.value })}
                      placeholder="Brief tagline (max 150 chars)"
                      maxLength={150}
                      data-testid="input-community-short-description"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editingCommunity.description}
                      onChange={(e) => setEditingCommunity({ ...editingCommunity, description: e.target.value })}
                      rows={3}
                      data-testid="input-community-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Select
                        value={editingCommunity.category}
                        onValueChange={(value) => setEditingCommunity({ ...editingCommunity, category: value })}
                      >
                        <SelectTrigger data-testid="select-community-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-language">Primary Language</Label>
                      <Select
                        value={editingCommunity.language}
                        onValueChange={(value) => setEditingCommunity({ ...editingCommunity, language: value })}
                      >
                        <SelectTrigger data-testid="select-community-language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-slate-900">Location & Timezone</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-city">City</Label>
                    <Input
                      id="edit-city"
                      value={editingCommunity.city || ""}
                      onChange={(e) => setEditingCommunity({ ...editingCommunity, city: e.target.value })}
                      placeholder="e.g., Mumbai"
                      data-testid="input-community-city"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-country">Country</Label>
                    <Input
                      id="edit-country"
                      value={editingCommunity.country || ""}
                      onChange={(e) => setEditingCommunity({ ...editingCommunity, country: e.target.value })}
                      placeholder="e.g., India"
                      data-testid="input-community-country"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-timezone">Timezone</Label>
                    <Select
                      value={editingCommunity.timezone}
                      onValueChange={(value) => setEditingCommunity({ ...editingCommunity, timezone: value })}
                    >
                      <SelectTrigger data-testid="select-community-timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Full Location (Display)</Label>
                  <Input
                    id="edit-location"
                    value={editingCommunity.location || ""}
                    onChange={(e) => setEditingCommunity({ ...editingCommunity, location: e.target.value })}
                    placeholder="e.g., Mumbai, Maharashtra, India"
                    data-testid="input-community-location"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-slate-900">Community Settings</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Meeting Mode</Label>
                    <Select
                      value={editingCommunity.mode}
                      onValueChange={(value) => setEditingCommunity({ ...editingCommunity, mode: value })}
                    >
                      <SelectTrigger data-testid="select-community-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Membership Type</Label>
                    <Select
                      value={editingCommunity.membershipType}
                      onValueChange={(value) => setEditingCommunity({ ...editingCommunity, membershipType: value })}
                    >
                      <SelectTrigger data-testid="select-community-membership">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMBERSHIP_TYPES.map((mt) => (
                          <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Meetup Frequency</Label>
                    <Select
                      value={editingCommunity.meetupFrequency || ""}
                      onValueChange={(value) => setEditingCommunity({ ...editingCommunity, meetupFrequency: value })}
                    >
                      <SelectTrigger data-testid="select-community-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEETUP_FREQUENCIES.map((mf) => (
                          <SelectItem key={mf.value} value={mf.value}>{mf.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-maxMembers">Max Members (optional)</Label>
                    <Input
                      id="edit-maxMembers"
                      type="number"
                      value={editingCommunity.maxMembers || ""}
                      onChange={(e) => setEditingCommunity({ ...editingCommunity, maxMembers: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Leave empty for unlimited"
                      data-testid="input-community-max-members"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-primaryColor">Brand Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="edit-primaryColor"
                        value={editingCommunity.primaryColor || ""}
                        onChange={(e) => setEditingCommunity({ ...editingCommunity, primaryColor: e.target.value })}
                        placeholder="#6366F1"
                        data-testid="input-community-color"
                      />
                      <input
                        type="color"
                        value={editingCommunity.primaryColor || "#6366F1"}
                        onChange={(e) => setEditingCommunity({ ...editingCommunity, primaryColor: e.target.value })}
                        className="h-10 w-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-slate-900">Custom URL</h4>
                <div className="grid gap-2">
                  <Label htmlFor="edit-slug">Slug</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-slug"
                      value={editingCommunity.slug ?? ""}
                      onChange={(e) => setEditingCommunity({ ...editingCommunity, slug: e.target.value })}
                      placeholder="custom-url-slug (leave empty for default)"
                      data-testid="input-community-slug"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setResetUrlConfirmOpen(true)}
                      disabled={!editingCommunity.slug}
                      data-testid="button-reset-community-url"
                    >
                      Reset to default URL
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Lowercase letters, numbers, and hyphens. Saving a new slug
                    keeps the previous one as a redirect alias. Admins can
                    override an existing alias when prompted.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-slate-900">Branding & Links</h4>
                <div className="grid grid-cols-2 gap-4">
                  <ImageUploader
                    value={editingCommunity.logo}
                    onChange={(url) => setEditingCommunity({ ...editingCommunity, logo: url || "" })}
                    entityType="communities"
                    entityId={editingCommunity.id}
                    imageType="logo"
                    label="Community Logo"
                    placeholder="Upload logo image"
                    aspectRatio="square"
                  />
                  <ImageUploader
                    value={editingCommunity.coverImage}
                    onChange={(url) => setEditingCommunity({ ...editingCommunity, coverImage: url })}
                    entityType="communities"
                    entityId={editingCommunity.id}
                    imageType="cover"
                    label="Cover Image"
                    placeholder="Upload cover image"
                    aspectRatio="banner"
                  />
                </div>
                <ImageUploader
                  value={editingCommunity.profileImage ?? null}
                  onChange={(url) => setEditingCommunity({ ...editingCommunity, profileImage: url })}
                  entityType="communities"
                  entityId={editingCommunity.id}
                  imageType="profile"
                  label="Profile Image (square branding image)"
                  placeholder="Upload profile image"
                  aspectRatio="square"
                />
                <div className="grid gap-2">
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    value={editingCommunity.website || ""}
                    onChange={(e) => setEditingCommunity({ ...editingCommunity, website: e.target.value })}
                    placeholder="https://example.com"
                    data-testid="input-community-website"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-slate-900">Visibility & Status</h4>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="edit-isPublic"
                      checked={editingCommunity.isPublic}
                      onCheckedChange={(checked) => setEditingCommunity({ ...editingCommunity, isPublic: checked })}
                    />
                    <Label htmlFor="edit-isPublic">Public Community</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="edit-featured"
                      checked={editingCommunity.featured}
                      onCheckedChange={(checked) => setEditingCommunity({ ...editingCommunity, featured: checked })}
                    />
                    <Label htmlFor="edit-featured">Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="edit-verified"
                      checked={editingCommunity.verified}
                      onCheckedChange={(checked) => setEditingCommunity({ ...editingCommunity, verified: checked })}
                    />
                    <Label htmlFor="edit-verified">Verified</Label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                  <UserCog className="h-4 w-4" />
                  Admin: Reassign Creator
                </h4>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedCreatorId || (editingCommunity.creator?.id?.toString() || "none")}
                    onValueChange={(value) => setSelectedCreatorId(value)}
                  >
                    <SelectTrigger className="flex-1" data-testid="select-community-creator">
                      <SelectValue placeholder="Select new creator..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Creator (Admin Owned)</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newCreatorId = selectedCreatorId === "none" ? null : parseInt(selectedCreatorId);
                      if (selectedCreatorId && selectedCreatorId !== (editingCommunity.creator?.id?.toString() || "none")) {
                        reassignCreator(editingCommunity.id, newCreatorId);
                      }
                    }}
                    disabled={!selectedCreatorId || selectedCreatorId === (editingCommunity.creator?.id?.toString() || "none")}
                    data-testid="button-reassign-creator"
                  >
                    Reassign
                  </Button>
                </div>
                {editingCommunity.creator && (
                  <p className="text-sm text-slate-500 mt-2">
                    Current creator: {editingCommunity.creator.firstName} {editingCommunity.creator.lastName}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-semibold text-slate-900">Audit history</h4>
                <p className="text-xs text-slate-500" data-testid="text-audit-summary">
                  {auditTotal === 0
                    ? "Most recent admin / owner changes for this community."
                    : auditTotal > auditPageSize
                      ? `Showing latest ${auditPageSize} of ${auditTotal} entries (newest first).`
                      : `Showing all ${auditTotal} ${auditTotal === 1 ? "entry" : "entries"} (newest first).`}
                </p>
                {isLoadingAudit ? (
                  <p className="text-sm text-slate-500" data-testid="text-audit-loading">
                    Loading…
                  </p>
                ) : auditEntries.length === 0 ? (
                  <p className="text-sm text-slate-500" data-testid="text-audit-empty">
                    No audit entries yet.
                  </p>
                ) : (
                  <>
                  <ul className="max-h-64 overflow-y-auto divide-y border rounded" data-testid="list-audit-entries">
                    {auditEntries.map((entry) => {
                      const actorName = entry.actor
                        ? `${entry.actor.firstName} ${entry.actor.lastName}`.trim() || entry.actor.email
                        : "System";
                      const summary = entry.field
                        ? `${entry.action} ${entry.field}: ${entry.oldValue ?? "—"} → ${entry.newValue ?? "—"}`
                        : `${entry.action}${entry.newValue ? `: ${entry.newValue}` : ""}`;
                      return (
                        <li
                          key={entry.id}
                          className="px-3 py-2 text-xs"
                          data-testid={`audit-entry-${entry.id}`}
                        >
                          <div className="font-medium text-slate-700 break-all">{summary}</div>
                          <div className="text-slate-500">
                            {actorName} • {new Date(entry.createdAt).toLocaleString()}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {auditTotal > auditEntries.length && (
                    <p className="text-xs text-slate-400 mt-1" data-testid="text-audit-truncated">
                      {auditTotal - auditEntries.length} older{" "}
                      {auditTotal - auditEntries.length === 1 ? "entry is" : "entries are"} not
                      shown. A full history view is coming soon.
                    </p>
                  )}
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveCommunity()} disabled={isSaving} data-testid="button-save-community">
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetUrlConfirmOpen} onOpenChange={setResetUrlConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to default URL?</DialogTitle>
            <DialogDescription>
              This clears the custom slug. The community will be reachable at
              its numeric URL again, and the previous slug becomes a redirect
              alias so old links keep working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUrlConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={resetCommunityUrl}
              disabled={isSaving}
              data-testid="button-confirm-reset-url"
            >
              {isSaving ? "Resetting…" : "Reset URL"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={slugConflictOpen} onOpenChange={setSlugConflictOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>That URL is already taken</DialogTitle>
            <DialogDescription>
              Another community owns this slug (live or as a redirect alias).
              As an admin you can override and take it anyway. The override
              will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlugConflictOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => saveCommunity({ forceSlug: true })}
              disabled={isSaving}
              data-testid="button-confirm-force-slug"
            >
              {isSaving ? "Overriding…" : "Override and take URL"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Community</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Basic Information</h4>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-name">Name *</Label>
                  <Input
                    id="new-name"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                    placeholder="Enter community name"
                    data-testid="input-new-community-name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-shortDescription">Short Description</Label>
                  <Input
                    id="new-shortDescription"
                    value={newCommunity.shortDescription}
                    onChange={(e) => setNewCommunity({ ...newCommunity, shortDescription: e.target.value })}
                    placeholder="Brief tagline (max 150 chars)"
                    maxLength={150}
                    data-testid="input-new-community-short-description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-description">Description *</Label>
                  <Textarea
                    id="new-description"
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                    rows={3}
                    placeholder="Describe your community in detail"
                    data-testid="input-new-community-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-category">Category *</Label>
                    <Select
                      value={newCommunity.category}
                      onValueChange={(value) => setNewCommunity({ ...newCommunity, category: value })}
                    >
                      <SelectTrigger data-testid="select-new-community-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-language">Primary Language</Label>
                    <Select
                      value={newCommunity.language}
                      onValueChange={(value) => setNewCommunity({ ...newCommunity, language: value })}
                    >
                      <SelectTrigger data-testid="select-new-community-language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-slate-900">Location & Timezone</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-city">City</Label>
                  <Input
                    id="new-city"
                    value={newCommunity.city}
                    onChange={(e) => setNewCommunity({ ...newCommunity, city: e.target.value })}
                    placeholder="e.g., Mumbai"
                    data-testid="input-new-community-city"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-country">Country</Label>
                  <Input
                    id="new-country"
                    value={newCommunity.country}
                    onChange={(e) => setNewCommunity({ ...newCommunity, country: e.target.value })}
                    placeholder="e.g., India"
                    data-testid="input-new-community-country"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-timezone">Timezone</Label>
                  <Select
                    value={newCommunity.timezone}
                    onValueChange={(value) => setNewCommunity({ ...newCommunity, timezone: value })}
                  >
                    <SelectTrigger data-testid="select-new-community-timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-location">Full Location (Display)</Label>
                <Input
                  id="new-location"
                  value={newCommunity.location}
                  onChange={(e) => setNewCommunity({ ...newCommunity, location: e.target.value })}
                  placeholder="e.g., Mumbai, Maharashtra, India"
                  data-testid="input-new-community-location"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-slate-900">Community Settings</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Meeting Mode</Label>
                  <Select
                    value={newCommunity.mode}
                    onValueChange={(value) => setNewCommunity({ ...newCommunity, mode: value })}
                  >
                    <SelectTrigger data-testid="select-new-community-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Membership Type</Label>
                  <Select
                    value={newCommunity.membershipType}
                    onValueChange={(value) => setNewCommunity({ ...newCommunity, membershipType: value })}
                  >
                    <SelectTrigger data-testid="select-new-community-membership">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEMBERSHIP_TYPES.map((mt) => (
                        <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Meetup Frequency</Label>
                  <Select
                    value={newCommunity.meetupFrequency}
                    onValueChange={(value) => setNewCommunity({ ...newCommunity, meetupFrequency: value })}
                  >
                    <SelectTrigger data-testid="select-new-community-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEETUP_FREQUENCIES.map((mf) => (
                        <SelectItem key={mf.value} value={mf.value}>{mf.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-maxMembers">Max Members (optional)</Label>
                  <Input
                    id="new-maxMembers"
                    type="number"
                    value={newCommunity.maxMembers || ""}
                    onChange={(e) => setNewCommunity({ ...newCommunity, maxMembers: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Leave empty for unlimited"
                    data-testid="input-new-community-max-members"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-primaryColor">Brand Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-primaryColor"
                      value={newCommunity.primaryColor}
                      onChange={(e) => setNewCommunity({ ...newCommunity, primaryColor: e.target.value })}
                      placeholder="#6366F1"
                      data-testid="input-new-community-color"
                    />
                    <input
                      type="color"
                      value={newCommunity.primaryColor || "#6366F1"}
                      onChange={(e) => setNewCommunity({ ...newCommunity, primaryColor: e.target.value })}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-slate-900">Branding & Links</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-logo">Logo URL</Label>
                  <Input
                    id="new-logo"
                    value={newCommunity.logo}
                    onChange={(e) => setNewCommunity({ ...newCommunity, logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    data-testid="input-new-community-logo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-coverImage">Cover Image URL</Label>
                  <Input
                    id="new-coverImage"
                    value={newCommunity.coverImage}
                    onChange={(e) => setNewCommunity({ ...newCommunity, coverImage: e.target.value })}
                    placeholder="https://example.com/cover.png"
                    data-testid="input-new-community-cover"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-website">Website</Label>
                <Input
                  id="new-website"
                  value={newCommunity.website}
                  onChange={(e) => setNewCommunity({ ...newCommunity, website: e.target.value })}
                  placeholder="https://example.com"
                  data-testid="input-new-community-website"
                />
              </div>
              <p className="text-xs text-slate-500">
                Tip: After creating the community, you can edit it to upload images directly.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-slate-900">Visibility & Status</h4>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="new-isPublic"
                    checked={newCommunity.isPublic}
                    onCheckedChange={(checked) => setNewCommunity({ ...newCommunity, isPublic: checked })}
                  />
                  <Label htmlFor="new-isPublic">Public Community</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="new-featured"
                    checked={newCommunity.featured}
                    onCheckedChange={(checked) => setNewCommunity({ ...newCommunity, featured: checked })}
                  />
                  <Label htmlFor="new-featured">Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="new-verified"
                    checked={newCommunity.verified}
                    onCheckedChange={(checked) => setNewCommunity({ ...newCommunity, verified: checked })}
                  />
                  <Label htmlFor="new-verified">Verified</Label>
                </div>
              </div>
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
              disabled={isCreating}
              data-testid="button-create-community"
            >
              {isCreating ? "Creating..." : "Create Community"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
