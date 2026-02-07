import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar } from "@/lib/icons";
import { formatINR, formatDate } from "@/lib/utils";

interface EventCardProps {
  id: number;
  title: string;
  date: Date | string;
  location: string;
  image: string;
  category: string;
  price: number | string;
  mode: string;
}

const DEFAULT_EVENT_IMAGE = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80";

function getValidImageUrl(url: string): string {
  // If URL is an Unsplash photo page, convert to default image
  if (url.includes("unsplash.com/photos/")) {
    return DEFAULT_EVENT_IMAGE;
  }
  return url || DEFAULT_EVENT_IMAGE;
}

export function EventCard({
  id,
  title,
  date,
  location,
  image,
  category,
  price,
  mode,
}: EventCardProps) {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  const isFree = numPrice === 0;
  const validImageUrl = getValidImageUrl(image);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group border-none shadow-md">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={validImageUrl}
          alt={`Cover image for ${title} - ${category} event`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <Badge className="absolute top-3 right-3 bg-white/90 text-black hover:bg-white backdrop-blur-sm">
          {category}
        </Badge>
      </div>
      <CardHeader className="p-5 pb-2">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-medium text-primary uppercase tracking-wider flex items-center gap-1" suppressHydrationWarning>
            <Calendar size={12} />
            {formatDate(date)}
          </span>
          <span className={`font-semibold ${isFree ? "text-green-600" : "text-primary"}`} suppressHydrationWarning>
            {isFree ? "Free" : formatINR(numPrice)}
          </span>
        </div>
        <h3 className="font-heading font-bold text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
      </CardHeader>
      <CardContent className="p-5 pt-2 pb-4 text-sm text-muted-foreground space-y-2">
        <div className="flex items-center gap-2">
          <MapPin size={14} />
          <span>{mode === "online" ? "Online" : location}</span>
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Link href={`/events/${id}`} className="w-full" aria-label={`View details for ${title}`}>
          <Button className="w-full bg-slate-100 text-slate-900 hover:bg-primary hover:text-white transition-colors" data-testid={`button-view-event-${id}`}>
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
