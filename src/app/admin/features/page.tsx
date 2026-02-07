"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "@/lib/icons";

interface FeatureToggle {
  id: number;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<FeatureToggle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const res = await fetch("/api/admin/features");
      if (res.ok) {
        const data = await res.json();
        setFeatures(data);
      }
    } catch (error) {
      toast.error("Failed to load features");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeature = async (id: number, enabled: boolean) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/features/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (res.ok) {
        setFeatures(
          features.map((f) => (f.id === id ? { ...f, enabled } : f))
        );
        toast.success("Feature updated successfully!");
      } else {
        toast.error("Failed to update feature");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-slate-900">Feature Toggles</h1>
        <p className="text-slate-600 mt-1">Enable or disable platform features.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Platform Features</CardTitle>
          <CardDescription>Toggle features on or off for all users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <h3 className="font-medium text-slate-900">{feature.name}</h3>
                  {feature.description && (
                    <p className="text-sm text-slate-500">{feature.description}</p>
                  )}
                  <span className="text-xs text-slate-400 font-mono mt-1 block">
                    {feature.key}
                  </span>
                </div>
                <Switch
                  checked={feature.enabled}
                  onCheckedChange={(checked) => toggleFeature(feature.id, checked)}
                  disabled={updating === feature.id}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
