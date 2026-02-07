import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Crown, 
  ExternalLink,
  Twitter,
  Linkedin,
  Github,
  Globe
} from "@/lib/icons";
import prisma from "@/lib/prisma";
import { getImageUrl, isValidImageSrc } from "@/lib/image-utils";

interface PageProps {
  params: Promise<{ handle: string }>;
}

async function getPublicProfile(handle: string) {
  const user = await prisma.user.findFirst({
    where: {
      handle: handle.toLowerCase(),
      isPublished: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      handle: true,
      avatar: true,
      bio: true,
      skills: true,
      socialLinks: true,
      subscriptionTier: true,
      communityMemberships: {
        include: {
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
        take: 6,
      },
      eventsOrganized: {
        where: {
          status: "published",
        },
        select: {
          id: true,
          title: true,
          coverImage: true,
          startDate: true,
        },
        take: 3,
        orderBy: { startDate: "desc" },
      },
    },
  });

  return user;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);

  if (!profile) {
    notFound();
  }

  const getInitials = () => {
    return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  };

  const socialLinks = profile.socialLinks as Record<string, string> | null;
  const hasSubscription = profile.subscriptionTier !== "free";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-none shadow-lg overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary via-blue-500 to-green-500" />
            <CardContent className="relative pt-0 pb-8 px-8">
              <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage src={profile.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-3xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 pb-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    {hasSubscription && (
                      <Badge className="bg-gradient-primary gap-1">
                        <Crown className="h-3 w-3" />
                        {profile.subscriptionTier} Member
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-500 mt-1">@{profile.handle}</p>
                </div>
              </div>

              {profile.bio && (
                <div className="mt-6">
                  <p className="text-slate-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-slate-500 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-slate-100">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {socialLinks && Object.keys(socialLinks).length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-slate-500 mb-3">Connect</h3>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.twitter && (
                      <Link href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Twitter className="h-4 w-4" />
                          Twitter
                        </Button>
                      </Link>
                    )}
                    {socialLinks.linkedin && (
                      <Link href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </Button>
                      </Link>
                    )}
                    {socialLinks.github && (
                      <Link href={socialLinks.github} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Github className="h-4 w-4" />
                          GitHub
                        </Button>
                      </Link>
                    )}
                    {socialLinks.website && (
                      <Link href={socialLinks.website} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Globe className="h-4 w-4" />
                          Website
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {profile.communityMemberships.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-heading font-semibold text-slate-900 mb-4">
                Communities
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {profile.communityMemberships.map((membership) => (
                  <Link 
                    key={membership.id} 
                    href={`/communities/${membership.community.slug}`}
                    className="block"
                  >
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {isValidImageSrc(membership.community.logo) && (
                            <img 
                              src={getImageUrl(membership.community.logo)} 
                              alt={membership.community.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-slate-900 truncate">
                            {membership.community.name}
                          </h3>
                          <p className="text-xs text-slate-500 capitalize">
                            {membership.role}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {profile.eventsOrganized.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-heading font-semibold text-slate-900 mb-4">
                Events Organized
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {profile.eventsOrganized.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="block">
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <div className="h-32 bg-slate-100">
                        {isValidImageSrc(event.coverImage) && (
                          <img 
                            src={getImageUrl(event.coverImage)} 
                            alt={event.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-slate-900 line-clamp-2">
                          {event.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1" suppressHydrationWarning>
                          {new Date(event.startDate).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500">
              Create your own profile on{" "}
              <Link href="/" className="text-primary hover:underline">
                Next Leap Pro
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
