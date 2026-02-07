"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useUserStatus } from "@/hooks/useUserStatus";
import { formatINR, formatDate } from "@/lib/utils";
import { getImageUrl, isValidImageSrc } from "@/lib/image-utils";
import {
  Star,
  Lock,
  Crown,
  MapPin,
  Clock,
  Mail,
  Globe,
  Twitter,
  Linkedin,
  Github,
  AlertTriangle,
  MessageSquare,
  ChevronLeft,
  Sparkles,
} from "@/lib/icons";

interface ServiceProvider {
  id: number;
  firstName: string;
  lastName: string;
  avatar: string | null;
  bio: string | null;
  email: string | null;
  handle: string | null;
  skills: string[];
  socialLinks: Record<string, string> | null;
  isPublished: boolean;
}

interface ServiceReview {
  id: number;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string;
  reviewer: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

interface ServiceData {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  tags: string[];
  skills: string[];
  price: string;
  currency: string;
  deliveryType: string;
  availability: string | null;
  rating: string;
  reviewCount: number;
  createdAt: string;
  provider: ServiceProvider;
  reviews: ServiceReview[];
  isPremiumUser: boolean;
}

interface ServiceDetailContentProps {
  service: ServiceData;
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export function ServiceDetailContent({ service }: ServiceDetailContentProps) {
  const { userStatus } = useUserStatus();
  const [showReviewForm, setShowReviewForm] = useState(false);

  const isAuthenticated = userStatus.authStatus === "logged_in";
  const canViewProviderDetails = service.isPremiumUser;
  
  const numRating = parseFloat(service.rating);
  const numPrice = parseFloat(service.price);
  const providerName = `${service.provider.firstName} ${service.provider.lastName}`;
  const initials = `${service.provider.firstName[0]}${service.provider.lastName[0]}`;

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <Link
        href="/services"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        data-testid="back-to-services"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Services
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
            {isValidImageSrc(service.coverImage) ? (
              <Image
                src={getImageUrl(service.coverImage)}
                alt={service.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-green-500" />
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <Badge className="bg-white/90 text-black hover:bg-white backdrop-blur-sm">
                {service.category}
              </Badge>
              <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white">
                {service.deliveryType === "online" ? "Online" : "In-Person"}
              </Badge>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-heading font-bold mb-3" data-testid="service-title">
              {service.title}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <StarRating rating={numRating} />
                <span className="ml-1 font-medium">{numRating.toFixed(1)}</span>
                <span className="text-sm">({service.reviewCount} reviews)</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm">{formatDate(service.createdAt)}</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About This Service</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap" data-testid="service-description">
                {service.description}
              </p>

              {service.skills.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Skills Covered</h4>
                  <div className="flex flex-wrap gap-2">
                    {service.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {service.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {service.availability && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Availability: {service.availability}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Reviews ({service.reviewCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {service.reviews.length > 0 ? (
                <div className="space-y-4">
                  {service.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={review.reviewer.avatar || undefined}
                            alt={`${review.reviewer.firstName} ${review.reviewer.lastName}`}
                          />
                          <AvatarFallback>
                            {review.reviewer.firstName[0]}
                            {review.reviewer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {review.reviewer.firstName} {review.reviewer.lastName}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                          {review.title && (
                            <p className="font-medium mt-2">{review.title}</p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">
                  No reviews yet. Be the first to review this service!
                </p>
              )}

              {isAuthenticated && !showReviewForm && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setShowReviewForm(true)}
                  data-testid="write-review-button"
                >
                  Write a Review
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Platform Disclaimer</p>
                  <p>
                    Next Leap Pro is a marketplace connecting service providers with clients. 
                    We are not responsible for any transactions, agreements, or disputes between 
                    individual users. Please exercise due diligence before engaging any service 
                    provider. Review ratings and feedback from other users to make informed decisions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-4" data-testid="service-price">
                {formatINR(numPrice)}
              </div>

              <div className="relative">
                <div className={`${!canViewProviderDetails ? "blur-sm select-none" : ""}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage
                        src={service.provider.avatar || undefined}
                        alt={providerName}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{providerName}</p>
                      {service.provider.handle && (
                        <Link
                          href={canViewProviderDetails ? `/u/${service.provider.handle}` : "#"}
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          @{service.provider.handle}
                        </Link>
                      )}
                    </div>
                  </div>

                  {service.provider.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {service.provider.bio}
                    </p>
                  )}

                  {service.provider.skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Provider Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {service.provider.skills.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {service.provider.skills.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{service.provider.skills.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    {canViewProviderDetails && service.provider.email ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{service.provider.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="italic">Premium access required</span>
                      </div>
                    )}
                    
                    {canViewProviderDetails && service.provider.socialLinks ? (
                      <div className="flex items-center gap-3 mt-3">
                        {service.provider.socialLinks.twitter && (
                          <a
                            href={service.provider.socialLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                        {service.provider.socialLinks.linkedin && (
                          <a
                            href={service.provider.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                        {service.provider.socialLinks.github && (
                          <a
                            href={service.provider.socialLinks.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Github className="h-5 w-5" />
                          </a>
                        )}
                        {service.provider.socialLinks.website && (
                          <a
                            href={service.provider.socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Globe className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    ) : !canViewProviderDetails && (
                      <div className="flex items-center gap-3 mt-3 opacity-50">
                        <Twitter className="h-5 w-5" />
                        <Linkedin className="h-5 w-5" />
                        <Github className="h-5 w-5" />
                        <Globe className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>

                {!canViewProviderDetails && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white flex flex-col items-center justify-center text-center p-6 rounded-lg">
                    <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 p-3 rounded-full mb-3">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-lg mb-1">
                      Unlock Provider Details
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upgrade to Premium to view contact info and connect directly
                    </p>
                    <Link href="/pricing">
                      <Button className="gap-2" data-testid="upgrade-premium-button">
                        <Crown className="h-4 w-4" />
                        Upgrade to Premium
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {canViewProviderDetails && (
                <Button className="w-full mt-4 gap-2" size="lg" data-testid="contact-provider-button">
                  <Mail className="h-4 w-4" />
                  Contact Provider
                </Button>
              )}
            </CardContent>
          </Card>

          {!isAuthenticated && (
            <Card className="bg-gradient-to-br from-primary/5 to-blue-600/5 border-primary/20">
              <CardContent className="pt-6 text-center">
                <Sparkles className="h-8 w-8 mx-auto text-primary mb-3" />
                <h3 className="font-heading font-bold mb-2">Interested in this service?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign up to contact providers and offer your own services
                </p>
                <Link href="/auth/register">
                  <Button className="w-full" data-testid="signup-cta-button">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
