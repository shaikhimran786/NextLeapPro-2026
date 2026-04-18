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
import { toast } from "sonner";
import { ArrowLeft, Users, Image as ImageIcon, Tag, X, Globe, MapPin, Link as LinkIcon, Lock, Unlock, Video, Laptop, UserPlus, Shield, Palette } from "@/lib/icons";

const COMMUNITY_CATEGORIES = [
  "technology",
  "design",
  "business",
  "marketing",
  "education",
  "health",
  "finance",
  "arts",
  "sports",
  "lifestyle",
  "other"
];

interface CommunityFormData {
  name: string;
  description: string;
  shortDescription: string;
  logo: string;
  coverImage: string;
  category: string;
  tags: string[];
  location: string;
  website: string;
  isPublic: boolean;
  mode: string;
  membershipType: string;
  primaryColor: string;
}

const defaultFormData: CommunityFormData = {
  name: "",
  description: "",
  shortDescription: "",
  logo: "",
  coverImage: "",
  category: "technology",
  tags: [],
  location: "",
  website: "",
  isPublic: true,
  mode: "hybrid",
  membershipType: "open",
  primaryColor: "",
};

export default function CreateCommunityPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CommunityFormData>(defaultFormData);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [communityCount, setCommunityCount] = useState(0);
  const [maxCommunities, setMaxCommunities] = useState(3);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkPermissions() {
      try {
        const res = await fetch("/api/me/status");
        if (!res.ok) {
          router.push("/auth/login?redirect=/communities/create");
          return;
        }
        
        const data = await res.json();
        const tier = data.subscriptionTier?.toLowerCase();
        const isCreatorTier = tier === "creator" || tier === "creator_monthly" || tier === "creator_annual";
        const isNotExpired = !data.subscriptionExpiry || new Date(data.subscriptionExpiry) > new Date();
        const isCreator = isCreatorTier && isNotExpired;
        const adminStatus = data.roles?.some((role: string) => role.toLowerCase() === "admin") || false;
        
        setIsAdmin(adminStatus);
        setCanCreate(isCreator || adminStatus);
        
        if (isCreator || adminStatus) {
          const commRes = await fetch("/api/communities?owned=true");
          if (commRes.ok) {
            const commData = await commRes.json();
            setCommunityCount(commData.communities?.length || 0);
          }
        }
      } catch (error) {
        console.error("Failed to check permissions:", error);
        router.push("/auth/login?redirect=/communities/create");
      } finally {
        setIsLoading(false);
      }
    }

    checkPermissions();
  }, [router]);

  function updateField<K extends keyof CommunityFormData>(key: K, value: CommunityFormData[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Please enter a community name");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    if (!isAdmin && communityCount >= maxCommunities) {
      toast.error(`You can only create up to ${maxCommunities} communities with your subscription`);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Community "${formData.name}" created successfully!`);
        router.push(data.community.slug ? `/communities/${data.community.slug}` : `/communities/${data.community.id}`);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Creator Subscription Required</CardTitle>
              <CardDescription className="text-center">
                You need a Creator subscription to create communities.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Upgrade to our Creator plan to create up to 3 communities and unlock all creator features.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/pricing">
                  <Button data-testid="button-view-pricing">View Pricing</Button>
                </Link>
                <Link href="/communities">
                  <Button variant="outline" data-testid="button-back-communities">Back to Communities</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/communities" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Communities
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold">Create New Community</h1>
              <p className="text-muted-foreground">Build a community around your passion</p>
            </div>
          </div>
          {!isAdmin && (
            <p className="mt-4 text-sm text-muted-foreground">
              You have created {communityCount} of {maxCommunities} communities allowed with your subscription.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Tell people what your community is about</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Community Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="e.g., React Developers India"
                      className="mt-1"
                      data-testid="input-community-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Describe what your community is about, who should join, and what members can expect..."
                      rows={5}
                      className="mt-1"
                      maxLength={2000}
                      data-testid="input-community-description"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{formData.description.length}/2000</p>
                  </div>

                  <div>
                    <Label htmlFor="shortDescription">Short Description</Label>
                    <Input
                      id="shortDescription"
                      value={formData.shortDescription}
                      onChange={(e) => updateField("shortDescription", e.target.value)}
                      placeholder="A brief tagline for your community (shown on cards)"
                      className="mt-1"
                      maxLength={200}
                      data-testid="input-community-short-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => updateField("category", value)}
                    >
                      <SelectTrigger className="mt-1" data-testid="select-community-category">
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
                        data-testid="input-community-tag"
                      />
                      <Button type="button" variant="outline" onClick={addTag} data-testid="button-add-tag">
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
                    <ImageIcon className="h-5 w-5" /> Images
                  </CardTitle>
                  <CardDescription>Add a logo and cover image for your community</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="logo">Logo URL</Label>
                    <Input
                      id="logo"
                      value={formData.logo}
                      onChange={(e) => updateField("logo", e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="mt-1"
                      data-testid="input-community-logo"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Recommended: Square image, 200x200 pixels or larger</p>
                  </div>

                  <div>
                    <Label htmlFor="coverImage">Cover Image URL</Label>
                    <Input
                      id="coverImage"
                      value={formData.coverImage}
                      onChange={(e) => updateField("coverImage", e.target.value)}
                      placeholder="https://example.com/cover.png"
                      className="mt-1"
                      data-testid="input-community-cover"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Recommended: 1200x400 pixels or larger</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" /> Brand Color
                  </CardTitle>
                  <CardDescription>Optional primary color for your community theme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={formData.primaryColor || "#6366f1"}
                      onChange={(e) => updateField("primaryColor", e.target.value)}
                      className="w-10 h-10 rounded-lg border cursor-pointer"
                      data-testid="input-community-primary-color"
                    />
                    <Input
                      value={formData.primaryColor || ""}
                      onChange={(e) => updateField("primaryColor", e.target.value)}
                      placeholder="#6366f1"
                      className="w-32"
                      data-testid="input-community-primary-color-text"
                    />
                    {formData.primaryColor && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => updateField("primaryColor", "")}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" /> Additional Details
                  </CardTitle>
                  <CardDescription>Optional information about your community</CardDescription>
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
                      data-testid="input-community-location"
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
                      data-testid="input-community-website"
                    />
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
                      <SelectTrigger className="mt-1" data-testid="select-community-mode">
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
                      <SelectTrigger className="mt-1" data-testid="select-community-membership">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">
                          <span className="flex items-center gap-2"><Unlock className="h-3 w-3" /> Open (anyone can join)</span>
                        </SelectItem>
                        <SelectItem value="approval">
                          <span className="flex items-center gap-2"><Shield className="h-3 w-3" /> Approval Required</span>
                        </SelectItem>
                        <SelectItem value="invite">
                          <span className="flex items-center gap-2"><UserPlus className="h-3 w-3" /> Invite Only</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {formData.isPublic ? (
                        <Unlock className="h-5 w-5 text-green-500" />
                      ) : (
                        <Lock className="h-5 w-5 text-amber-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{formData.isPublic ? "Public" : "Private"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formData.isPublic
                            ? "Visible in directory"
                            : "Hidden from directory"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => updateField("isPublic", checked)}
                      data-testid="switch-community-public"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Ready to create?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once created, you can invite members, create chapters, and organize events.
                  </p>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    disabled={isSubmitting || (!isAdmin && communityCount >= maxCommunities)}
                    data-testid="button-create-community-submit"
                  >
                    {isSubmitting ? "Creating..." : "Create Community"}
                  </Button>
                  {!isAdmin && communityCount >= maxCommunities && (
                    <p className="text-sm text-amber-600 mt-2 text-center">
                      You have reached your community limit
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">What happens next?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>1. Your community will be created and you'll be the owner</p>
                  <p>2. You can customize settings and add chapters</p>
                  <p>3. Invite members and start building your community</p>
                  <p>4. Associate events with your community</p>
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
