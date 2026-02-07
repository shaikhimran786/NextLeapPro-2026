import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/shared/EventCard";
import { ArrowRight } from "@/lib/icons";

interface Event {
  id: number;
  title: string;
  startDate: Date;
  venue: string | null;
  coverImage: string;
  category: string;
  price: string;
  mode: string;
}

interface EventsSectionProps {
  events: Event[];
}

export function EventsSection({ events }: EventsSectionProps) {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Upcoming Events
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mt-2">
              Learn from the best
            </h2>
          </div>
          <Link href="/events">
            <Button variant="ghost" className="gap-2">
              View All <ArrowRight size={16} />
            </Button>
          </Link>
        </div>

        {events.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                date={event.startDate}
                location={event.venue || "Online"}
                image={event.coverImage}
                category={event.category}
                price={event.price}
                mode={event.mode}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>No upcoming events. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
