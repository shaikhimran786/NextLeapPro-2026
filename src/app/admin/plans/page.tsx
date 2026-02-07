"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { CreditCard, Edit, CheckCircle, Star, IndianRupee, History, MessageCircle, Link2, Plus } from "@/lib/icons";
import { formatINR } from "@/lib/utils";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  intervalCount: number;
  features: string[];
  tier: string;
  planCode: string;
  cashfreePlanId: string | null;
  trialDays: number;
  sortOrder: number;
  isPopular: boolean;
  active: boolean;
  whatsappUrl: string | null;
  whatsappMessage: string | null;
  customPaymentUrl: string | null;
  useCustomPayment: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PriceHistory {
  id: number;
  oldPrice: number;
  newPrice: number;
  changedBy: number | null;
  reason: string | null;
  createdAt: string;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [showHistoryFor, setShowHistoryFor] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    price: "",
    description: "",
    trialDays: "",
    isPopular: false,
    active: true,
    reason: "",
    whatsappUrl: "",
    whatsappMessage: "",
    customPaymentUrl: "",
    useCustomPayment: false,
  });
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "INR",
    interval: "month",
    intervalCount: "1",
    features: "",
    tier: "",
    planCode: "",
    trialDays: "0",
    sortOrder: "0",
    isPopular: false,
    active: true,
    whatsappUrl: "",
    whatsappMessage: "",
    customPaymentUrl: "",
    useCustomPayment: false,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const response = await fetch("/api/admin/plans");
      if (!response.ok) throw new Error("Failed to fetch plans");
      const data = await response.json();
      setPlans(data.plans);
    } catch (error) {
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPriceHistory(planId: number) {
    try {
      const response = await fetch(`/api/admin/plans/${planId}/history`);
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setPriceHistory(data.history);
      setShowHistoryFor(planId);
    } catch (error) {
      toast.error("Failed to load price history");
    }
  }

  function openEditDialog(plan: SubscriptionPlan) {
    setEditingPlan(plan);
    setFormData({
      price: plan.price.toString(),
      description: plan.description,
      trialDays: plan.trialDays.toString(),
      isPopular: plan.isPopular,
      active: plan.active,
      reason: "",
      whatsappUrl: plan.whatsappUrl || "",
      whatsappMessage: plan.whatsappMessage || "",
      customPaymentUrl: plan.customPaymentUrl || "",
      useCustomPayment: plan.useCustomPayment,
    });
  }

  async function handleSave() {
    if (!editingPlan) return;

    try {
      const response = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: parseFloat(formData.price),
          description: formData.description,
          trialDays: parseInt(formData.trialDays),
          isPopular: formData.isPopular,
          active: formData.active,
          reason: formData.reason || undefined,
          whatsappUrl: formData.whatsappUrl || null,
          whatsappMessage: formData.whatsappMessage || null,
          customPaymentUrl: formData.customPaymentUrl || null,
          useCustomPayment: formData.useCustomPayment,
        }),
      });

      if (!response.ok) throw new Error("Failed to update plan");

      toast.success("Subscription plan updated successfully");

      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      toast.error("Failed to update plan");
    }
  }

  async function togglePlanActive(plan: SubscriptionPlan) {
    try {
      const response = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: !plan.active,
        }),
      });

      if (!response.ok) throw new Error("Failed to update plan");

      toast.success(`Plan ${!plan.active ? "activated" : "deactivated"} successfully`);

      fetchPlans();
    } catch (error) {
      toast.error("Failed to update plan status");
    }
  }

  function resetCreateForm() {
    setCreateFormData({
      name: "",
      description: "",
      price: "",
      currency: "INR",
      interval: "month",
      intervalCount: "1",
      features: "",
      tier: "",
      planCode: "",
      trialDays: "0",
      sortOrder: "0",
      isPopular: false,
      active: true,
      whatsappUrl: "",
      whatsappMessage: "",
      customPaymentUrl: "",
      useCustomPayment: false,
    });
  }

  async function handleCreate() {
    if (!createFormData.name || !createFormData.description || !createFormData.price || !createFormData.tier || !createFormData.planCode) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      const featuresArray = createFormData.features
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: createFormData.name,
          description: createFormData.description,
          price: parseFloat(createFormData.price),
          currency: createFormData.currency,
          interval: createFormData.interval,
          intervalCount: parseInt(createFormData.intervalCount),
          features: featuresArray,
          tier: createFormData.tier,
          planCode: createFormData.planCode,
          trialDays: parseInt(createFormData.trialDays),
          sortOrder: parseInt(createFormData.sortOrder),
          isPopular: createFormData.isPopular,
          active: createFormData.active,
          whatsappUrl: createFormData.whatsappUrl || null,
          whatsappMessage: createFormData.whatsappMessage || null,
          customPaymentUrl: createFormData.customPaymentUrl || null,
          useCustomPayment: createFormData.useCustomPayment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create plan");
      }

      toast.success("Subscription plan created successfully!");
      setShowCreateDialog(false);
      resetCreateForm();
      fetchPlans();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create plan";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
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
          <h1 className="text-3xl font-heading font-bold text-slate-900">Subscription Plans</h1>
          <p className="text-slate-600 mt-1">Manage pricing and features for subscription tiers</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-plan">
          <Plus className="h-4 w-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            All Plans
          </CardTitle>
          <CardDescription>
            Configure pricing, trial periods, and availability of each plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Trial Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plan.name}</span>
                      {plan.isPopular && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{plan.tier}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {formatINR(plan.price).replace("₹", "")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {plan.intervalCount} {plan.interval}
                    {plan.intervalCount > 1 ? "s" : ""}
                  </TableCell>
                  <TableCell>{plan.trialDays} days</TableCell>
                  <TableCell>
                    <Switch
                      checked={plan.active}
                      onCheckedChange={() => togglePlanActive(plan)}
                      data-testid={`switch-plan-active-${plan.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(plan)}
                        data-testid={`button-edit-plan-${plan.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchPriceHistory(plan.id)}
                        data-testid={`button-history-plan-${plan.id}`}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Plan: {editingPlan?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (INR)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                data-testid="input-plan-price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-plan-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trialDays">Trial Days</Label>
              <Input
                id="trialDays"
                type="number"
                value={formData.trialDays}
                onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
                data-testid="input-plan-trial-days"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isPopular"
                checked={formData.isPopular}
                onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                data-testid="switch-plan-popular"
              />
              <Label htmlFor="isPopular">Mark as Popular</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                data-testid="switch-plan-active-edit"
              />
              <Label htmlFor="active">Active</Label>
            </div>
            {editingPlan && parseFloat(formData.price) !== editingPlan.price && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for price change (optional)</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Seasonal promotion, Cost adjustment"
                  data-testid="input-plan-reason"
                />
              </div>
            )}
            
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">WhatsApp Redirect (after subscription)</span>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="whatsappUrl">WhatsApp Group Link</Label>
                  <Input
                    id="whatsappUrl"
                    value={formData.whatsappUrl}
                    onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })}
                    placeholder="https://chat.whatsapp.com/..."
                    data-testid="input-plan-whatsapp-url"
                  />
                  <p className="text-xs text-slate-500">Users will be redirected here after successful subscription</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappMessage">Welcome Message (optional)</Label>
                  <Input
                    id="whatsappMessage"
                    value={formData.whatsappMessage}
                    onChange={(e) => setFormData({ ...formData, whatsappMessage: e.target.value })}
                    placeholder="Welcome to the Pro community!"
                    data-testid="input-plan-whatsapp-message"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Custom Payment URL</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Override default Cashfree checkout with a custom payment link (e.g., external payment page, Google Form).
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="useCustomPayment"
                    checked={formData.useCustomPayment}
                    onCheckedChange={(checked) => setFormData({ ...formData, useCustomPayment: checked })}
                    data-testid="switch-plan-use-custom-payment"
                  />
                  <Label htmlFor="useCustomPayment">Use Custom Payment URL</Label>
                </div>
                {formData.useCustomPayment && (
                  <div className="space-y-2">
                    <Label htmlFor="customPaymentUrl">Custom Payment URL</Label>
                    <Input
                      id="customPaymentUrl"
                      value={formData.customPaymentUrl}
                      onChange={(e) => setFormData({ ...formData, customPaymentUrl: e.target.value })}
                      placeholder="https://example.com/pay or https://forms.google.com/..."
                      data-testid="input-plan-custom-payment-url"
                    />
                    <p className="text-xs text-slate-500">
                      When enabled, users clicking "Subscribe" will be redirected to this URL instead of Cashfree.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-plan">
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryFor !== null} onOpenChange={() => setShowHistoryFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Price History: {plans.find((p) => p.id === showHistoryFor)?.name}
            </DialogTitle>
          </DialogHeader>
          {priceHistory.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {priceHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 bg-slate-50 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm">
                      <span className="text-slate-500 line-through">
                        {formatINR(entry.oldPrice)}
                      </span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{formatINR(entry.newPrice)}</span>
                    </p>
                    {entry.reason && (
                      <p className="text-xs text-slate-500 mt-1">{entry.reason}</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No price changes recorded</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetCreateForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Subscription Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Plan Name *</Label>
                <Input
                  id="create-name"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="e.g., Pro Monthly"
                  data-testid="input-create-plan-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-tier">Tier (unique) *</Label>
                <Input
                  id="create-tier"
                  value={createFormData.tier}
                  onChange={(e) => setCreateFormData({ ...createFormData, tier: e.target.value })}
                  placeholder="e.g., pro_monthly"
                  data-testid="input-create-plan-tier"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-planCode">Plan Code (unique) *</Label>
                <Input
                  id="create-planCode"
                  value={createFormData.planCode}
                  onChange={(e) => setCreateFormData({ ...createFormData, planCode: e.target.value })}
                  placeholder="e.g., PRO_MONTHLY"
                  data-testid="input-create-plan-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-price">Price (INR) *</Label>
                <Input
                  id="create-price"
                  type="number"
                  value={createFormData.price}
                  onChange={(e) => setCreateFormData({ ...createFormData, price: e.target.value })}
                  placeholder="e.g., 499"
                  data-testid="input-create-plan-price"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description *</Label>
              <Textarea
                id="create-description"
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="Brief description of this plan"
                data-testid="input-create-plan-description"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-interval">Billing Interval</Label>
                <Select
                  value={createFormData.interval}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, interval: value })}
                >
                  <SelectTrigger data-testid="select-create-plan-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-intervalCount">Interval Count</Label>
                <Input
                  id="create-intervalCount"
                  type="number"
                  value={createFormData.intervalCount}
                  onChange={(e) => setCreateFormData({ ...createFormData, intervalCount: e.target.value })}
                  placeholder="1"
                  data-testid="input-create-plan-interval-count"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-trialDays">Trial Days</Label>
                <Input
                  id="create-trialDays"
                  type="number"
                  value={createFormData.trialDays}
                  onChange={(e) => setCreateFormData({ ...createFormData, trialDays: e.target.value })}
                  placeholder="0"
                  data-testid="input-create-plan-trial-days"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-features">Features (comma-separated)</Label>
              <Textarea
                id="create-features"
                value={createFormData.features}
                onChange={(e) => setCreateFormData({ ...createFormData, features: e.target.value })}
                placeholder="Feature 1, Feature 2, Feature 3"
                data-testid="input-create-plan-features"
              />
              <p className="text-xs text-slate-500">Enter features separated by commas</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-sortOrder">Sort Order</Label>
                <Input
                  id="create-sortOrder"
                  type="number"
                  value={createFormData.sortOrder}
                  onChange={(e) => setCreateFormData({ ...createFormData, sortOrder: e.target.value })}
                  placeholder="0"
                  data-testid="input-create-plan-sort-order"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-currency">Currency</Label>
                <Select
                  value={createFormData.currency}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, currency: value })}
                >
                  <SelectTrigger data-testid="select-create-plan-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="create-isPopular"
                  checked={createFormData.isPopular}
                  onCheckedChange={(checked) => setCreateFormData({ ...createFormData, isPopular: checked })}
                  data-testid="switch-create-plan-popular"
                />
                <Label htmlFor="create-isPopular">Mark as Popular</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="create-active"
                  checked={createFormData.active}
                  onCheckedChange={(checked) => setCreateFormData({ ...createFormData, active: checked })}
                  data-testid="switch-create-plan-active"
                />
                <Label htmlFor="create-active">Active</Label>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">WhatsApp Redirect (optional)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-whatsappUrl">WhatsApp Group Link</Label>
                  <Input
                    id="create-whatsappUrl"
                    value={createFormData.whatsappUrl}
                    onChange={(e) => setCreateFormData({ ...createFormData, whatsappUrl: e.target.value })}
                    placeholder="https://chat.whatsapp.com/..."
                    data-testid="input-create-plan-whatsapp-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-whatsappMessage">Welcome Message</Label>
                  <Input
                    id="create-whatsappMessage"
                    value={createFormData.whatsappMessage}
                    onChange={(e) => setCreateFormData({ ...createFormData, whatsappMessage: e.target.value })}
                    placeholder="Welcome to the community!"
                    data-testid="input-create-plan-whatsapp-message"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Custom Payment URL (optional)</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Switch
                  id="create-useCustomPayment"
                  checked={createFormData.useCustomPayment}
                  onCheckedChange={(checked) => setCreateFormData({ ...createFormData, useCustomPayment: checked })}
                  data-testid="switch-create-plan-use-custom-payment"
                />
                <Label htmlFor="create-useCustomPayment">Use Custom Payment URL</Label>
              </div>
              {createFormData.useCustomPayment && (
                <div className="space-y-2">
                  <Input
                    value={createFormData.customPaymentUrl}
                    onChange={(e) => setCreateFormData({ ...createFormData, customPaymentUrl: e.target.value })}
                    placeholder="https://example.com/pay or https://forms.google.com/..."
                    data-testid="input-create-plan-custom-payment-url"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetCreateForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating} data-testid="button-submit-create-plan">
              <Plus className="h-4 w-4 mr-2" />
              {creating ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
