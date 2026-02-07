"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Loader2, Image, Globe, Plus, Trash2, ExternalLink, Twitter, Facebook, Instagram, Linkedin, Youtube, Github, CreditCard, AlertCircle, CheckCircle2, Copy, Sparkles, Play, RotateCcw } from "@/lib/icons";
import { Slider } from "@/components/ui/slider";
import { HeroTitle, HeroAnimationConfig, HeroGradientsConfig, DEFAULT_ANIMATION, DEFAULT_GRADIENTS } from "@/components/sections/HeroTitle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  isActive: boolean;
}

interface Favicons {
  favicon16: string;
  favicon32: string;
  apple180: string;
  android192: string;
  android512: string;
}

interface SiteSettings {
  id: number;
  siteName: string;
  slogan: string;
  defaultCurrency: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCTA: string;
  heroImage: string | null;
  heroAnimation: HeroAnimationConfig;
  heroGradients: HeroGradientsConfig;
  footerHtml: string | null;
  analyticsEnabled: boolean;
  logoLight: string | null;
  logoDark: string | null;
  footerLogo: string | null;
  adminLogo: string | null;
  favicons: Favicons;
  socialLinks: SocialLink[];
  paymentEnabled: boolean;
  paymentTestMode: boolean;
  activePaymentGateway: string;
  demoVideoEmbedUrl: string | null;
  demoVideoTitle: string | null;
  demoVideoDescription: string | null;
  homeDemoActive: boolean;
  howItWorksDemoActive: boolean;
  dashboardDemoActive: boolean;
}

interface PaymentStatus {
  cashfreeConfigured: boolean;
  cashfreeAppId: string | null;
  cashfreeWebhookUrl: string;
  paymentGateway: string;
}

const SOCIAL_PLATFORMS = [
  { id: "twitter", name: "Twitter / X", icon: Twitter },
  { id: "facebook", name: "Facebook", icon: Facebook },
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin },
  { id: "youtube", name: "YouTube", icon: Youtube },
  { id: "github", name: "GitHub", icon: Github },
  { id: "website", name: "Website", icon: Globe },
];

const defaultFavicons: Favicons = {
  favicon16: "/favicon-16x16.png",
  favicon32: "/favicon-32x32.png",
  apple180: "/apple-touch-icon.png",
  android192: "/android-chrome-192x192.png",
  android512: "/android-chrome-512x512.png",
};

const ANIMATION_TYPES = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade In" },
  { value: "slide", label: "Slide Up" },
  { value: "scale", label: "Scale" },
  { value: "bounce", label: "Bounce" },
  { value: "typewriter", label: "Typewriter" },
];

const EASING_OPTIONS = [
  { value: "linear", label: "Linear" },
  { value: "easeIn", label: "Ease In" },
  { value: "easeOut", label: "Ease Out" },
  { value: "easeInOut", label: "Ease In Out" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    Promise.all([fetchSettings(), fetchPaymentStatus()]);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const heroAnimation = typeof data.heroAnimation === "string" 
          ? JSON.parse(data.heroAnimation) 
          : data.heroAnimation || DEFAULT_ANIMATION;
        const heroGradients = typeof data.heroGradients === "string"
          ? JSON.parse(data.heroGradients)
          : data.heroGradients || DEFAULT_GRADIENTS;
        setSettings({
          ...data,
          heroAnimation,
          heroGradients,
          favicons: data.favicons || defaultFavicons,
          socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : [],
          paymentEnabled: data.paymentEnabled ?? true,
          paymentTestMode: data.paymentTestMode ?? true,
          activePaymentGateway: data.activePaymentGateway || "cashfree",
          demoVideoEmbedUrl: data.demoVideoEmbedUrl || null,
          demoVideoTitle: data.demoVideoTitle || null,
          demoVideoDescription: data.demoVideoDescription || null,
          homeDemoActive: data.homeDemoActive ?? true,
          howItWorksDemoActive: data.howItWorksDemoActive ?? true,
          dashboardDemoActive: data.dashboardDemoActive ?? true,
        });
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentStatus = async () => {
    try {
      const res = await fetch("/api/admin/payment-status");
      if (res.ok) {
        const data = await res.json();
        setPaymentStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch payment status");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const addSocialLink = () => {
    if (!settings) return;
    const newLink: SocialLink = {
      id: Date.now().toString(),
      platform: "twitter",
      url: "",
      isActive: true,
    };
    setSettings({
      ...settings,
      socialLinks: [...settings.socialLinks, newLink],
    });
  };

  const updateSocialLink = (id: string, field: keyof SocialLink, value: string | boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      socialLinks: settings.socialLinks.map(link =>
        link.id === id ? { ...link, [field]: value } : link
      ),
    });
  };

  const removeSocialLink = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      socialLinks: settings.socialLinks.filter(link => link.id !== id),
    });
  };

  const getPlatformIcon = (platform: string) => {
    const found = SOCIAL_PLATFORMS.find(p => p.id === platform);
    if (found) {
      const Icon = found.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Globe className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-9 w-48 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full max-w-4xl bg-slate-200 rounded-lg animate-pulse" />
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-24 w-full bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return <p>No settings found.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-slate-900" data-testid="text-page-title">Site Settings</h1>
        <p className="text-slate-600 mt-1">Manage your website configuration, branding, and social presence.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 max-w-4xl">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="hero">Hero Title</TabsTrigger>
          <TabsTrigger value="demo">Demo Video</TabsTrigger>
          <TabsTrigger value="logos">Logos</TabsTrigger>
          <TabsTrigger value="favicons">Favicons</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="general" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic site information and branding.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      data-testid="input-site-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slogan">Slogan</Label>
                    <Input
                      id="slogan"
                      value={settings.slogan}
                      onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                      data-testid="input-slogan"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Input
                    id="defaultCurrency"
                    value={settings.defaultCurrency}
                    onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                    placeholder="INR"
                    data-testid="input-currency"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Customize the homepage hero content.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="heroTitle">Hero Title</Label>
                  <Input
                    id="heroTitle"
                    value={settings.heroTitle}
                    onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                    data-testid="input-hero-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                  <Textarea
                    id="heroSubtitle"
                    value={settings.heroSubtitle}
                    onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                    rows={3}
                    data-testid="input-hero-subtitle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroCTA">Call to Action Button Text</Label>
                  <Input
                    id="heroCTA"
                    value={settings.heroCTA}
                    onChange={(e) => setSettings({ ...settings, heroCTA: e.target.value })}
                    data-testid="input-hero-cta"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroImage">Hero Image URL</Label>
                  <Input
                    id="heroImage"
                    value={settings.heroImage || ""}
                    onChange={(e) => setSettings({ ...settings, heroImage: e.target.value || null })}
                    placeholder="/images/hero.jpg"
                    data-testid="input-hero-image"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Footer & Analytics</CardTitle>
                <CardDescription>Configure footer content and analytics settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="footerHtml">Custom Footer HTML</Label>
                  <Textarea
                    id="footerHtml"
                    value={settings.footerHtml || ""}
                    onChange={(e) => setSettings({ ...settings, footerHtml: e.target.value || null })}
                    rows={4}
                    placeholder="<p>Custom footer content...</p>"
                    data-testid="input-footer-html"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analyticsEnabled">Enable Analytics</Label>
                    <p className="text-sm text-slate-500">Track visitor analytics and usage metrics.</p>
                  </div>
                  <Switch
                    id="analyticsEnabled"
                    checked={settings.analyticsEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, analyticsEnabled: checked })}
                    data-testid="switch-analytics"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hero" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Hero Title Animation
                </CardTitle>
                <CardDescription>Configure animated gradients and motion effects for the homepage hero title.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-slate-900 rounded-xl min-h-[120px] flex items-center justify-center">
                  <HeroTitle
                    key={previewKey}
                    overrideTitle={settings.heroTitle}
                    overrideAnimation={settings.heroAnimation}
                    overrideGradients={settings.heroGradients}
                    isPreview={true}
                    className="text-center"
                  />
                </div>
                <div className="flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewKey(prev => prev + 1)}
                    className="gap-2"
                    data-testid="button-replay-animation"
                  >
                    <Play className="h-4 w-4" />
                    Replay Animation
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSettings({
                      ...settings,
                      heroAnimation: DEFAULT_ANIMATION,
                      heroGradients: DEFAULT_GRADIENTS,
                    })}
                    className="gap-2"
                    data-testid="button-reset-hero"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Animation Settings</CardTitle>
                <CardDescription>Choose animation style and timing parameters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Animation Type</Label>
                    <Select
                      value={settings.heroAnimation.type}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        heroAnimation: { ...settings.heroAnimation, type: value as HeroAnimationConfig["type"] }
                      })}
                    >
                      <SelectTrigger data-testid="select-animation-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ANIMATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Easing</Label>
                    <Select
                      value={settings.heroAnimation.easing}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        heroAnimation: { ...settings.heroAnimation, easing: value }
                      })}
                    >
                      <SelectTrigger data-testid="select-animation-easing">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EASING_OPTIONS.map((easing) => (
                          <SelectItem key={easing.value} value={easing.value}>{easing.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Duration</Label>
                      <span className="text-sm text-slate-500">{settings.heroAnimation.duration}s</span>
                    </div>
                    <Slider
                      value={[settings.heroAnimation.duration]}
                      onValueChange={(values: number[]) => setSettings({
                        ...settings,
                        heroAnimation: { ...settings.heroAnimation, duration: values[0] }
                      })}
                      min={0.1}
                      max={2}
                      step={0.1}
                      data-testid="slider-duration"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Initial Delay</Label>
                      <span className="text-sm text-slate-500">{settings.heroAnimation.delay}s</span>
                    </div>
                    <Slider
                      value={[settings.heroAnimation.delay]}
                      onValueChange={(values: number[]) => setSettings({
                        ...settings,
                        heroAnimation: { ...settings.heroAnimation, delay: values[0] }
                      })}
                      min={0}
                      max={1}
                      step={0.05}
                      data-testid="slider-delay"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Word Stagger</Label>
                      <span className="text-sm text-slate-500">{settings.heroAnimation.stagger}s</span>
                    </div>
                    <Slider
                      value={[settings.heroAnimation.stagger]}
                      onValueChange={(values: number[]) => setSettings({
                        ...settings,
                        heroAnimation: { ...settings.heroAnimation, stagger: values[0] }
                      })}
                      min={0}
                      max={0.5}
                      step={0.05}
                      data-testid="slider-stagger"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Loop Animation</Label>
                    <p className="text-sm text-slate-500">Continuously repeat the animation.</p>
                  </div>
                  <Switch
                    checked={settings.heroAnimation.loop}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      heroAnimation: { ...settings.heroAnimation, loop: checked }
                    })}
                    data-testid="switch-loop"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Gradient Colors</CardTitle>
                <CardDescription>Customize the gradient colors for "Learn", "Earn", and "Grow" words.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Use Brand Colors</Label>
                    <p className="text-sm text-slate-500">Use the default brand gradient colors.</p>
                  </div>
                  <Switch
                    checked={settings.heroGradients.source === "brand"}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      heroGradients: { ...settings.heroGradients, source: checked ? "brand" : "custom" }
                    })}
                    data-testid="switch-brand-colors"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Gradient Angle</Label>
                    <span className="text-sm text-slate-500">{settings.heroGradients.angle}°</span>
                  </div>
                  <Slider
                    value={[settings.heroGradients.angle]}
                    onValueChange={(values: number[]) => setSettings({
                      ...settings,
                      heroGradients: { ...settings.heroGradients, angle: values[0] }
                    })}
                    min={0}
                    max={360}
                    step={15}
                    data-testid="slider-gradient-angle"
                  />
                </div>

                {settings.heroGradients.source === "custom" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(90deg, ${settings.heroGradients.learn[0]}, ${settings.heroGradients.learn[1]})` }} />
                          Learn (Magenta)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={settings.heroGradients.learn[0]}
                            onChange={(e) => setSettings({
                              ...settings,
                              heroGradients: {
                                ...settings.heroGradients,
                                learn: [e.target.value, settings.heroGradients.learn[1]]
                              }
                            })}
                            className="w-12 h-10 p-1 cursor-pointer"
                            data-testid="color-learn-start"
                          />
                          <Input
                            type="color"
                            value={settings.heroGradients.learn[1]}
                            onChange={(e) => setSettings({
                              ...settings,
                              heroGradients: {
                                ...settings.heroGradients,
                                learn: [settings.heroGradients.learn[0], e.target.value]
                              }
                            })}
                            className="w-12 h-10 p-1 cursor-pointer"
                            data-testid="color-learn-end"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(90deg, ${settings.heroGradients.earn[0]}, ${settings.heroGradients.earn[1]})` }} />
                          Earn (Blue)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={settings.heroGradients.earn[0]}
                            onChange={(e) => setSettings({
                              ...settings,
                              heroGradients: {
                                ...settings.heroGradients,
                                earn: [e.target.value, settings.heroGradients.earn[1]]
                              }
                            })}
                            className="w-12 h-10 p-1 cursor-pointer"
                            data-testid="color-earn-start"
                          />
                          <Input
                            type="color"
                            value={settings.heroGradients.earn[1]}
                            onChange={(e) => setSettings({
                              ...settings,
                              heroGradients: {
                                ...settings.heroGradients,
                                earn: [settings.heroGradients.earn[0], e.target.value]
                              }
                            })}
                            className="w-12 h-10 p-1 cursor-pointer"
                            data-testid="color-earn-end"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(90deg, ${settings.heroGradients.grow[0]}, ${settings.heroGradients.grow[1]})` }} />
                          Grow (Green)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={settings.heroGradients.grow[0]}
                            onChange={(e) => setSettings({
                              ...settings,
                              heroGradients: {
                                ...settings.heroGradients,
                                grow: [e.target.value, settings.heroGradients.grow[1]]
                              }
                            })}
                            className="w-12 h-10 p-1 cursor-pointer"
                            data-testid="color-grow-start"
                          />
                          <Input
                            type="color"
                            value={settings.heroGradients.grow[1]}
                            onChange={(e) => setSettings({
                              ...settings,
                              heroGradients: {
                                ...settings.heroGradients,
                                grow: [settings.heroGradients.grow[0], e.target.value]
                              }
                            })}
                            className="w-12 h-10 p-1 cursor-pointer"
                            data-testid="color-grow-end"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Feature Demo Video
                </CardTitle>
                <CardDescription>Configure the platform walkthrough video that appears on various pages.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="demoVideoEmbedUrl">Video Embed URL</Label>
                  <Input
                    id="demoVideoEmbedUrl"
                    value={settings.demoVideoEmbedUrl || ""}
                    onChange={(e) => setSettings({ ...settings, demoVideoEmbedUrl: e.target.value || null })}
                    placeholder="https://embed.app.guidde.com/playbooks/..."
                    data-testid="input-demo-video-url"
                  />
                  <p className="text-xs text-slate-500">Enter the embed URL from Guidde, YouTube, Loom, or any video platform.</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="demoVideoTitle">Video Title</Label>
                  <Input
                    id="demoVideoTitle"
                    value={settings.demoVideoTitle || ""}
                    onChange={(e) => setSettings({ ...settings, demoVideoTitle: e.target.value || null })}
                    placeholder="See How Next Leap Pro Works"
                    data-testid="input-demo-video-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demoVideoDescription">Video Description</Label>
                  <Textarea
                    id="demoVideoDescription"
                    value={settings.demoVideoDescription || ""}
                    onChange={(e) => setSettings({ ...settings, demoVideoDescription: e.target.value || null })}
                    placeholder="Watch this quick platform walkthrough to discover how you can Learn new skills, Earn through real opportunities, and Grow with a supportive community."
                    rows={3}
                    data-testid="input-demo-video-description"
                  />
                </div>

                {settings.demoVideoEmbedUrl && (
                  <div className="p-4 bg-slate-100 rounded-xl">
                    <p className="text-sm text-slate-600 mb-3 font-medium">Preview:</p>
                    <div className="relative w-full max-w-xl" style={{ paddingBottom: "56.25%" }}>
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                        src={settings.demoVideoEmbedUrl}
                        title="Demo Video Preview"
                        frameBorder="0"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Video Placement Controls</CardTitle>
                <CardDescription>Choose where the feature demo video should appear.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Home Page</Label>
                    <p className="text-sm text-slate-500">Show video section below the hero on the home page.</p>
                  </div>
                  <Switch
                    checked={settings.homeDemoActive}
                    onCheckedChange={(checked) => setSettings({ ...settings, homeDemoActive: checked })}
                    data-testid="switch-home-demo"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">How It Works Page</Label>
                    <p className="text-sm text-slate-500">Show video as hero element on the How It Works page.</p>
                  </div>
                  <Switch
                    checked={settings.howItWorksDemoActive}
                    onCheckedChange={(checked) => setSettings({ ...settings, howItWorksDemoActive: checked })}
                    data-testid="switch-how-it-works-demo"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Dashboard (New Users)</Label>
                    <p className="text-sm text-slate-500">Show dismissible onboarding card with video for new users.</p>
                  </div>
                  <Switch
                    checked={settings.dashboardDemoActive}
                    onCheckedChange={(checked) => setSettings({ ...settings, dashboardDemoActive: checked })}
                    data-testid="switch-dashboard-demo"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logos" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Logo Management
                </CardTitle>
                <CardDescription>Configure logos for different parts of your website. Use image URLs or paths.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="logoLight">Light Logo (for dark backgrounds)</Label>
                    <Input
                      id="logoLight"
                      value={settings.logoLight || ""}
                      onChange={(e) => setSettings({ ...settings, logoLight: e.target.value || null })}
                      placeholder="/logos/logo-light.png"
                      data-testid="input-logo-light"
                    />
                    {settings.logoLight && (
                      <div className="p-4 bg-slate-800 rounded-lg">
                        <img
                          src={settings.logoLight}
                          alt="Light Logo Preview"
                          className="h-10 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="logoDark">Dark Logo (for light backgrounds)</Label>
                    <Input
                      id="logoDark"
                      value={settings.logoDark || ""}
                      onChange={(e) => setSettings({ ...settings, logoDark: e.target.value || null })}
                      placeholder="/logos/logo-dark.png"
                      data-testid="input-logo-dark"
                    />
                    {settings.logoDark && (
                      <div className="p-4 bg-white border rounded-lg">
                        <img
                          src={settings.logoDark}
                          alt="Dark Logo Preview"
                          className="h-10 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="footerLogo">Footer Logo</Label>
                    <Input
                      id="footerLogo"
                      value={settings.footerLogo || ""}
                      onChange={(e) => setSettings({ ...settings, footerLogo: e.target.value || null })}
                      placeholder="/logos/logo-light.png"
                      data-testid="input-footer-logo"
                    />
                    {settings.footerLogo && (
                      <div className="p-4 bg-slate-800 rounded-lg">
                        <img
                          src={settings.footerLogo}
                          alt="Footer Logo Preview"
                          className="h-8 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="adminLogo">Admin Panel Logo</Label>
                    <Input
                      id="adminLogo"
                      value={settings.adminLogo || ""}
                      onChange={(e) => setSettings({ ...settings, adminLogo: e.target.value || null })}
                      placeholder="/logos/logo-dark.png"
                      data-testid="input-admin-logo"
                    />
                    {settings.adminLogo && (
                      <div className="p-4 bg-white border rounded-lg">
                        <img
                          src={settings.adminLogo}
                          alt="Admin Logo Preview"
                          className="h-8 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favicons" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Favicon Management
                </CardTitle>
                <CardDescription>Configure favicons for different devices and platforms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="favicon16">Favicon 16x16</Label>
                    <Input
                      id="favicon16"
                      value={settings.favicons?.favicon16 || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        favicons: { ...settings.favicons, favicon16: e.target.value }
                      })}
                      placeholder="/favicon-16x16.png"
                      data-testid="input-favicon-16"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favicon32">Favicon 32x32</Label>
                    <Input
                      id="favicon32"
                      value={settings.favicons?.favicon32 || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        favicons: { ...settings.favicons, favicon32: e.target.value }
                      })}
                      placeholder="/favicon-32x32.png"
                      data-testid="input-favicon-32"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apple180">Apple Touch Icon (180x180)</Label>
                    <Input
                      id="apple180"
                      value={settings.favicons?.apple180 || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        favicons: { ...settings.favicons, apple180: e.target.value }
                      })}
                      placeholder="/apple-touch-icon.png"
                      data-testid="input-favicon-apple"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="android192">Android Chrome (192x192)</Label>
                    <Input
                      id="android192"
                      value={settings.favicons?.android192 || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        favicons: { ...settings.favicons, android192: e.target.value }
                      })}
                      placeholder="/android-chrome-192x192.png"
                      data-testid="input-favicon-android-192"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="android512">Android Chrome (512x512)</Label>
                    <Input
                      id="android512"
                      value={settings.favicons?.android512 || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        favicons: { ...settings.favicons, android512: e.target.value }
                      })}
                      placeholder="/android-chrome-512x512.png"
                      data-testid="input-favicon-android-512"
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Preview</h4>
                  <div className="flex items-center gap-4">
                    {settings.favicons?.favicon16 && (
                      <div className="text-center">
                        <img
                          src={settings.favicons.favicon16}
                          alt="16x16"
                          className="h-4 w-4 mx-auto"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="text-xs text-slate-500">16px</span>
                      </div>
                    )}
                    {settings.favicons?.favicon32 && (
                      <div className="text-center">
                        <img
                          src={settings.favicons.favicon32}
                          alt="32x32"
                          className="h-8 w-8 mx-auto"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="text-xs text-slate-500">32px</span>
                      </div>
                    )}
                    {settings.favicons?.apple180 && (
                      <div className="text-center">
                        <img
                          src={settings.favicons.apple180}
                          alt="180x180"
                          className="h-12 w-12 mx-auto rounded-lg"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="text-xs text-slate-500">Apple</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Social Media Links
                  </CardTitle>
                  <CardDescription>Manage social media links displayed on your website.</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSocialLink}
                  className="gap-1"
                  data-testid="button-add-social"
                >
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              </CardHeader>
              <CardContent>
                {settings.socialLinks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Globe className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>No social media links added yet.</p>
                    <p className="text-sm">Click "Add Link" to add your first social profile.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {settings.socialLinks.map((link, index) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50"
                      >
                        <div className="flex-shrink-0">
                          {getPlatformIcon(link.platform)}
                        </div>

                        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Select
                            value={link.platform}
                            onValueChange={(value) => updateSocialLink(link.id, "platform", value)}
                          >
                            <SelectTrigger data-testid={`select-platform-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SOCIAL_PLATFORMS.map((platform) => (
                                <SelectItem key={platform.id} value={platform.id}>
                                  <div className="flex items-center gap-2">
                                    <platform.icon className="h-4 w-4" />
                                    {platform.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            placeholder="https://twitter.com/yourhandle"
                            value={link.url}
                            onChange={(e) => updateSocialLink(link.id, "url", e.target.value)}
                            className="md:col-span-2"
                            data-testid={`input-social-url-${index}`}
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={link.isActive}
                              onCheckedChange={(checked) => updateSocialLink(link.id, "isActive", checked)}
                              data-testid={`switch-social-active-${index}`}
                            />
                            <Badge variant={link.isActive ? "default" : "secondary"}>
                              {link.isActive ? "Active" : "Hidden"}
                            </Badge>
                          </div>

                          {link.url && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(link.url, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSocialLink(link.id)}
                            className="text-red-500 hover:text-red-600"
                            data-testid={`button-remove-social-${index}`}
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
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Active Payment Gateway
                </CardTitle>
                <CardDescription>Choose which payment gateway to use for subscription payments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Enable Payments</Label>
                      <p className="text-sm text-slate-500">Allow users to make payments for subscriptions.</p>
                    </div>
                    <Switch
                      checked={settings.paymentEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, paymentEnabled: checked })}
                      data-testid="switch-payment-enabled"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Test Mode</Label>
                      <p className="text-sm text-slate-500">Use test environment (no real transactions).</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={settings.paymentTestMode ? "secondary" : "default"}>
                        {settings.paymentTestMode ? "Test" : "Live"}
                      </Badge>
                      <Switch
                        checked={settings.paymentTestMode}
                        onCheckedChange={(checked) => setSettings({ ...settings, paymentTestMode: checked })}
                        data-testid="switch-test-mode"
                      />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-3 block">Payment Gateway</Label>
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="text-green-600">Cashfree</Badge>
                      {paymentStatus?.cashfreeConfigured && (
                        <Badge variant="outline" className="text-green-600 border-green-600">Ready</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Modern payment gateway for Indian transactions.</p>
                    {!paymentStatus?.cashfreeConfigured && (
                      <p className="text-amber-600 text-sm mt-3">Cashfree is not configured. Please add API keys in the Cashfree section below.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Cashfree Payment Gateway
                </CardTitle>
                <CardDescription>Configure Cashfree payment integration for subscriptions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {paymentStatus?.cashfreeConfigured ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Cashfree Connected</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Your Cashfree integration is properly configured and ready to accept payments.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Cashfree Not Configured</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      Please add your Cashfree API keys in the Secrets tab to enable Cashfree payment processing.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Cashfree API Keys Status</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Cashfree App ID</p>
                        <p className="text-xs text-slate-500 font-mono">
                          {paymentStatus?.cashfreeAppId 
                            ? `${paymentStatus.cashfreeAppId.substring(0, 12)}...` 
                            : "Not configured"}
                        </p>
                      </div>
                      <Badge variant={paymentStatus?.cashfreeAppId ? "default" : "destructive"}>
                        {paymentStatus?.cashfreeAppId ? "Configured" : "Missing"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Cashfree Secret Key</p>
                        <p className="text-xs text-slate-500">Stored securely in environment</p>
                      </div>
                      <Badge variant={paymentStatus?.cashfreeConfigured ? "default" : "destructive"}>
                        {paymentStatus?.cashfreeConfigured ? "Configured" : "Missing"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {paymentStatus?.cashfreeWebhookUrl && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label>Cashfree Webhook URL</Label>
                    <p className="text-xs text-slate-500">Add this URL to your Cashfree Dashboard under Webhooks.</p>
                    <div className="flex gap-2">
                      <Input
                        value={paymentStatus.cashfreeWebhookUrl}
                        readOnly
                        className="font-mono text-sm bg-slate-50"
                        data-testid="input-cashfree-webhook-url"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(paymentStatus.cashfreeWebhookUrl)}
                        data-testid="button-copy-cashfree-webhook"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">How to Configure Cashfree</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
                    <li>Go to your Cashfree Merchant Dashboard and get your API keys</li>
                    <li>Add <code className="bg-slate-100 px-1 rounded">CASHFREE_APP_ID</code> and <code className="bg-slate-100 px-1 rounded">CASHFREE_SECRET_KEY</code> in the Secrets tab</li>
                    <li>Copy the webhook URL above and add it to Cashfree Webhooks</li>
                    <li>Enable the required webhook events (payment success, failed, etc.)</li>
                    <li>Test with sandbox credentials before going live</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end pt-6">
            <Button type="submit" disabled={isSaving} className="gap-2" data-testid="button-save-settings">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
