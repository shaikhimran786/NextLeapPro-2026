"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  User, 
  Globe, 
  Link2, 
  Loader2,
  Check,
  ExternalLink
} from "@/lib/icons";
import { toast } from "sonner";
import { useUserStatus, revalidateUserStatus } from "@/hooks/useUserStatus";
import { updateProfile, getProfile } from "@/lib/actions/profile-actions";
import { ImageUploader } from "@/components/ui/image-uploader";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  handle: string;
  avatar: string;
  bio: string;
  skills: string;
  twitter: string;
  linkedin: string;
  github: string;
  website: string;
  isPublished: boolean;
}

export default function ProfileEditContent() {
  const router = useRouter();
  const { userStatus, isLoading: statusLoading } = useUserStatus();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    handle: "",
    avatar: "",
    bio: "",
    skills: "",
    twitter: "",
    linkedin: "",
    github: "",
    website: "",
    isPublished: false,
  });

  const isAuthenticated = userStatus.authStatus === "logged_in";

  useEffect(() => {
    if (!statusLoading && isAuthenticated) {
      loadProfile();
    } else if (!statusLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [statusLoading, isAuthenticated]);

  async function loadProfile() {
    try {
      const result = await getProfile();
      if (result.success && result.data) {
        const profile = result.data;
        const socialLinks = profile.socialLinks || {};
        setFormData({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          handle: profile.handle || "",
          avatar: profile.avatar || "",
          bio: profile.bio || "",
          skills: (profile.skills || []).join(", "),
          twitter: socialLinks.twitter || "",
          linkedin: socialLinks.linkedin || "",
          github: socialLinks.github || "",
          website: socialLinks.website || "",
          isPublished: profile.isPublished || false,
        });
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const socialLinks: Record<string, string> = {};
      if (formData.twitter) socialLinks.twitter = formData.twitter;
      if (formData.linkedin) socialLinks.linkedin = formData.linkedin;
      if (formData.github) socialLinks.github = formData.github;
      if (formData.website) socialLinks.website = formData.website;

      const skills = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const result = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        handle: formData.handle || undefined,
        avatar: formData.avatar || undefined,
        bio: formData.bio || undefined,
        skills,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        isPublished: formData.isPublished,
      });

      if (result.success) {
        toast.success("Profile updated successfully!");
        await revalidateUserStatus();
        
        if (result.data?.publicUrl) {
          toast.success(
            <div className="flex flex-col gap-1">
              <span>Your profile is now public!</span>
              <Link 
                href={result.data.publicUrl} 
                className="text-primary underline flex items-center gap-1"
                target="_blank"
              >
                View profile <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          );
        }
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  }

  if (loading || statusLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <User className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-heading font-semibold text-slate-900 mb-2">
                Sign in to edit your profile
              </h2>
              <p className="text-slate-600 mb-6">
                You need to be logged in to edit your profile.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/auth/login">
                  <Button className="w-full">Log In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="outline" className="w-full">Create Account</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const handleUrl = formData.handle ? `/u/${formData.handle}` : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">
                Edit Profile
              </h1>
              <p className="text-slate-600 mt-1">
                Update your profile information
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                {userStatus.userId && (
                  <ImageUploader
                    value={formData.avatar}
                    onChange={(url) => setFormData({ ...formData, avatar: url || "" })}
                    entityType="users"
                    entityId={userStatus.userId}
                    imageType="avatar"
                    label="Profile Photo"
                    placeholder="Upload profile photo"
                    aspectRatio="square"
                  />
                )}

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px]"
                    data-testid="input-bio"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
                  <Input
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="React, TypeScript, Node.js (comma-separated)"
                    data-testid="input-skills"
                  />
                  <p className="text-xs text-slate-500">Separate skills with commas</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Public Profile
                </CardTitle>
                <CardDescription>
                  Configure your public profile settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="handle">Profile Handle</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">@</span>
                    <Input
                      id="handle"
                      value={formData.handle}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        handle: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") 
                      })}
                      placeholder="yourhandle"
                      className="flex-1"
                      data-testid="input-handle"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Your unique handle for your public profile URL. Only lowercase letters, numbers, underscores, and hyphens.
                  </p>
                  {handleUrl && (
                    <p className="text-xs text-primary">
                      Your profile will be available at: {window.location.origin}{handleUrl}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="isPublished" className="font-medium">
                      Publish Profile
                    </Label>
                    <p className="text-xs text-slate-500">
                      Make your profile visible to anyone with the link
                    </p>
                  </div>
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                    disabled={!formData.handle}
                    data-testid="switch-publish"
                  />
                </div>
                {!formData.handle && formData.isPublished && (
                  <p className="text-xs text-amber-600">
                    You need to set a handle to publish your profile
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Social Links
                </CardTitle>
                <CardDescription>
                  Add your social media and website links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter / X</Label>
                    <Input
                      id="twitter"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="https://twitter.com/yourhandle"
                      data-testid="input-twitter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/yourprofile"
                      data-testid="input-linkedin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="https://github.com/yourusername"
                      data-testid="input-github"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      data-testid="input-website"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4">
              <Link href="/profile">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving} className="gap-2" data-testid="button-save-profile">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
