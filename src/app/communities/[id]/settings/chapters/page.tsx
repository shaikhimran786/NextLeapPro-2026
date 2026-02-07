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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Building2, MapPin, Pencil, Trash2, Search } from "@/lib/icons";
import { canManageCommunity, isAdmin as checkIsAdmin } from "@/lib/user-status";
import { ImageUploader } from "@/components/ui/image-uploader";
import type { UserStatus } from "@/lib/user-status";

interface Chapter {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  logo: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Community {
  id: number;
  name: string;
  slug: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const defaultChapterForm = {
  name: "",
  slug: "",
  description: "",
  location: "",
  logo: "",
  isActive: true,
};

export default function CommunityChaptersSettingsPage({ params }: PageProps) {
  const router = useRouter();
  const [communityId, setCommunityId] = useState<number | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [search, setSearch] = useState("");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterForm, setChapterForm] = useState(defaultChapterForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
        toast.error("You don't have permission to manage this community's chapters");
        router.push(`/communities/${id}`);
        return;
      }

      setCanEdit(true);
      await fetchChapters(id);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchChapters(id: number) {
    try {
      const res = await fetch(`/api/communities/${id}/chapters`);
      if (res.ok) {
        const data = await res.json();
        setChapters(data.chapters || []);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);
  }

  function openCreateDialog() {
    setChapterForm(defaultChapterForm);
    setIsCreateDialogOpen(true);
  }

  function openEditDialog(chapter: Chapter) {
    setEditingChapter(chapter);
    setChapterForm({
      name: chapter.name,
      slug: chapter.slug,
      description: chapter.description || "",
      location: chapter.location || "",
      logo: chapter.logo || "",
      isActive: chapter.isActive,
    });
    setIsEditDialogOpen(true);
  }

  function openDeleteDialog(chapter: Chapter) {
    setEditingChapter(chapter);
    setIsDeleteDialogOpen(true);
  }

  async function handleCreate() {
    if (!communityId) return;
    if (!chapterForm.name.trim()) {
      toast.error("Chapter name is required");
      return;
    }

    const slug = chapterForm.slug.trim() || generateSlug(chapterForm.name);

    setIsSaving(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...chapterForm,
          slug,
        }),
      });

      if (res.ok) {
        toast.success("Chapter created successfully!");
        setIsCreateDialogOpen(false);
        await fetchChapters(communityId);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create chapter");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEdit() {
    if (!communityId || !editingChapter) return;
    if (!chapterForm.name.trim()) {
      toast.error("Chapter name is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/chapters/${editingChapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chapterForm),
      });

      if (res.ok) {
        toast.success("Chapter updated successfully!");
        setIsEditDialogOpen(false);
        await fetchChapters(communityId);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update chapter");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!communityId || !editingChapter) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/chapters/${editingChapter.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Chapter deleted successfully!");
        setIsDeleteDialogOpen(false);
        await fetchChapters(communityId);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete chapter");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  const filteredChapters = chapters.filter(
    (chapter) =>
      chapter.name.toLowerCase().includes(search.toLowerCase()) ||
      chapter.location?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chapters...</p>
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
            href={`/communities/${communityId}/settings`}
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold">Manage Chapters</h1>
                <p className="text-muted-foreground">{community.name}</p>
              </div>
            </div>
            <Button onClick={openCreateDialog} data-testid="button-create-chapter">
              <Plus className="h-4 w-4 mr-2" />
              Add Chapter
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search chapters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-chapters"
              />
            </div>
          </CardContent>
        </Card>

        {filteredChapters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {search ? "No chapters found" : "No chapters yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {search
                  ? "Try a different search term"
                  : "Create your first chapter to help members connect locally"}
              </p>
              {!search && (
                <Button onClick={openCreateDialog} data-testid="button-create-first-chapter">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Chapter
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredChapters.map((chapter) => (
              <Card key={chapter.id} className="hover:shadow-md transition-shadow" data-testid={`card-chapter-${chapter.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg" data-testid={`text-chapter-name-${chapter.id}`}>
                            {chapter.name}
                          </h3>
                          <Badge variant={chapter.isActive ? "default" : "secondary"}>
                            {chapter.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {chapter.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3" /> {chapter.location}
                          </p>
                        )}
                        {chapter.description && (
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {chapter.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(chapter)}
                        data-testid={`button-edit-chapter-${chapter.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(chapter)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        data-testid={`button-delete-chapter-${chapter.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Chapter</DialogTitle>
            <DialogDescription>
              Add a local chapter to help members connect in a specific region
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="create-name">Chapter Name *</Label>
              <Input
                id="create-name"
                value={chapterForm.name}
                onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                placeholder="e.g., Mumbai Chapter"
                className="mt-1"
                data-testid="input-create-name"
              />
            </div>
            <div>
              <Label htmlFor="create-slug">URL Slug</Label>
              <Input
                id="create-slug"
                value={chapterForm.slug}
                onChange={(e) => setChapterForm({ ...chapterForm, slug: e.target.value })}
                placeholder="Auto-generated from name"
                className="mt-1"
                data-testid="input-create-slug"
              />
            </div>
            <div>
              <Label htmlFor="create-location">Location</Label>
              <Input
                id="create-location"
                value={chapterForm.location}
                onChange={(e) => setChapterForm({ ...chapterForm, location: e.target.value })}
                placeholder="e.g., Mumbai, Maharashtra, India"
                className="mt-1"
                data-testid="input-create-location"
              />
            </div>
            <div>
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={chapterForm.description}
                onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                placeholder="About this chapter..."
                rows={3}
                className="mt-1"
                data-testid="input-create-description"
              />
            </div>
            <div>
              <Label htmlFor="create-logo">Logo URL</Label>
              <Input
                id="create-logo"
                value={chapterForm.logo}
                onChange={(e) => setChapterForm({ ...chapterForm, logo: e.target.value })}
                placeholder="https://..."
                className="mt-1"
                data-testid="input-create-logo"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create-active">Active</Label>
              <Switch
                id="create-active"
                checked={chapterForm.isActive}
                onCheckedChange={(checked) => setChapterForm({ ...chapterForm, isActive: checked })}
                data-testid="switch-create-active"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSaving} data-testid="button-submit-create">
              {isSaving ? "Creating..." : "Create Chapter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
            <DialogDescription>Update the chapter details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Chapter Name *</Label>
              <Input
                id="edit-name"
                value={chapterForm.name}
                onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                placeholder="Chapter name"
                className="mt-1"
                data-testid="input-edit-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">URL Slug</Label>
              <Input
                id="edit-slug"
                value={chapterForm.slug}
                onChange={(e) => setChapterForm({ ...chapterForm, slug: e.target.value })}
                placeholder="chapter-slug"
                className="mt-1"
                data-testid="input-edit-slug"
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={chapterForm.location}
                onChange={(e) => setChapterForm({ ...chapterForm, location: e.target.value })}
                placeholder="City, State, Country"
                className="mt-1"
                data-testid="input-edit-location"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={chapterForm.description}
                onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                placeholder="About this chapter..."
                rows={3}
                className="mt-1"
                data-testid="input-edit-description"
              />
            </div>
            {editingChapter && (
              <ImageUploader
                value={chapterForm.logo}
                onChange={(url) => setChapterForm({ ...chapterForm, logo: url || "" })}
                entityType="chapters"
                entityId={editingChapter.id}
                imageType="logo"
                label="Chapter Logo"
                placeholder="Upload chapter logo"
                aspectRatio="square"
              />
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Active</Label>
              <Switch
                id="edit-active"
                checked={chapterForm.isActive}
                onCheckedChange={(checked) => setChapterForm({ ...chapterForm, isActive: checked })}
                data-testid="switch-edit-active"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSaving} data-testid="button-submit-edit">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>"{editingChapter?.name}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSaving}
              data-testid="button-confirm-delete"
            >
              {isSaving ? "Deleting..." : "Delete Chapter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
