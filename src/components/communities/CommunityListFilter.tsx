"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "@/lib/icons";
import { CommunityCard } from "@/components/shared/CommunityCard";

interface CommunityItem {
  id: number;
  name: string;
  description: string;
  shortDescription: string | null;
  logo: string;
  category: string;
  memberCount: number;
  location: string | null;
  tags: string[];
  mode: string;
  membershipType: string;
}

interface CommunityListFilterProps {
  communities: CommunityItem[];
  categories: string[];
}

export function CommunityListFilter({ communities, categories }: CommunityListFilterProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = communities;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.shortDescription && c.shortDescription.toLowerCase().includes(q)) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      result = result.filter((c) => c.category === selectedCategory);
    }

    return result;
  }, [communities, search, selectedCategory]);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-communities"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            data-testid="filter-category-all"
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              data-testid={`filter-category-${cat}`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((community) => (
            <CommunityCard
              key={community.id}
              id={community.id}
              name={community.name}
              description={community.shortDescription || community.description}
              logo={community.logo}
              category={community.category}
              memberCount={community.memberCount}
              location={community.location}
              tags={community.tags}
              mode={community.mode}
              membershipType={community.membershipType}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">
            {search || selectedCategory ? "No communities match your filters." : "No communities yet."}
          </p>
          {(search || selectedCategory) && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => { setSearch(""); setSelectedCategory(null); }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          )}
          {!search && !selectedCategory && (
            <p className="mt-2">Be the first to create one!</p>
          )}
        </div>
      )}
    </>
  );
}
