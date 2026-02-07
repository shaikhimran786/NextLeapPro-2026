"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Settings } from "@/lib/icons";
import Link from "next/link";

interface CTAConfig {
  id: number;
  page: string;
  targetType: string;
  state: string;
  label: string;
  style: string;
  urlTemplate: string | null;
  icon: string | null;
  isDisabled: boolean;
  requiresAuth: boolean;
  requiresOnboarding: boolean;
  requiresSubscription: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const styleOptions = [
  { value: "primary", label: "Primary (Gradient)" },
  { value: "secondary", label: "Secondary" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "danger", label: "Danger (Red)" },
  { value: "success", label: "Success (Green)" },
  { value: "disabled", label: "Disabled (Gray)" },
];

const targetTypeOptions = [
  { value: "community", label: "Community" },
  { value: "event", label: "Event" },
  { value: "service", label: "Service" },
  { value: "subscription", label: "Subscription" },
  { value: "hero", label: "Hero Section" },
];

const communityStates = ["not_member", "pending", "member", "invited", "blocked", "admin", "moderator"];
const eventStates = ["not_registered", "registered", "cancelled", "attended", "waitlisted", "live", "finished"];
const serviceStates = ["none", "pending", "confirmed", "in_progress", "completed", "cancelled"];
const subscriptionStates = ["none", "trial", "active", "expired", "cancelled"];
const heroStates = ["guest", "logged_in"];

function getStatesForType(targetType: string): string[] {
  switch (targetType) {
    case "community":
      return communityStates;
    case "event":
      return eventStates;
    case "service":
      return serviceStates;
    case "subscription":
      return subscriptionStates;
    case "hero":
      return heroStates;
    default:
      return [];
  }
}

export default function CTAConfigPage() {
  const [configs, setConfigs] = useState<CTAConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CTAConfig | null>(null);
  const [formData, setFormData] = useState({
    page: "",
    targetType: "community",
    state: "",
    label: "",
    style: "primary",
    urlTemplate: "",
    icon: "",
    isDisabled: false,
    requiresAuth: false,
    requiresOnboarding: false,
    requiresSubscription: "",
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const res = await fetch("/api/admin/cta-config");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (error) {
      toast.error("Failed to fetch CTA configurations");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingConfig(null);
    setFormData({
      page: "",
      targetType: "community",
      state: "",
      label: "",
      style: "primary",
      urlTemplate: "",
      icon: "",
      isDisabled: false,
      requiresAuth: false,
      requiresOnboarding: false,
      requiresSubscription: "",
      sortOrder: 0,
      isActive: true,
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(config: CTAConfig) {
    setEditingConfig(config);
    setFormData({
      page: config.page,
      targetType: config.targetType,
      state: config.state,
      label: config.label,
      style: config.style,
      urlTemplate: config.urlTemplate || "",
      icon: config.icon || "",
      isDisabled: config.isDisabled,
      requiresAuth: config.requiresAuth,
      requiresOnboarding: config.requiresOnboarding,
      requiresSubscription: config.requiresSubscription || "",
      sortOrder: config.sortOrder,
      isActive: config.isActive,
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formData.page || !formData.targetType || !formData.state || !formData.label) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const url = editingConfig
        ? `/api/admin/cta-config/${editingConfig.id}`
        : "/api/admin/cta-config";
      const method = editingConfig ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          urlTemplate: formData.urlTemplate || null,
          icon: formData.icon || null,
          requiresSubscription: formData.requiresSubscription || null,
        }),
      });

      if (res.ok) {
        toast.success(editingConfig ? "CTA updated successfully" : "CTA created successfully");
        setIsDialogOpen(false);
        fetchConfigs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Operation failed");
      }
    } catch (error) {
      toast.error("Failed to save CTA configuration");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this CTA configuration?")) return;

    try {
      const res = await fetch(`/api/admin/cta-config/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("CTA configuration deleted");
        fetchConfigs();
      } else {
        toast.error("Failed to delete CTA configuration");
      }
    } catch (error) {
      toast.error("Failed to delete CTA configuration");
    }
  }

  async function handleToggleActive(config: CTAConfig) {
    try {
      const res = await fetch(`/api/admin/cta-config/${config.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !config.isActive }),
      });

      if (res.ok) {
        toast.success(`CTA ${config.isActive ? "disabled" : "enabled"}`);
        fetchConfigs();
      }
    } catch (error) {
      toast.error("Failed to update CTA configuration");
    }
  }

  const getStyleBadge = (style: string) => {
    const variants: Record<string, string> = {
      primary: "bg-gradient-to-r from-primary to-blue-600 text-white",
      secondary: "bg-slate-100 text-slate-900",
      outline: "border border-slate-300",
      ghost: "bg-transparent",
      danger: "bg-red-600 text-white",
      success: "bg-green-600 text-white",
      disabled: "bg-slate-300 text-slate-500",
    };
    return <Badge className={variants[style] || variants.primary}>{style}</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-slate-600 hover:text-slate-900">
                ← Back to Admin
              </Link>
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">CTA Configuration</h1>
              </div>
            </div>
            <Button onClick={openCreateDialog} className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" /> Add CTA Config
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>CTA Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : configs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No CTA configurations yet. Click "Add CTA Config" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Style</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.page}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{config.targetType}</Badge>
                      </TableCell>
                      <TableCell>{config.state}</TableCell>
                      <TableCell>{config.label}</TableCell>
                      <TableCell>{getStyleBadge(config.style)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={config.isActive}
                          onCheckedChange={() => handleToggleActive(config)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(config)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(config.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? "Edit CTA Configuration" : "Create CTA Configuration"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="page">Page *</Label>
                <Input
                  id="page"
                  value={formData.page}
                  onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                  placeholder="e.g., community-detail, event-detail"
                  disabled={!!editingConfig}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetType">Target Type *</Label>
                <Select
                  value={formData.targetType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, targetType: value, state: "" })
                  }
                  disabled={!!editingConfig}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {targetTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                  disabled={!!editingConfig}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatesForType(formData.targetType).map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Button Label *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Join Community"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="style">Button Style</Label>
                <Select
                  value={formData.style}
                  onValueChange={(value) => setFormData({ ...formData, style: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon Name</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., Users, Calendar"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urlTemplate">URL Template</Label>
              <Input
                id="urlTemplate"
                value={formData.urlTemplate}
                onChange={(e) => setFormData({ ...formData, urlTemplate: e.target.value })}
                placeholder="e.g., /communities/{id}/discussions"
              />
              <p className="text-xs text-muted-foreground">
                Use {"{id}"} as placeholder for the target ID
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requiresSubscription">Requires Subscription Tier</Label>
                <Input
                  id="requiresSubscription"
                  value={formData.requiresSubscription}
                  onChange={(e) =>
                    setFormData({ ...formData, requiresSubscription: e.target.value })
                  }
                  placeholder="e.g., pro, creator"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="isDisabled">Button Disabled</Label>
                <Switch
                  id="isDisabled"
                  checked={formData.isDisabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isDisabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="isActive">Configuration Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="requiresAuth">Requires Authentication</Label>
                <Switch
                  id="requiresAuth"
                  checked={formData.requiresAuth}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiresAuth: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="requiresOnboarding">Requires Onboarding</Label>
                <Switch
                  id="requiresOnboarding"
                  checked={formData.requiresOnboarding}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiresOnboarding: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-gradient-primary">
              {editingConfig ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
