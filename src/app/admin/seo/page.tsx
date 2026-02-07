"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import { Globe, Plus, Edit, Trash2, ArrowLeft, Settings } from "@/lib/icons";

interface PageMeta {
  id: number;
  page: string;
  title: string;
  description: string;
  ogImage: string | null;
  structuredData: any;
  createdAt: string;
  updatedAt: string;
}

interface SiteSettings {
  id: number;
  siteName: string;
  slogan: string;
  defaultCurrency: string;
  primaryGradient: any;
  heroTitle: string;
  heroSubtitle: string;
  heroCTA: string;
  heroImage: string | null;
  footerHtml: string | null;
  analyticsEnabled: boolean;
  seoDefaults: any;
}

export default function AdminSEOPage() {
  const [pageMetas, setPageMetas] = useState<PageMeta[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMetaDialog, setShowMetaDialog] = useState(false);
  const [editingMeta, setEditingMeta] = useState<PageMeta | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [metaFormData, setMetaFormData] = useState({
    page: "",
    title: "",
    description: "",
    ogImage: "",
  });

  const [settingsFormData, setSettingsFormData] = useState({
    siteName: "",
    slogan: "",
    heroTitle: "",
    heroSubtitle: "",
    heroCTA: "",
    seoTitle: "",
    seoDescription: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [metaRes, settingsRes] = await Promise.all([
        fetch("/api/admin/page-meta"),
        fetch("/api/admin/site-settings"),
      ]);

      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setPageMetas(metaData);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSiteSettings(settingsData);
        setSettingsFormData({
          siteName: settingsData.siteName || "",
          slogan: settingsData.slogan || "",
          heroTitle: settingsData.heroTitle || "",
          heroSubtitle: settingsData.heroSubtitle || "",
          heroCTA: settingsData.heroCTA || "",
          seoTitle: settingsData.seoDefaults?.title || "",
          seoDescription: settingsData.seoDefaults?.description || "",
        });
      }
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  function openCreateMetaDialog() {
    setEditingMeta(null);
    setMetaFormData({
      page: "",
      title: "",
      description: "",
      ogImage: "",
    });
    setShowMetaDialog(true);
  }

  function openEditMetaDialog(meta: PageMeta) {
    setEditingMeta(meta);
    setMetaFormData({
      page: meta.page,
      title: meta.title,
      description: meta.description,
      ogImage: meta.ogImage || "",
    });
    setShowMetaDialog(true);
  }

  async function handleMetaSubmit() {
    if (!metaFormData.page || !metaFormData.title || !metaFormData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const url = editingMeta
        ? `/api/admin/page-meta/${editingMeta.id}`
        : "/api/admin/page-meta";
      const method = editingMeta ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...metaFormData,
          ogImage: metaFormData.ogImage || null,
        }),
      });

      if (response.ok) {
        toast.success(editingMeta ? "Page meta updated" : "Page meta created");
        setShowMetaDialog(false);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Operation failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  async function handleDeleteMeta(meta: PageMeta) {
    if (!confirm(`Delete SEO settings for "${meta.page}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/page-meta/${meta.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Page meta deleted");
        fetchData();
      } else {
        toast.error("Failed to delete page meta");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: settingsFormData.siteName,
          slogan: settingsFormData.slogan,
          heroTitle: settingsFormData.heroTitle,
          heroSubtitle: settingsFormData.heroSubtitle,
          heroCTA: settingsFormData.heroCTA,
          seoDefaults: {
            title: settingsFormData.seoTitle,
            description: settingsFormData.seoDescription,
          },
        }),
      });

      if (response.ok) {
        toast.success("Site settings updated");
        fetchData();
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSavingSettings(false);
    }
  }

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

        <Tabs defaultValue="site" className="space-y-6">
          <TabsList>
            <TabsTrigger value="site" className="gap-2">
              <Settings className="h-4 w-4" />
              Site Settings
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-2">
              <Globe className="h-4 w-4" />
              Page SEO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="site">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Site Settings & Default SEO
                </CardTitle>
                <CardDescription>
                  Configure global site settings and default SEO meta tags
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-slate-500">Loading...</div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Site Name</Label>
                        <Input
                          value={settingsFormData.siteName}
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              siteName: e.target.value,
                            })
                          }
                          placeholder="Next Leap Pro"
                          data-testid="input-site-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Slogan</Label>
                        <Input
                          value={settingsFormData.slogan}
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              slogan: e.target.value,
                            })
                          }
                          placeholder="Learn, Earn, and Grow"
                          data-testid="input-slogan"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-medium mb-4">Hero Section</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Hero Title</Label>
                          <Input
                            value={settingsFormData.heroTitle}
                            onChange={(e) =>
                              setSettingsFormData({
                                ...settingsFormData,
                                heroTitle: e.target.value,
                              })
                            }
                            placeholder="Learn. Earn. And Grow."
                            data-testid="input-hero-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hero Subtitle</Label>
                          <Textarea
                            value={settingsFormData.heroSubtitle}
                            onChange={(e) =>
                              setSettingsFormData({
                                ...settingsFormData,
                                heroSubtitle: e.target.value,
                              })
                            }
                            placeholder="The platform for students and professionals..."
                            rows={2}
                            data-testid="input-hero-subtitle"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Call to Action Button Text</Label>
                          <Input
                            value={settingsFormData.heroCTA}
                            onChange={(e) =>
                              setSettingsFormData({
                                ...settingsFormData,
                                heroCTA: e.target.value,
                              })
                            }
                            placeholder="Get Started"
                            data-testid="input-hero-cta"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-medium mb-4">Default SEO Settings</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Default Meta Title</Label>
                          <Input
                            value={settingsFormData.seoTitle}
                            onChange={(e) =>
                              setSettingsFormData({
                                ...settingsFormData,
                                seoTitle: e.target.value,
                              })
                            }
                            placeholder="Next Leap Pro - Learn, Earn, and Grow"
                            data-testid="input-seo-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Default Meta Description</Label>
                          <Textarea
                            value={settingsFormData.seoDescription}
                            onChange={(e) =>
                              setSettingsFormData({
                                ...settingsFormData,
                                seoDescription: e.target.value,
                              })
                            }
                            placeholder="The platform for students and professionals..."
                            rows={3}
                            data-testid="input-seo-description"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        data-testid="button-save-settings"
                      >
                        {savingSettings ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Page SEO Settings
                    </CardTitle>
                    <CardDescription>
                      Configure SEO meta tags for individual pages
                    </CardDescription>
                  </div>
                  <Button onClick={openCreateMetaDialog} data-testid="button-create-meta">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Page SEO
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-slate-500">Loading...</div>
                ) : pageMetas.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No page SEO settings found. Add one to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageMetas.map((meta) => (
                        <TableRow key={meta.id} data-testid={`row-meta-${meta.id}`}>
                          <TableCell className="font-medium">{meta.page}</TableCell>
                          <TableCell className="max-w-xs truncate">{meta.title}</TableCell>
                          <TableCell className="max-w-md truncate text-slate-500">
                            {meta.description}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditMetaDialog(meta)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMeta(meta)}
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
          </TabsContent>
        </Tabs>

        <Dialog open={showMetaDialog} onOpenChange={setShowMetaDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingMeta ? "Edit Page SEO" : "Add Page SEO"}
              </DialogTitle>
              <DialogDescription>
                Configure SEO meta tags for a specific page
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Page Path</Label>
                <Input
                  value={metaFormData.page}
                  onChange={(e) =>
                    setMetaFormData({ ...metaFormData, page: e.target.value })
                  }
                  placeholder="/events, /pricing, /about"
                  disabled={!!editingMeta}
                  data-testid="input-meta-page"
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={metaFormData.title}
                  onChange={(e) =>
                    setMetaFormData({ ...metaFormData, title: e.target.value })
                  }
                  placeholder="Events - Next Leap Pro"
                  data-testid="input-meta-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={metaFormData.description}
                  onChange={(e) =>
                    setMetaFormData({
                      ...metaFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Discover upcoming workshops, bootcamps, and conferences..."
                  rows={3}
                  data-testid="input-meta-description"
                />
              </div>
              <div className="space-y-2">
                <Label>OG Image URL (optional)</Label>
                <Input
                  value={metaFormData.ogImage}
                  onChange={(e) =>
                    setMetaFormData({ ...metaFormData, ogImage: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMetaDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMetaSubmit} data-testid="button-save-meta">
                {editingMeta ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
