"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Briefcase, IndianRupee, Users, ExternalLink, Send } from "@/lib/icons";
import { VerifiedBadge } from "./VerifiedBadge";
import { ReferralBrandingFooter } from "./ReferralBrandingFooter";
import { WORK_MODES, labelFor } from "@/lib/referral-hires";
import { formatDate } from "@/lib/utils";

export interface PublicOpening {
  id: number;
  jobTitle: string;
  companyName: string;
  location: string;
  workMode: string;
  experienceRange: string;
  shortDescription: string;
  salaryRange: string | null;
  jobLink: string | null;
  lastDateToApply: string | null;
  referralSource: string | null;
  isVerified: boolean;
  createdAt: string;
  pocName: string | null;
  applicationsCount: number;
}

export function OpeningsBrowser({ initialOpenings }: { initialOpenings: PublicOpening[] }) {
  const router = useRouter();
  const [openings, setOpenings] = useState<PublicOpening[]>(initialOpenings);
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState("all");
  const [loading, setLoading] = useState(false);

  async function refresh(nextSearch: string, nextMode: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nextSearch) params.set("search", nextSearch);
      if (nextMode && nextMode !== "all") params.set("workMode", nextMode);
      const res = await fetch(`/api/referral-hires/openings?${params.toString()}`);
      const data = await res.json();
      setOpenings(data.openings || []);
    } catch {
      /* keep current list */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="openings" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            refresh(search, workMode);
          }}
        >
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search role, company, or location"
            className="pl-9"
          />
        </form>
        <Select
          value={workMode}
          onValueChange={(v) => {
            setWorkMode(v);
            refresh(search, v);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All work modes</SelectItem>
            {WORK_MODES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading openings…</p>
      ) : openings.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No verified openings right now. Check back soon, or share one yourself.
            </p>
            <Button asChild variant="outline">
              <Link href="/referral-hires/share">Share an Opening</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {openings.map((o) => (
            <Card key={o.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold leading-tight">{o.jobTitle}</h3>
                    <p className="text-sm text-muted-foreground">{o.companyName}</p>
                  </div>
                  {o.isVerified && <VerifiedBadge />}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {o.location}
                  </span>
                  <Badge variant="outline" className="font-normal">
                    {labelFor(WORK_MODES, o.workMode)}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Briefcase size={12} /> {o.experienceRange}
                  </span>
                  {o.salaryRange && (
                    <span className="flex items-center gap-1">
                      <IndianRupee size={12} /> {o.salaryRange}
                    </span>
                  )}
                </div>

                <p className="line-clamp-3 text-sm text-foreground/80">{o.shortDescription}</p>

                <div className="mt-auto space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {o.applicationsCount} applied
                    </span>
                    <span>Posted {formatDate(o.createdAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-1"
                      onClick={() => router.push(`/referral-hires/apply/${o.id}`)}
                    >
                      <Send size={15} /> Apply Now
                    </Button>
                    {o.jobLink && (
                      <Button asChild variant="outline" size="icon" title="Open job link">
                        <a href={o.jobLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={15} />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReferralBrandingFooter className="pt-2" />
    </div>
  );
}
