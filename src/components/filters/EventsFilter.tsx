"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "@/lib/icons";
import { useState } from "react";

interface EventsFilterProps {
  categories: string[];
}

export function EventsFilter({ categories }: EventsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const activeCategory = searchParams.get("category");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    router.push(`/events?${params.toString()}`);
  };

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (activeCategory === category) {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    router.push(`/events?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    router.push("/events");
  };

  const hasFilters = activeCategory || search;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="pl-9"
            data-testid="input-search-events"
          />
        </div>
        <Button type="submit" data-testid="button-search">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter by:</span>
        {categories.map((category) => (
          <Badge
            key={category}
            variant={activeCategory === category ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground transition-colors"
            onClick={() => handleCategoryClick(category)}
            data-testid={`filter-category-${category.toLowerCase()}`}
          >
            {category}
          </Badge>
        ))}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
