import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { getCurrentUserId, checkAdminAccess } from "@/lib/auth-utils";
import { generateMeta, generateCommunityStructuredData, generateBreadcrumbStructuredData } from "@/lib/metadata";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SmartImage } from "@/components/ui/smart-image";
import { getImageUrl, isValidImageSrc } from "@/lib/image-utils";
import {
  Users, MapPin, Globe, Calendar, ArrowRight,
  Building2, CalendarDays, Share2, CheckCircle2, Star,
  Video, Laptop, Clock, Languages, Lock, Unlock
} from "@/lib/icons";
import { formatDate } from "@/lib/utils";
import { CommunityJoinButton } from "@/components/communities/CommunityJoinButton";
import { CommunitySettingsButton } from "@/components/communities/CommunitySettingsButton";

export const revalidate = 300; // 5-minute ISR

export async function generateStaticParams() {
  const communities = await prisma.community.findMany({
    where: { isPublic: true },
    select: { id: true },
    take: 50,
    orderBy: { createdAt: "desc" },
  });
  return communities.map((community) => ({ id: community.id.toString() }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const getCommunity = cache(async (id: number) => {
  const community = await prisma.community.findUnique({
    where: { id },
    include: {
      members: {
        where: { role: { not: "pending" } },
        include: { user: true },
        take: 10,
      },
      chapters: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      },
      events: {
        include: {
          event: {
            include: { organizer: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      },
    },
  });
  return community;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = parseInt(id);
  if (isNaN(numericId)) return {};
  const community = await getCommunity(numericId);
  if (!community) return {};

  return generateMeta({
    title: community.name,
    description: community.description.slice(0, 160),
    image: community.coverImage || community.logo,
    path: `/communities/${community.id}`,
  });
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    notFound();
  }
  const community = await getCommunity(numericId);

  if (!community) {
    notFound();
  }

  if (!community.isPublic) {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      const userId = await getCurrentUserId();
      if (!userId) {
        notFound();
      }
      const membership = await prisma.communityMember.findFirst({
        where: { communityId: community.id, userId },
      });
      if (!membership) {
        notFound();
      }
    }
  }

  const memberCount = community.members.length;
  const chapterCount = community.chapters.length;
  const upcomingEvents = community.events.filter(
    (ce) => new Date(ce.event.startDate) > new Date()
  );

  const structuredData = generateCommunityStructuredData({
    id: community.id,
    name: community.name,
    description: community.description,
    memberCount: memberCount,
    category: community.category,
    image: community.logo || undefined,
    location: community.location || undefined,
  });

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "Communities", url: "/communities" },
    { name: community.name, url: `/communities/${community.id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([structuredData, breadcrumbData]) }}
      />
      <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <div 
          className="relative h-[320px] w-full"
          style={{
            background: community.primaryColor 
              ? `linear-gradient(135deg, ${community.primaryColor}dd, ${community.primaryColor}99, #3b82f6cc)`
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.87), rgba(37, 99, 235, 0.8), rgba(16, 185, 129, 0.8))'
          }}
        >
          {isValidImageSrc(community.coverImage) && (
            <Image
              src={getImageUrl(community.coverImage)}
              alt={`Cover image for ${community.name} - ${community.category} community`}
              fill
              className="object-cover mix-blend-overlay"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-8">
            <div className="container mx-auto flex items-end gap-6">
              <div 
                className="relative h-24 w-24 rounded-2xl overflow-hidden border-4 shadow-lg"
                style={{ borderColor: community.primaryColor || '#fff' }}
              >
                <SmartImage
                  src={community.logo}
                  alt={`${community.name} community logo`}
                  fill
                  className="object-cover"
                  fallbackType="logo"
                />
              </div>
              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm">
                    {community.category}
                  </Badge>
                  {community.mode && community.mode !== 'in_person' && (
                    <Badge variant="outline" className="bg-white/10 text-white border-white/30 backdrop-blur-sm">
                      {community.mode === 'online' && <Video className="h-3 w-3 mr-1" />}
                      {community.mode === 'hybrid' && <Laptop className="h-3 w-3 mr-1" />}
                      {community.mode === 'online' ? 'Online' : community.mode === 'hybrid' ? 'Hybrid' : 'In Person'}
                    </Badge>
                  )}
                  {community.featured && (
                    <Badge className="bg-yellow-500/90 text-white backdrop-blur-sm">
                      <Star className="h-3 w-3 mr-1 fill-white" /> Featured
                    </Badge>
                  )}
                  {community.verified && (
                    <Badge className="bg-emerald-500/90 text-white backdrop-blur-sm">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-white flex items-center gap-2" data-testid="text-community-name">
                  {community.name}
                </h1>
                {community.shortDescription && (
                  <p className="text-white/80 mt-2 text-sm md:text-base max-w-2xl line-clamp-2" data-testid="text-community-tagline">
                    {community.shortDescription}
                  </p>
                )}
              </div>
              <div className="hidden md:flex gap-3 pb-2">
                <CommunityJoinButton
                  communityId={community.id}
                  communityName={community.name}
                  isPublic={community.isPublic}
                />
                <CommunitySettingsButton
                  communityId={community.id}
                  creatorId={community.creatorId}
                />
                <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 rounded-full backdrop-blur-sm" data-testid="button-share-community">
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3 space-y-8">
              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">About</h2>
                <p className="text-slate-600 leading-relaxed" data-testid="text-community-description">
                  {community.description}
                </p>
                {community.tags && community.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {community.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-heading font-bold">Chapters</h2>
                  {community.chapters.length > 0 && (
                    <Link href={`/communities/${id}/chapters`} className="text-primary hover:underline flex items-center gap-1 text-sm font-medium">
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
                {community.chapters.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {community.chapters.slice(0, 4).map((chapter) => (
                      <Link key={chapter.id} href={`/communities/${id}/chapters/${chapter.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold" data-testid={`text-chapter-name-${chapter.id}`}>{chapter.name}</h3>
                                {chapter.location && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {chapter.location}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No chapters yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">Chapters help members connect locally.</p>
                    </CardContent>
                  </Card>
                )}
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-heading font-bold">Upcoming Events</h2>
                  {upcomingEvents.length > 0 && (
                    <Link href={`/communities/${id}/events`} className="text-primary hover:underline flex items-center gap-1 text-sm font-medium">
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
                {upcomingEvents.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {upcomingEvents.slice(0, 4).map((ce) => (
                      <Link key={ce.id} href={`/events/${ce.event.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
                          <div className="relative h-32 w-full bg-gradient-to-br from-primary/10 to-blue-500/10">
                            {isValidImageSrc(ce.event.coverImage) ? (
                              <Image
                                src={getImageUrl(ce.event.coverImage)}
                                alt={`Cover image for ${ce.event.title} event`}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Calendar className="h-8 w-8 text-primary/30" />
                              </div>
                            )}
                            {ce.isFeatured && (
                              <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold line-clamp-1" data-testid={`text-event-title-${ce.event.id}`}>
                              {ce.event.title}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1" suppressHydrationWarning>
                              <Calendar className="h-3 w-3" /> {formatDate(ce.event.startDate)}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No upcoming events.</p>
                      <p className="text-xs text-muted-foreground mt-1">Events will appear here when scheduled.</p>
                    </CardContent>
                  </Card>
                )}
              </section>
            </div>

            <div className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4">Community Info</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Users className="h-4 w-4" /> Members
                        </span>
                        <span className="font-bold" data-testid="text-member-count" suppressHydrationWarning>
                          {memberCount.toLocaleString("en-IN")}
                          {community.maxMembers && (
                            <span className="text-xs text-muted-foreground font-normal">/{community.maxMembers}</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Building2 className="h-4 w-4" /> Chapters
                        </span>
                        <span className="font-bold" data-testid="text-chapter-count">{chapterCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" /> Events
                        </span>
                        <span className="font-bold">{community.events.length}</span>
                      </div>
                      {(community.city || community.country || community.location) && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Location
                          </span>
                          <span className="font-medium text-sm text-right max-w-[150px] truncate" title={community.location || `${community.city || ''}, ${community.country || ''}`}>
                            {community.location || `${community.city || ''}, ${community.country || ''}`.replace(/^, |, $/g, '')}
                          </span>
                        </div>
                      )}
                      {community.timezone && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Timezone
                          </span>
                          <span className="font-medium text-sm">{community.timezone}</span>
                        </div>
                      )}
                      {community.language && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Languages className="h-4 w-4" /> Language
                          </span>
                          <span className="font-medium text-sm">{community.language}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">Mode</span>
                        <Badge variant="outline" className="text-xs">
                          {community.mode === 'online' && <Video className="h-3 w-3 mr-1" />}
                          {community.mode === 'hybrid' && <Laptop className="h-3 w-3 mr-1" />}
                          {community.mode === 'in_person' && <MapPin className="h-3 w-3 mr-1" />}
                          {community.mode === 'online' ? 'Online' : community.mode === 'hybrid' ? 'Hybrid' : 'In Person'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">Membership</span>
                        <Badge variant="outline" className="text-xs">
                          {community.membershipType === 'open' && <Unlock className="h-3 w-3 mr-1" />}
                          {community.membershipType === 'approval' && <Lock className="h-3 w-3 mr-1" />}
                          {community.membershipType === 'invite' && <Lock className="h-3 w-3 mr-1" />}
                          {community.membershipType === 'open' ? 'Open' : community.membershipType === 'approval' ? 'By Approval' : 'Invite Only'}
                        </Badge>
                      </div>
                      {community.meetupFrequency && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">Meetups</span>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {community.meetupFrequency.replace('_', ' ')}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {community.website && (
                      <a
                        href={community.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 mt-4 pt-4 border-t text-primary hover:underline text-sm"
                      >
                        <Globe className="h-4 w-4" /> Visit Website
                      </a>
                    )}
                  </CardContent>
                </Card>

                {community.members.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-4">Members</h3>
                      <div className="space-y-3">
                        {community.members.slice(0, 5).map((member) => (
                          <div key={member.id} className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={member.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.email}`}
                                alt={`Profile photo of ${member.user.firstName} ${member.user.lastName}, community member`}
                              />
                              <AvatarFallback>
                                {member.user.firstName[0]}{member.user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {member.user.firstName} {member.user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {community.members.length > 5 && (
                        <p className="text-sm text-muted-foreground mt-4 text-center">
                          +{community.members.length - 5} more members
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="md:hidden flex flex-col gap-3">
                  <CommunityJoinButton
                    communityId={community.id}
                    communityName={community.name}
                    isPublic={community.isPublic}
                    className="w-full bg-primary hover:bg-primary/90 rounded-full"
                    isMobile={true}
                  />
                  <Button variant="outline" className="w-full rounded-full" data-testid="button-share-community-mobile">
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      </div>
    </>
  );
}
