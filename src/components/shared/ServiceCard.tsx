import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "@/lib/icons";
import { formatINR } from "@/lib/utils";

interface ServiceCardProps {
  id: number;
  title: string;
  provider: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
    roles?: string[];
  };
  price: number | string;
  rating: number | string;
  image: string;
  category: string;
}

const DEFAULT_SERVICE_IMAGE = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80";

function getValidImageUrl(url: string): string {
  // If URL is an Unsplash photo page, convert to image download URL
  if (url.includes("unsplash.com/photos/")) {
    return DEFAULT_SERVICE_IMAGE;
  }
  return url || DEFAULT_SERVICE_IMAGE;
}

export function ServiceCard({
  id,
  title,
  provider,
  price,
  rating,
  image,
  category,
}: ServiceCardProps) {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  const numRating = typeof rating === "string" ? parseFloat(rating) : rating;
  const providerName = `${provider.firstName} ${provider.lastName}`;
  const initials = `${provider.firstName[0]}${provider.lastName[0]}`;
  const validImageUrl = getValidImageUrl(image);

  return (
    <Link href={`/services/${id}`} aria-label={`View ${title} service by ${providerName}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group border-none shadow-md h-full" data-testid={`service-card-${id}`}>
        <div className="relative h-48 overflow-hidden">
          <Image
            src={validImageUrl}
            alt={`${title} - ${category} service by ${providerName}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <Badge className="absolute top-3 right-3 bg-white/90 text-black hover:bg-white backdrop-blur-sm">
            {category}
          </Badge>
        </div>
        <CardContent className="p-5">
          <h3 className="font-heading font-bold text-lg leading-tight line-clamp-2 mb-3 group-hover:text-primary transition-colors">
            {title}
          </h3>

          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={provider.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${providerName}`}
                alt={`Profile photo of ${providerName}, service provider`}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{providerName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {provider.roles?.[0] || "Professional"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium" suppressHydrationWarning>{numRating.toFixed(1)}</span>
            </div>
            <span className="font-bold text-primary" suppressHydrationWarning>{formatINR(numPrice)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
