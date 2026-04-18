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
import { Building2, MapPin, ArrowLeft, Users, Calendar, Share2 } from "@/lib/icons";
import { getImageUrl, isValidImageSrc } from "@/lib/image-utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; chapterId: string }>;
}

async function getChapter(communityId: number, chapterId: number) {
  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      communityId: communityId,
    },
    include: {
      community: {
        include: {
          members: true,
        },
      },
    },
  });
  return chapter;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, chapterId } = await params;
  const chapterIdNum = parseInt(chapterId);
  if (isNaN(chapterIdNum)) return {};
  const resolution = await resolveCommunitySegment(id);
  if (resolution.kind !== "found") return {};
  const chapter = await getChapter(resolution.communityId, chapterIdNum);
  if (!chapter) return {};

  return generateMeta({
    title: `${chapter.name} - ${chapter.community.name}`,
    description: chapter.description || `Join the ${chapter.name} of ${chapter.community.name}`,
    path: `/communities/${id}/chapters/${chapterId}`,
  });
}

export default async function ChapterDetailPage({ params }: PageProps) {
  const { id, chapterId } = await params;
  const chapterIdNum = parseInt(chapterId);
  if (isNaN(chapterIdNum)) {
    notFound();
  }
  const communityId = await resolveCommunityIdForPage(id, `/chapters/${chapterId}`);
  const chapter = await getChapter(communityId, chapterIdNum);

  if (!chapter) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-green-500/10 py-12">
          <div className="container mx-auto px-4">
            <Link 
              href={`${buildCommunityUrl(chapter.community)}/chapters`}
              className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> All Chapters
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center shadow-lg">
                {isValidImageSrc(chapter.logo) ? (
                  <Image
                    src={getImageUrl(chapter.logo)}
                    alt={chapter.name}
                    width={64}
                    height={64}
                    className="rounded-xl"
                  />
                ) : (
                  <Building2 className="h-10 w-10 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={chapter.isActive ? "default" : "secondary"}>
                    {chapter.isActive ? "Active Chapter" : "Inactive"}
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2" data-testid="text-chapter-name">
                  {chapter.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <Link 
                    href={buildCommunityUrl(chapter.community)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Users className="h-4 w-4" /> {chapter.community.name}
                  </Link>
                  {chapter.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {chapter.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="rounded-full bg-primary hover:bg-primary/90" data-testid="button-join-chapter">
                  <Users className="mr-2 h-4 w-4" /> Join Chapter
                </Button>
                <Button variant="outline" className="rounded-full" data-testid="button-share-chapter">
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3 space-y-8">
              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">About this Chapter</h2>
                <Card>
                  <CardContent className="p-6">
                    {chapter.description ? (
                      <p className="text-slate-600 leading-relaxed" data-testid="text-chapter-description">
                        {chapter.description}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        No description available for this chapter yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">Upcoming Events</h2>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No upcoming events scheduled for this chapter.
                    </p>
                    <Button variant="outline" className="rounded-full" data-testid="button-create-event">
                      <Calendar className="mr-2 h-4 w-4" /> Create an Event
                    </Button>
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">Chapter Activities</h2>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Connect with Local Members</p>
                          <p className="text-sm text-muted-foreground">
                            Network with professionals in your area
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Attend Local Events</p>
                          <p className="text-sm text-muted-foreground">
                            Participate in workshops, meetups, and networking events
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Contribute to the Community</p>
                          <p className="text-sm text-muted-foreground">
                            Help organize events and grow the local chapter
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            <div className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4">Chapter Info</h3>
                    <div className="space-y-4">
                      {chapter.location && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">Location</p>
                            <p className="text-sm text-muted-foreground">{chapter.location}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Parent Community</p>
                          <Link 
                            href={buildCommunityUrl(chapter.community)}
                            className="text-sm text-primary hover:underline"
                          >
                            {chapter.community.name}
                          </Link>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Status</p>
                          <Badge variant={chapter.isActive ? "default" : "secondary"} className="mt-1">
                            {chapter.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary/5 to-blue-500/5 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-bold text-lg mb-2">Want to Lead?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Interested in becoming a chapter leader? Help grow this community in your area.
                    </p>
                    <Button variant="outline" className="w-full rounded-full" data-testid="button-apply-leader">
                      Apply to Lead
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
