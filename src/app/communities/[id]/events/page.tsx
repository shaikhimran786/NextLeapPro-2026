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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, ArrowLeft, Clock, Users } from "@/lib/icons";
import { SmartImage } from "@/components/ui/smart-image";
import { formatDate, formatINR } from "@/lib/utils";
import { getImageUrl, isValidImageSrc } from "@/lib/image-utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCommunityWithEvents(id: number) {
  const community = await prisma.community.findUnique({
    where: { id },
    include: {
      events: {
        include: {
          event: {
            include: {
              organizer: true,
              registrations: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return community;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const resolution = await resolveCommunitySegment(id);
  if (resolution.kind !== "found") return {};
  const community = await getCommunityWithEvents(resolution.communityId);
  if (!community) return {};

  return generateMeta({
    title: `${community.name} - Events`,
    description: `Explore events hosted by ${community.name}. Learn, connect, and grow with the community.`,
    path: `${buildCommunityUrl(community)}/events`,
  });
}

export default async function CommunityEventsPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = await resolveCommunityIdForPage(id, "/events");
  const community = await getCommunityWithEvents(numericId);

  if (!community) {
    notFound();
  }

  const now = new Date();
  const upcomingEvents = community.events.filter(
    (ce) => new Date(ce.event.startDate) > now
  );
  const pastEvents = community.events.filter(
    (ce) => new Date(ce.event.startDate) <= now
  );

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
                  Events
                </h1>
                <p className="text-muted-foreground">{community.name}</p>
              </div>
            </div>
            <p className="text-slate-600 max-w-2xl">
              Discover workshops, meetups, and conferences organized by or associated with this community.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="bg-white border shadow-sm">
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Upcoming ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Past ({pastEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {upcomingEvents.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((ce) => (
                    <EventCard key={ce.id} communityEvent={ce} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Upcoming Events</h2>
                  <p className="text-muted-foreground mb-6">
                    There are no upcoming events scheduled for this community.
                  </p>
                  <Button className="rounded-full" data-testid="button-create-event">
                    <Calendar className="mr-2 h-4 w-4" /> Create an Event
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastEvents.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.map((ce) => (
                    <EventCard key={ce.id} communityEvent={ce} isPast />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Past Events</h2>
                  <p className="text-muted-foreground">
                    This community hasn't hosted any events yet.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

interface EventCardProps {
  communityEvent: {
    id: number;
    isFeatured: boolean;
    event: {
      id: number;
      title: string;
      description: string;
      coverImage: string;
      category: string;
      mode: string;
      startDate: Date;
      endDate: Date;
      price: any;
      currency: string;
      venue: string | null;
      registrations: any[];
      organizer: {
        firstName: string;
        lastName: string;
      };
    };
  };
  isPast?: boolean;
}

function EventCard({ communityEvent, isPast }: EventCardProps) {
  const { event, isFeatured } = communityEvent;
  const isFree = Number(event.price) === 0;
  const registeredCount = event.registrations.length;

  return (
    <Link href={`/events/${event.id}`}>
      <Card className={`h-full hover:shadow-lg transition-all duration-300 group overflow-hidden ${isPast ? 'opacity-75' : ''}`}>
        <div className="relative h-40 w-full">
          {isValidImageSrc(event.coverImage) ? (
            <Image
              src={getImageUrl(event.coverImage)}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-green-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-2 left-2 flex gap-2">
            {isFeatured && (
              <Badge className="bg-yellow-500 text-white">
                Featured
              </Badge>
            )}
            <Badge className="bg-white/90 text-slate-700">
              {event.category}
            </Badge>
          </div>
          {isPast && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-slate-800/80 text-white">
                Past Event
              </Badge>
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center gap-2 text-white text-sm">
              <Calendar className="h-4 w-4" />
              <span suppressHydrationWarning>{formatDate(event.startDate)}</span>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-heading font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2" data-testid={`text-event-title-${event.id}`}>
            {event.title}
          </h3>
          
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.mode === "online" ? "Online" : event.venue || "TBD"}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {registeredCount} registered
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <span className={`font-bold ${isFree ? 'text-green-600' : 'text-slate-900'}`} suppressHydrationWarning>
              {isFree ? "Free" : formatINR(Number(event.price))}
            </span>
            <span className="text-sm text-muted-foreground">
              by {event.organizer.firstName} {event.organizer.lastName}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
