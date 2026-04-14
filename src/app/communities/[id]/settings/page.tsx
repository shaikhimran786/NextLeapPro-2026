"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Settings, Image as ImageIcon, Tag, X, Globe, MapPin, Link as LinkIcon, Lock, Unlock, Trash2, Save, Palette, Users, Video, Laptop, UserPlus, Shield, Crown, MoreHorizontal, Ban } from "@/lib/icons";
import { canManageCommunity, isAdmin as checkIsAdmin } from "@/lib/user-status";
import { ImageUploader } from "@/components/ui/image-uploader";
import type { UserStatus } from "@/lib/user-status";

const COMMUNITY_CATEGORIES = [
  "technology", "design", "business", "marketing", "education",
  "health", "finance", "arts", "sports", "lifestyle", "other"
];

const SOCIAL_PLATFORMS = [
  { id: "twitter", label: "Twitter/X", placeholder: "https://twitter.com/..." },
  { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/..." },
  { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { id: "discord", label: "Discord", placeholder: "https://discord.gg/..." },
  { id: "telegram", label: "Telegram", placeholder: "https://t.me/..." },
];

interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  discord?: string;
  telegram?: string;
}

interface CommunityData {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  logo: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  location: string | null;
  website: string | null;
  socialLinks: SocialLinks | null;
  isPublic: boolean;
  mode: string;
  membershipType: string;
  primaryColor: string | null;
  maxMembers: number | null;
  meetupFrequency: string | null;
  creatorId: number | null;
}

interface MemberData {
  id: number;
  userId: number;
  role: string;
  joinedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CommunitySettingsPage({ params }: PageProps) {
  const router = useRouter();
  const [communityId, setCommunityId] = useState<number | null>(null);
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [members, setMembers] = useState<MemberData[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    logo: "",
    coverImage: "",
    category: "technology",
    tags: [] as string[],
    location: "",
    website: "",
    socialLinks: {} as SocialLinks,
    isPublic: true,
    mode: "hybrid",
    membershipType: "open",
    primaryColor: "",
    maxMembers: "",
    meetupFrequency: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        if (isNaN(id)) {
          router.push("/communities");
          return;
        }
        setCommunityId(id);

        const statusRes = await fetch("/api/me/status");
        if (!statusRes.ok) {
          router.push("/login");
          return;
        }
        const statusData: UserStatus = await statusRes.json();
        const isAdmin = checkIsAdmin(statusData);

        const commRes = await fetch(`/api/communities/${id}`);
        if (!commRes.ok) {
          toast.error("Community not found");
          router.push("/communities");
          return;
        }
        const commData = await commRes.json();
        setCommunity(commData);

        const hasAccess = canManageCommunity(statusData, id);
        if (!hasAccess && !isAdmin) {
          toast.error("You don't have permission to edit this community");
          router.push(`/communities/${id}`);
          return;
        }

        setCanEdit(true);
        setFormData({
          name: commData.name || "",
          description: commData.description || "",
          shortDescription: commData.shortDescription || "",
          logo: commData.logo || "",
          coverImage: commData.coverImage || "",
          category: commData.category || "technology",
          tags: commData.tags || [],
          location: commData.location || "",
          website: commData.website || "",
          socialLinks: commData.socialLinks || {},
          isPublic: commData.isPublic ?? true,
          mode: commData.mode || "hybrid",
          membershipType: commData.membershipType || "open",
          primaryColor: commData.primaryColor || "",
          maxMembers: commData.maxMembers ? String(commData.maxMembers) : "",
          meetupFrequency: commData.meetupFrequency || "",
        });

        fetch(`/api/communities/${id}/members`)
          .then(r => r.ok ? r.json() : [])
          .then(data => setMembers(Array.isArray(data) ? data : []))
          .catch(() => {});
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load community data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params, router]);

  function updateField<K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  function updateSocialLink(platform: string, value: string) {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      updateField("tags", [...formData.tags, tag]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    updateField("tags", formData.tags.filter(t => t !== tag));
  }

  async function handleSave() {
    if (!communityId) return;

    if (!formData.name.trim()) {
      toast.error("Community name is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/communities/${communityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          coverImage: formData.coverImage || null,
          location: formData.location || null,
          website: formData.website || null,
          socialLinks: Object.keys(formData.socialLinks).length > 0 ? formData.socialLinks : null,
          primaryColor: formData.primaryColor || null,
          maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
          meetupFrequency: formData.meetupFrequency || null,
        }),
      });

      if (res.ok) {
        toast.success("Community settings saved successfully!");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMemberAction(memberId: number, action: string, role?: string) {
    if (!communityId) return;
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, action, role }),
      });

      if (res.ok) {
        if (action === "remove") {
          setMembers(prev => prev.filter(m => m.id !== memberId));
          toast.success("Member removed");
        } else {
          const updated = await res.json();
          setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: updated.role } : m));
          toast.success("Role updated");
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Action failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setMembersLoading(false);
    }
  }

  async function handleDelete() {
    if (!communityId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/communities/${communityId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Community deleted successfully");
        router.push("/communities");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete community");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!canEdit || !community) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href={`/communities/${communityId}`} 
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-slate-600 to-slate-800 flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold">Community Settings</h1>
              <p className="text-muted-foreground">{community.name}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Basic Information
                </CardTitle>
                <CardDescription>Core details about your community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Community Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Your community name"
                    className="mt-1"
                    data-testid="input-settings-name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="What is your community about?"
                    rows={5}
                    className="mt-1"
                    maxLength={2000}
                    data-testid="input-settings-description"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{formData.description.length}/2000</p>
                </div>

                <div>
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => updateField("shortDescription", e.target.value)}
                    placeholder="A brief tagline shown on community cards"
                    className="mt-1"
                    maxLength={200}
                    data-testid="input-settings-short-description"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => updateField("category", value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-settings-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMUNITY_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (up to 5)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      data-testid="input-settings-tag"
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" /> Branding
                </CardTitle>
                <CardDescription>Customize your community's visual identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {communityId && (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <ImageUploader
                        value={formData.logo}
                        onChange={(url) => updateField("logo", url || "")}
                        entityType="communities"
                        entityId={communityId}
                        imageType="logo"
                        label="Community Logo"
                        placeholder="Upload logo image"
                        aspectRatio="square"
                      />
                      <ImageUploader
                        value={formData.coverImage}
                        onChange={(url) => updateField("coverImage", url || "")}
                        entityType="communities"
                        entityId={communityId}
                        imageType="cover"
                        label="Cover Image"
                        placeholder="Upload cover image"
                        aspectRatio="banner"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Logo: Square image (200x200 or larger) | Cover: 1200x400 pixels or larger
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" /> Links & Social
                </CardTitle>
                <CardDescription>Connect your community's online presence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    placeholder="e.g., Mumbai, India or Global"
                    className="mt-1"
                    data-testid="input-settings-location"
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" /> Website
                  </Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://yourcommunity.com"
                    className="mt-1"
                    data-testid="input-settings-website"
                  />
                </div>

                <Separator className="my-4" />

                <div>
                  <Label className="mb-3 block">Social Media Links</Label>
                  <div className="space-y-3">
                    {SOCIAL_PLATFORMS.map((platform) => (
                      <div key={platform.id}>
                        <Label htmlFor={platform.id} className="text-sm text-muted-foreground">
                          {platform.label}
                        </Label>
                        <Input
                          id={platform.id}
                          value={(formData.socialLinks as Record<string, string>)[platform.id] || ""}
                          onChange={(e) => updateSocialLink(platform.id, e.target.value)}
                          placeholder={platform.placeholder}
                          className="mt-1"
                          data-testid={`input-settings-social-${platform.id}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Chapters
                </CardTitle>
                <CardDescription>
                  Manage local chapters for your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Create and manage local chapters to help members connect in their region.
                </p>
                <Link href={`/communities/${communityId}/settings/chapters`}>
                  <Button variant="outline" className="w-full" data-testid="button-manage-chapters">
                    <MapPin className="h-4 w-4 mr-2" />
                    Manage Chapters
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Members ({members.length})
                </CardTitle>
                <CardDescription>Manage community members and roles</CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members yet.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold">{member.user.name?.charAt(0)?.toUpperCase() || "?"}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" data-testid={`text-member-name-${member.id}`}>{member.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={member.role === "owner" ? "default" : member.role === "admin" ? "secondary" : "outline"} className="text-xs">
                            {member.role === "owner" && <Crown className="h-3 w-3 mr-1" />}
                            {member.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                            {member.role}
                          </Badge>
                          {member.role !== "owner" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={membersLoading} data-testid={`button-remove-member-${member.id}`}>
                                  <Ban className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove member?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Remove <strong>{member.user.name}</strong> from this community?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleMemberAction(member.id, "remove")} className="bg-red-600 hover:bg-red-700">
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <Trash2 className="h-5 w-5" /> Danger Zone
                </CardTitle>
                <CardDescription className="text-red-600">
                  Irreversible actions that affect your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-700">Delete this community</p>
                    <p className="text-sm text-red-600">
                      This will permanently delete your community, all chapters, and member data.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" data-testid="button-delete-community">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the community
                          <strong> "{community.name}"</strong> and remove all associated data including
                          chapters and member records.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Yes, delete community"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Type</CardTitle>
                <CardDescription>How your community operates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mode">Mode</Label>
                  <Select
                    value={formData.mode}
                    onValueChange={(value) => updateField("mode", value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-settings-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">
                        <span className="flex items-center gap-2"><Video className="h-3 w-3" /> Online</span>
                      </SelectItem>
                      <SelectItem value="hybrid">
                        <span className="flex items-center gap-2"><Laptop className="h-3 w-3" /> Hybrid</span>
                      </SelectItem>
                      <SelectItem value="in_person">
                        <span className="flex items-center gap-2"><MapPin className="h-3 w-3" /> In Person</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="membershipType">Membership</Label>
                  <Select
                    value={formData.membershipType}
                    onValueChange={(value) => updateField("membershipType", value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-settings-membership">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">
                        <span className="flex items-center gap-2"><Unlock className="h-3 w-3" /> Open</span>
                      </SelectItem>
                      <SelectItem value="approval">
                        <span className="flex items-center gap-2"><Shield className="h-3 w-3" /> Approval</span>
                      </SelectItem>
                      <SelectItem value="invite">
                        <span className="flex items-center gap-2"><UserPlus className="h-3 w-3" /> Invite Only</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={formData.maxMembers}
                    onChange={(e) => updateField("maxMembers", e.target.value)}
                    placeholder="Unlimited"
                    className="mt-1"
                    data-testid="input-settings-max-members"
                  />
                </div>

                <div>
                  <Label htmlFor="meetupFrequency">Meetup Frequency</Label>
                  <Input
                    id="meetupFrequency"
                    value={formData.meetupFrequency}
                    onChange={(e) => updateField("meetupFrequency", e.target.value)}
                    placeholder="e.g., Weekly, Bi-weekly"
                    className="mt-1"
                    data-testid="input-settings-meetup-frequency"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {formData.isPublic ? (
                      <Unlock className="h-5 w-5 text-green-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{formData.isPublic ? "Public" : "Private"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formData.isPublic ? "Visible in directory" : "Hidden from directory"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => updateField("isPublic", checked)}
                    data-testid="switch-settings-public"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 sticky top-4">
              <CardContent className="pt-6">
                <Button 
                  onClick={handleSave}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  disabled={isSaving}
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Changes will be reflected immediately after saving
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Community Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>Slug:</strong> {community.slug}</p>
                <p><strong>ID:</strong> {community.id}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
