"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, Search } from "@/lib/icons";

interface ContentBlock {
  id: number;
  page: string;
  slug: string;
  title: string;
  body: string;
  sortOrder: number;
  visible: boolean;
  meta: any;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const pageOptions = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "pricing", label: "Pricing" },
  { value: "events", label: "Events" },
  { value: "communities", label: "Communities" },
  { value: "services", label: "Services" },
  { value: "faq", label: "FAQ" },
  { value: "terms", label: "Terms & Conditions" },
  { value: "privacy", label: "Privacy Policy" },
];

export default function AdminContentPage() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [filterPage, setFilterPage] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    page: "home",
    slug: "",
    title: "",
    body: "",
    sortOrder: 0,
    visible: true,
    imageUrl: "",
  });

  useEffect(() => {
    fetchBlocks();
  }, []);

  async function fetchBlocks() {
    try {
      const response = await fetch("/api/admin/content-blocks");
      if (response.ok) {
        const data = await response.json();
        setBlocks(data);
      }
    } catch (error) {
      toast.error("Failed to fetch content blocks");
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingBlock(null);
    setFormData({
      page: "home",
      slug: "",
      title: "",
      body: "",
      sortOrder: 0,
      visible: true,
      imageUrl: "",
    });
    setShowDialog(true);
  }

  function openEditDialog(block: ContentBlock) {
    setEditingBlock(block);
    setFormData({
      page: block.page,
      slug: block.slug,
      title: block.title,
      body: block.body,
      sortOrder: block.sortOrder,
      visible: block.visible,
      imageUrl: block.imageUrl || "",
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!formData.slug || !formData.title || !formData.body) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const url = editingBlock
        ? `/api/admin/content-blocks/${editingBlock.id}`
        : "/api/admin/content-blocks";
      const method = editingBlock ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingBlock ? "Content block updated" : "Content block created");
        setShowDialog(false);
        fetchBlocks();
      } else {
        const error = await response.json();
        toast.error(error.error || "Operation failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  async function handleDelete(block: ContentBlock) {
    if (!confirm(`Delete "${block.title}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/content-blocks/${block.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Content block deleted");
        fetchBlocks();
      } else {
        toast.error("Failed to delete content block");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  async function toggleVisibility(block: ContentBlock) {
    try {
      const response = await fetch(`/api/admin/content-blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !block.visible }),
      });

      if (response.ok) {
        toast.success(`Content block ${!block.visible ? "shown" : "hidden"}`);
        fetchBlocks();
      }
    } catch (error) {
      toast.error("Failed to update visibility");
    }
  }

  const filteredBlocks = blocks.filter((block) => {
    const matchesPage = filterPage === "all" || block.page === filterPage;
    const matchesSearch =
      block.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPage && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Blocks
                </CardTitle>
                <CardDescription>
                  Manage page content sections across the website
                </CardDescription>
              </div>
              <Button onClick={openCreateDialog} data-testid="button-create-block">
                <Plus className="h-4 w-4 mr-2" />
                Add Content Block
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by title or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-blocks"
                />
              </div>
              <Select value={filterPage} onValueChange={setFilterPage}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pages</SelectItem>
                  {pageOptions.map((page) => (
                    <SelectItem key={page.value} value={page.value}>
                      {page.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500">Loading...</div>
            ) : filteredBlocks.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No content blocks found. Create one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBlocks.map((block) => (
                    <TableRow key={block.id} data-testid={`row-block-${block.id}`}>
                      <TableCell>
                        <Badge variant="outline">{block.page}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{block.title}</TableCell>
                      <TableCell className="text-slate-500 font-mono text-sm">
                        {block.slug}
                      </TableCell>
                      <TableCell>{block.sortOrder}</TableCell>
                      <TableCell>
                        <Badge variant={block.visible ? "default" : "secondary"}>
                          {block.visible ? "Visible" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleVisibility(block)}
                            title={block.visible ? "Hide" : "Show"}
                          >
                            {block.visible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(block)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(block)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBlock ? "Edit Content Block" : "Create Content Block"}
              </DialogTitle>
              <DialogDescription>
                {editingBlock
                  ? "Update the content block details below"
                  : "Add a new content section to your website"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Page</Label>
                  <Select
                    value={formData.page}
                    onValueChange={(value) =>
                      setFormData({ ...formData, page: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pageOptions.map((page) => (
                        <SelectItem key={page.value} value={page.value}>
                          {page.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Slug (unique identifier)</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      })
                    }
                    placeholder="hero-section"
                    data-testid="input-block-slug"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Section title"
                  data-testid="input-block-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Enter the content (supports HTML)"
                  rows={8}
                  data-testid="input-block-body"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL (optional)</Label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.visible}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, visible: checked })
                  }
                />
                <Label>Visible on website</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} data-testid="button-save-block">
                {editingBlock ? "Save Changes" : "Create Block"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
