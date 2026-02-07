"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserStatus } from "@/hooks/useUserStatus";
import { Plus, Briefcase, Filter } from "@/lib/icons";

interface ServicesHeaderProps {
  categories: string[];
  selectedCategory?: string;
}

export function ServicesHeader({ categories, selectedCategory }: ServicesHeaderProps) {
  const router = useRouter();
  const { userStatus } = useUserStatus();
  const isAuthenticated = userStatus.authStatus === "logged_in";

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams();
    if (category !== "all") {
      params.set("category", category);
    }
    router.push(`/services${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="mb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-heading font-bold mb-2">Services Marketplace</h1>
          <p className="text-slate-600 text-lg">
            Find mentors, coaches, and professionals to help you grow your skills and career.
          </p>
        </div>
        
        {isAuthenticated ? (
          <Link href="/services/create">
            <Button className="gap-2" size="lg" data-testid="offer-service-button">
              <Plus className="h-4 w-4" />
              Offer Your Service
            </Button>
          </Link>
        ) : (
          <Link href="/auth/register">
            <Button className="gap-2" size="lg" variant="outline" data-testid="signup-to-offer-button">
              <Briefcase className="h-4 w-4" />
              Sign Up to Offer Services
            </Button>
          </Link>
        )}
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Badge
            variant={!selectedCategory || selectedCategory === "all" ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/90"
            onClick={() => handleCategoryChange("all")}
            data-testid="filter-all"
          >
            All
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/90"
              onClick={() => handleCategoryChange(category)}
              data-testid={`filter-${category.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {category}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
