import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { generateMeta } from "@/lib/metadata";
import { getNavbarPlansData } from "@/lib/get-navbar-data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { EventCard } from "@/components/shared/EventCard";
import { EventsFilter } from "@/components/filters/EventsFilter";
import { CreateEventButton } from "@/components/events/CreateEventButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateMeta({
  title: "Events",
  description: "Discover workshops, webinars, bootcamps, and conferences to upskill your career.",
  path: "/events",
});

async function getEvents(category?: string, search?: string) {
  const events = await prisma.event.findMany({
    where: {
      status: "published",
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: { organizer: true },
    orderBy: { startDate: "asc" },
  });

  return events;
}

async function getCategories() {
  const events = await prisma.event.findMany({
    where: { status: "published" },
    select: { category: true },
    distinct: ["category"],
  });
  return events.map((e) => e.category);
}

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const [events, categories, navbarPlans] = await Promise.all([
    getEvents(resolvedSearchParams.category, resolvedSearchParams.search),
    getCategories(),
    getNavbarPlansData(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialPlansData={navbarPlans} />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-heading font-bold mb-4">Explore Events</h1>
              <p className="text-slate-600 text-lg">
                Discover workshops, webinars, bootcamps, and conferences to upskill your career.
              </p>
            </div>
            <CreateEventButton />
          </div>

          <EventsFilter categories={categories} />

          {events.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  date={event.startDate}
                  location={event.venue || "Online"}
                  image={event.coverImage}
                  category={event.category}
                  price={event.price.toString()}
                  mode={event.mode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <p className="text-lg">No events found matching your criteria.</p>
              <p className="mt-2">Try adjusting your filters or check back later.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
