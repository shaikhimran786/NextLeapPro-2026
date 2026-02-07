"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, Edit, Trash2, Search, Plus, Users, Building2, Eye, EyeOff } from "@/lib/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getImageUrl, isValidImageSrc } from "@/lib/image-utils";

interface Community {
  id: number;
  name: string;
  slug: string;
}

interface Chapter {
  id: number;
  communityId: number;
  community: Community;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  leaderId: number | null;
  logo: string | null;
  isActive: boolean;
  createdAt: string;
}

interface NewChapter {
  communityId: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  leaderId: string;
  logo: string;
  isActive: boolean;
}

const defaultNewChapter: NewChapter = {
  communityId: "",
  name: "",
  slug: "",
  description: "",
  location: "",
  leaderId: "",
  logo: "",
  isActive: true,
};

export default function AdminChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCommunityId, setFilterCommunityId] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [newChapter, setNewChapter] = useState<NewChapter>(defaultNewChapter);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchChapters();
    fetchCommunities();
  }, []);

  const fetchChapters = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterCommunityId && filterCommunityId !== "all") {
        params.append("communityId", filterCommunityId);
      }

      const res = await fetch(`/api/admin/chapters?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch chapters");
      const data = await res.json();
      setChapters(data);
    } catch (error) {
      toast.error("Failed to load chapters");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      const res = await fetch("/api/admin/communities");
      if (!res.ok) throw new Error("Failed to fetch communities");
      const data = await res.json();
      setCommunities(data.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })));
    } catch (error) {
      console.error("Failed to load communities:", error);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [search, filterCommunityId]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleCreate = async () => {
    if (!newChapter.communityId || !newChapter.name || !newChapter.slug) {
      toast.error("Community, name, and slug are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChapter),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create chapter");
      }

      toast.success("Chapter created successfully");
      setIsCreateDialogOpen(false);
      setNewChapter(defaultNewChapter);
      fetchChapters();
    } catch (error: any) {
      toast.error(error.message || "Failed to create chapter");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedChapter) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/chapters/${selectedChapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedChapter.name,
          slug: selectedChapter.slug,
          description: selectedChapter.description,
          location: selectedChapter.location,
          leaderId: selectedChapter.leaderId,
          logo: selectedChapter.logo,
          isActive: selectedChapter.isActive,
          communityId: selectedChapter.communityId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update chapter");
      }

      toast.success("Chapter updated successfully");
      setIsEditDialogOpen(false);
      setSelectedChapter(null);
      fetchChapters();
    } catch (error: any) {
      toast.error(error.message || "Failed to update chapter");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedChapter) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/chapters/${selectedChapter.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete chapter");
      }

      toast.success("Chapter deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedChapter(null);
      fetchChapters();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete chapter");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (chapter: Chapter) => {
    setSelectedChapter({ ...chapter });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chapters Management</h1>
          <p className="text-muted-foreground">
            Manage local chapters across all communities
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-chapter">
          <Plus className="h-4 w-4 mr-2" />
          Add Chapter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chapters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-chapters"
              />
            </div>
            <Select value={filterCommunityId} onValueChange={setFilterCommunityId}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter-community">
                <SelectValue placeholder="All Communities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Communities</SelectItem>
                {communities.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading chapters...</div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || filterCommunityId !== "all"
                ? "No chapters found matching your criteria"
                : "No chapters yet. Create your first chapter!"}
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="border rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                  data-testid={`card-chapter-${chapter.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {isValidImageSrc(chapter.logo) ? (
                        <img
                          src={getImageUrl(chapter.logo)}
                          alt={chapter.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{chapter.name}</h3>
                        <Badge variant={chapter.isActive ? "default" : "secondary"}>
                          {chapter.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Community: {chapter.community.name}
                      </p>
                      {chapter.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {chapter.location}
                        </div>
                      )}
                      {chapter.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {chapter.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(chapter)}
                      data-testid={`button-edit-chapter-${chapter.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(chapter)}
                      data-testid={`button-delete-chapter-${chapter.id}`}
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

      {/* Create Chapter Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-community">Community *</Label>
              <Select
                value={newChapter.communityId}
                onValueChange={(value) =>
                  setNewChapter({ ...newChapter, communityId: value })
                }
              >
                <SelectTrigger id="create-community" data-testid="select-create-community">
                  <SelectValue placeholder="Select a community" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="create-name">Chapter Name *</Label>
              <Input
                id="create-name"
                value={newChapter.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewChapter({
                    ...newChapter,
                    name,
                    slug: newChapter.slug || generateSlug(name),
                  });
                }}
                placeholder="e.g., Bangalore Chapter"
                data-testid="input-create-name"
              />
            </div>

            <div>
              <Label htmlFor="create-slug">Slug *</Label>
              <Input
                id="create-slug"
                value={newChapter.slug}
                onChange={(e) =>
                  setNewChapter({ ...newChapter, slug: e.target.value })
                }
                placeholder="e.g., bangalore"
                data-testid="input-create-slug"
              />
            </div>

            <div>
              <Label htmlFor="create-location">Location</Label>
              <Input
                id="create-location"
                value={newChapter.location}
                onChange={(e) =>
                  setNewChapter({ ...newChapter, location: e.target.value })
                }
                placeholder="e.g., Bangalore, Karnataka, India"
                data-testid="input-create-location"
              />
            </div>

            <div>
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={newChapter.description}
                onChange={(e) =>
                  setNewChapter({ ...newChapter, description: e.target.value })
                }
                placeholder="Brief description of this chapter..."
                rows={3}
                data-testid="input-create-description"
              />
            </div>

            <div>
              <Label htmlFor="create-logo">Logo URL</Label>
              <Input
                id="create-logo"
                value={newChapter.logo}
                onChange={(e) =>
                  setNewChapter({ ...newChapter, logo: e.target.value })
                }
                placeholder="https://example.com/logo.png"
                data-testid="input-create-logo"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="create-active">Active</Label>
              <Switch
                id="create-active"
                checked={newChapter.isActive}
                onCheckedChange={(checked) =>
                  setNewChapter({ ...newChapter, isActive: checked })
                }
                data-testid="switch-create-active"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting}
              data-testid="button-submit-create"
            >
              {isSubmitting ? "Creating..." : "Create Chapter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Chapter Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
          </DialogHeader>
          {selectedChapter && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-community">Community</Label>
                <Select
                  value={selectedChapter.communityId.toString()}
                  onValueChange={(value) =>
                    setSelectedChapter({
                      ...selectedChapter,
                      communityId: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="edit-community" data-testid="select-edit-community">
                    <SelectValue placeholder="Select a community" />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-name">Chapter Name *</Label>
                <Input
                  id="edit-name"
                  value={selectedChapter.name}
                  onChange={(e) =>
                    setSelectedChapter({
                      ...selectedChapter,
                      name: e.target.value,
                    })
                  }
                  data-testid="input-edit-name"
                />
              </div>

              <div>
                <Label htmlFor="edit-slug">Slug *</Label>
                <Input
                  id="edit-slug"
                  value={selectedChapter.slug}
                  onChange={(e) =>
                    setSelectedChapter({
                      ...selectedChapter,
                      slug: e.target.value,
                    })
                  }
                  data-testid="input-edit-slug"
                />
              </div>

              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={selectedChapter.location || ""}
                  onChange={(e) =>
                    setSelectedChapter({
                      ...selectedChapter,
                      location: e.target.value,
                    })
                  }
                  data-testid="input-edit-location"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedChapter.description || ""}
                  onChange={(e) =>
                    setSelectedChapter({
                      ...selectedChapter,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  data-testid="input-edit-description"
                />
              </div>

              <div>
                <Label htmlFor="edit-logo">Logo URL</Label>
                <Input
                  id="edit-logo"
                  value={selectedChapter.logo || ""}
                  onChange={(e) =>
                    setSelectedChapter({
                      ...selectedChapter,
                      logo: e.target.value,
                    })
                  }
                  data-testid="input-edit-logo"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Active</Label>
                <Switch
                  id="edit-active"
                  checked={selectedChapter.isActive}
                  onCheckedChange={(checked) =>
                    setSelectedChapter({
                      ...selectedChapter,
                      isActive: checked,
                    })
                  }
                  data-testid="switch-edit-active"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isSubmitting}
              data-testid="button-submit-edit"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chapter</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete &quot;{selectedChapter?.name}&quot;? This
            action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              data-testid="button-confirm-delete"
            >
              {isSubmitting ? "Deleting..." : "Delete Chapter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
