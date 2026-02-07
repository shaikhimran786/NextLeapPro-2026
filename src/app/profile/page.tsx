"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Edit, 
  Share2, 
  Crown, 
  CheckCircle,
  ExternalLink,
  Copy,
  Globe,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle
} from "@/lib/icons";
import { toast } from "sonner";
import { useUserStatus } from "@/hooks/useUserStatus";
import { formatDate } from "@/lib/utils";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface SubscriptionData {
  hasSubscription: boolean;
  tier: string;
  plan: {
    id: number;
    name: string;
    tier: string;
    price: number;
    currency: string;
    interval: string;
  } | null;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number | null;
  status: string;
  isExpired: boolean;
  expiredPlanName?: string;
}

export default function ProfilePage() {
  const { userStatus, isLoading } = useUserStatus();
  const [copying, setCopying] = useState(false);

  const { data: subscriptionData } = useSWR<SubscriptionData>(
    userStatus.authStatus === "logged_in" ? "/api/me/subscription" : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const isAuthenticated = userStatus.authStatus === "logged_in";
  const hasSubscription = subscriptionData?.hasSubscription ?? false;

  const handleCopyLink = async () => {
    if (!userStatus.profile?.publicUrl) return;
    
    setCopying(true);
    try {
      const fullUrl = `${window.location.origin}${userStatus.profile.publicUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Profile link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    } finally {
      setCopying(false);
    }
  };

  if (isLoading) {
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
                Sign in to view your profile
              </h2>
              <p className="text-slate-600 mb-6">
                Create an account or log in to manage your profile and share it with others.
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

  const getInitials = () => {
    if (userStatus.firstName && userStatus.lastName) {
      return `${userStatus.firstName[0]}${userStatus.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  const completenessScore = userStatus.profile?.completenessScore || 0;

  const getSubscriptionStatusColor = () => {
    if (subscriptionData?.isExpired) return "text-red-600 bg-red-50 border-red-200";
    if (subscriptionData?.status === "active") return "text-green-600 bg-green-50 border-green-200";
    if (subscriptionData?.status === "trial") return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
  };

  const getSubscriptionStatusText = () => {
    if (subscriptionData?.isExpired) return "Expired";
    if (subscriptionData?.status === "active") return "Active";
    if (subscriptionData?.status === "trial") return "Trial";
    return "Free";
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">
                My Profile
              </h1>
              <p className="text-slate-600 mt-1">
                Manage your profile and subscription.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/profile/edit">
                <Button variant="outline" className="gap-2" data-testid="button-edit-profile">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
              {userStatus.profile?.isPublished && userStatus.profile?.publicUrl && (
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleCopyLink}
                  disabled={copying}
                  data-testid="button-share-profile"
                >
                  {copying ? (
                    <Copy className="h-4 w-4" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  Share
                </Button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={userStatus.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-2xl">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-heading font-semibold text-slate-900">
                    {userStatus.firstName} {userStatus.lastName}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">{userStatus.email}</p>
                  
                  <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                    {hasSubscription && (
                      <Badge className="bg-gradient-primary gap-1">
                        <Crown className="h-3 w-3" />
                        {subscriptionData?.plan?.name || userStatus.subscriptionTier} Member
                      </Badge>
                    )}
                    {userStatus.profile?.isPublished && (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
                        <Globe className="h-3 w-3" />
                        Public
                      </Badge>
                    )}
                  </div>

                  {userStatus.profile?.isPublished && userStatus.profile?.publicUrl && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-2">Public Profile URL</p>
                      <Link 
                        href={userStatus.profile.publicUrl}
                        className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
                        target="_blank"
                      >
                        {window.location.origin}{userStatus.profile.publicUrl}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Profile Completeness</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-medium">{completenessScore}%</span>
                    </div>
                    <Progress value={completenessScore} className="h-2" />
                    {completenessScore < 100 && (
                      <p className="text-xs text-slate-500">
                        Complete your profile to increase visibility
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2 space-y-6">
              <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        Subscription
                      </CardTitle>
                      <CardDescription>
                        Your current plan and subscription details
                      </CardDescription>
                    </div>
                    <Badge className={`${getSubscriptionStatusColor()} border`}>
                      {getSubscriptionStatusText()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {subscriptionData?.hasSubscription ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm text-slate-500">Current Plan</p>
                          <p className="text-xl font-bold text-slate-900">
                            {subscriptionData.plan?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Price</p>
                          <p className="text-lg font-semibold" suppressHydrationWarning>
                            ₹{subscriptionData.plan?.price?.toLocaleString()}/{subscriptionData.plan?.interval}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs">Start Date</span>
                          </div>
                          <p className="font-medium" suppressHydrationWarning>
                            {subscriptionData.startDate ? formatDate(subscriptionData.startDate) : "N/A"}
                          </p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs">End Date</span>
                          </div>
                          <p className="font-medium" suppressHydrationWarning>
                            {subscriptionData.endDate ? formatDate(subscriptionData.endDate) : "N/A"}
                          </p>
                        </div>
                      </div>

                      {subscriptionData.daysRemaining !== null && subscriptionData.daysRemaining > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <Clock className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">
                              {subscriptionData.daysRemaining} days remaining
                            </p>
                            <p className="text-sm text-green-600">
                              Your subscription will renew automatically
                            </p>
                          </div>
                        </div>
                      )}

                      {subscriptionData.daysRemaining !== null && subscriptionData.daysRemaining <= 7 && subscriptionData.daysRemaining > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                          <div>
                            <p className="font-medium text-amber-800">
                              Subscription expiring soon
                            </p>
                            <p className="text-sm text-amber-600">
                              Renew now to continue enjoying premium features
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      {subscriptionData?.isExpired ? (
                        <>
                          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Your {subscriptionData.expiredPlanName} subscription has expired
                          </h3>
                          <p className="text-slate-600 mb-4">
                            You've been moved to the Free plan. Renew to restore your premium features.
                          </p>
                          <Link href="/pricing">
                            <Button className="bg-gradient-primary gap-2" data-testid="button-renew-subscription">
                              <Sparkles className="h-4 w-4" />
                              Renew Subscription
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <>
                          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                            <Crown className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            You're on the Free Plan
                          </h3>
                          <p className="text-slate-600 mb-4">
                            Upgrade to Pro or Creator to unlock premium features and grow faster.
                          </p>
                          <Link href="/pricing">
                            <Button className="bg-gradient-primary gap-2" data-testid="button-upgrade-subscription">
                              <Crown className="h-4 w-4" />
                              Upgrade to Pro
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Profile Details</CardTitle>
                  <CardDescription>
                    Your profile information visible to others when published
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Handle</p>
                      <p className="font-medium">
                        {userStatus.profile?.handle ? `@${userStatus.profile.handle}` : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Profile Status</p>
                      <div className="flex items-center gap-2">
                        {userStatus.profile?.isPublished ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-green-600">Published</span>
                          </>
                        ) : (
                          <span className="text-slate-500">Not published</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!userStatus.profile?.isPublished && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">
                        Your profile is currently private. Set a handle and publish your profile to share it with others.
                      </p>
                      <Link href="/profile/edit">
                        <Button size="sm" className="mt-3" data-testid="button-publish-profile">
                          Set Up Public Profile
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Premium Features</CardTitle>
                  <CardDescription>
                    Features available based on your subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {userStatus.serviceAccess.map((feature) => (
                      <div 
                        key={feature}
                        className="flex items-center gap-2 p-2 rounded-lg bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-slate-700 capitalize">
                          {feature.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!hasSubscription && (
                    <div className="mt-4 pt-4 border-t">
                      <Link href="/pricing">
                        <Button className="w-full gap-2 bg-gradient-primary" data-testid="button-upgrade-features">
                          <Crown className="h-4 w-4" />
                          Upgrade to Pro
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
