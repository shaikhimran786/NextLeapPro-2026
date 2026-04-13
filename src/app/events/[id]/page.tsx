import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { generateMeta, generateEventStructuredData, generateBreadcrumbStructuredData } from "@/lib/metadata";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MapPin, Clock, Share2, Users } from "@/lib/icons";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import { EventRegistrationButton } from "@/components/events/EventRegistrationButton";
import { getImageUrl, isValidImageSrc } from "@/lib/image-utils";
import { getEventStatus } from "@/lib/event-utils";

export const revalidate = 300; // 5-minute ISR

export async function generateStaticParams() {
  const events = await prisma.event.findMany({
    where: { status: "published" },
    select: { id: true },
    take: 50,
    orderBy: { createdAt: "desc" },
  });
  return events.map((event) => ({ id: event.id.toString() }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const getEvent = cache(async (id: number) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: true,
      registrations: true,
    },
  });
  return event;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = parseInt(id);
  if (isNaN(numericId)) return {};
  const event = await getEvent(numericId);
  if (!event) return {};

  return generateMeta({
    title: event.title,
    description: event.description.slice(0, 160),
    image: event.coverImage,
    path: `/events/${event.id}`,
  });
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    notFound();
  }
  const event = await getEvent(numericId);

  if (!event) {
    notFound();
  }

  const isFree = Number(event.price) === 0;
  const registeredCount = event.registrations.filter(r => r.status !== "cancelled").length;
  const spotsLeft = event.capacity ? event.capacity - registeredCount : null;
  const eventStatus = getEventStatus(event);

  const structuredData = generateEventStructuredData({
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.venue || undefined,
    mode: event.mode,
    price: Number(event.price),
    currency: event.currency,
    image: event.coverImage,
    organizerName: `${event.organizer.firstName} ${event.organizer.lastName}`,
  });

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "Events", url: "/events" },
    { name: event.title, url: `/events/${event.id}` },
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
          <div className="relative h-[400px] w-full">
            {isValidImageSrc(event.coverImage) ? (
              <Image
                src={getImageUrl(event.coverImage)}
                alt={`Cover image for ${event.title} - ${event.category} event hosted by ${event.organizer.firstName} ${event.organizer.lastName}`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-green-500" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
              <div className="container mx-auto">
                <Badge className="mb-4 bg-primary text-white hover:bg-primary">
                  {event.category}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4" data-testid="text-event-title">
                  {event.title}
                </h1>
                <div className="flex flex-wrap gap-6 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span suppressHydrationWarning>{formatDate(event.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span suppressHydrationWarning>{formatDateTime(event.startDate)} - {formatDateTime(event.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{event.mode === "online" ? "Online" : event.venue}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-2/3 space-y-12">
                <section>
                  <h2 className="text-2xl font-heading font-bold mb-4">About this Event</h2>
                  <div className="prose max-w-none text-slate-600">
                    <p data-testid="text-event-description">{event.description}</p>
                  </div>
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      {event.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold mb-6">Event Details</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="p-4 bg-white rounded-xl border shadow-sm">
                      <h4 className="font-semibold text-slate-500 text-sm mb-1">Event Type</h4>
                      <p className="font-bold text-lg">{event.eventType}</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border shadow-sm">
                      <h4 className="font-semibold text-slate-500 text-sm mb-1">Level</h4>
                      <p className="font-bold text-lg capitalize">{event.level}</p>
                    </div>
                    {event.capacity && (
                      <div className="p-4 bg-white rounded-xl border shadow-sm">
                        <h4 className="font-semibold text-slate-500 text-sm mb-1">Capacity</h4>
                        <p className="font-bold text-lg">
                          {registeredCount}/{event.capacity} registered
                        </p>
                      </div>
                    )}
                    <div className="p-4 bg-white rounded-xl border shadow-sm">
                      <h4 className="font-semibold text-slate-500 text-sm mb-1">Mode</h4>
                      <p className="font-bold text-lg capitalize">{event.mode}</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="lg:w-1/3 relative">
                <div className="sticky top-24 bg-white p-6 rounded-2xl border shadow-lg">
                  <div className="mb-6">
                    {isFree ? (
                      <span className="text-3xl font-bold text-green-600" data-testid="text-event-price">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-slate-900" data-testid="text-event-price">
                          {formatINR(Number(event.price))}
                        </span>
                        <span className="text-slate-500 ml-2">per ticket</span>
                      </>
                    )}
                  </div>

                  {spotsLeft !== null && (
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span className={spotsLeft < 10 ? "text-orange-500 font-medium" : "text-muted-foreground"}>
                        {spotsLeft > 0 ? `${spotsLeft} spots left` : "Fully booked"}
                      </span>
                    </div>
                  )}

                  <EventRegistrationButton
                    eventId={event.id}
                    eventTitle={event.title}
                    price={Number(event.price)}
                    spotsLeft={spotsLeft}
                    isFree={isFree}
                  />

                  <Button variant="outline" className="w-full rounded-full" data-testid="button-share">
                    <Share2 className="mr-2 h-4 w-4" /> Share Event
                  </Button>

                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-500">Hosted By</h4>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={event.organizer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.organizer.email}`}
                          alt={`Profile photo of ${event.organizer.firstName} ${event.organizer.lastName}, event organizer`}
                        />
                        <AvatarFallback>
                          {event.organizer.firstName[0]}{event.organizer.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm" data-testid="text-organizer-name">
                          {event.organizer.firstName} {event.organizer.lastName}
                        </p>
                        <p className="text-xs text-slate-500">Organizer</p>
                      </div>
                    </div>
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
