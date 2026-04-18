import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { generateMeta } from "@/lib/metadata";
import { resolveCommunityIdForPage } from "@/lib/community-page-resolver";
import { resolveCommunitySegment } from "@/lib/community-resolver";
import { buildCommunityUrl } from "@/lib/community-slug";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, ArrowLeft, Users } from "@/lib/icons";
import { SmartImage } from "@/components/ui/smart-image";
import { getImageUrl, isValidImageSrc } from "@/lib/image-utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCommunityWithChapters(id: number) {
  const community = await prisma.community.findUnique({
    where: { id },
    include: {
      chapters: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      members: true,
    },
  });
  return community;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const resolution = await resolveCommunitySegment(id);
  if (resolution.kind !== "found") return {};
  const community = await getCommunityWithChapters(resolution.communityId);
  if (!community) return {};

  return generateMeta({
    title: `${community.name} - Chapters`,
    description: `Explore local chapters of ${community.name}. Join a chapter near you.`,
    path: `${buildCommunityUrl(community)}/chapters`,
  });
}

export default async function CommunityChaptersPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = await resolveCommunityIdForPage(id, "/chapters");
  const community = await getCommunityWithChapters(numericId);

  if (!community) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-green-500/10 py-12">
          <div className="container mx-auto px-4">
            <Link 
              href={`/communities/${id}`}
              className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Back to {community.name}
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative h-16 w-16 rounded-xl overflow-hidden shadow-md">
                <SmartImage
                  src={community.logo}
                  alt={community.name}
                  fill
                  className="object-cover"
                  fallbackType="logo"
                />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold" data-testid="text-page-title">
                  Chapters
                </h1>
                <p className="text-muted-foreground">{community.name}</p>
              </div>
            </div>
            <p className="text-slate-600 max-w-2xl">
              Connect with local members in your area. Each chapter organizes its own events, meetups, and activities.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {community.chapters.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {community.chapters.map((chapter) => (
                <Link key={chapter.id} href={`/communities/${id}/chapters/${chapter.id}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-primary/30 group-hover:to-blue-500/30 transition-colors">
                          {isValidImageSrc(chapter.logo) ? (
                            <Image
                              src={getImageUrl(chapter.logo)}
                              alt={chapter.name}
                              width={40}
                              height={40}
                              className="rounded-lg"
                            />
                          ) : (
                            <Building2 className="h-7 w-7 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-bold text-lg group-hover:text-primary transition-colors" data-testid={`text-chapter-name-${chapter.id}`}>
                            {chapter.name}
                          </h3>
                          {chapter.location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" /> {chapter.location}
                            </p>
                          )}
                        </div>
                      </div>

                      {chapter.description && (
                        <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                          {chapter.description}
                        </p>
                      )}

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <Badge variant={chapter.isActive ? "default" : "secondary"}>
                          {chapter.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-sm text-primary font-medium group-hover:underline">
                          View Chapter →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Chapters Yet</h2>
              <p className="text-muted-foreground mb-6">
                This community doesn't have any local chapters yet.
              </p>
              <Button className="rounded-full" data-testid="button-start-chapter">
                <Users className="mr-2 h-4 w-4" /> Start a Chapter
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
