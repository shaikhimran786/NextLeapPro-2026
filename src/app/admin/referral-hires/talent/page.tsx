"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, FileText, Search } from "@/lib/icons";
import { ReferralAdminTabs } from "@/components/admin/referral-hires/ReferralAdminTabs";
import { AdminApplication } from "@/lib/referral-admin-types";
import {
  TALENT_STATUSES,
  JOINING_AVAILABILITY,
  EMPLOYMENT_STATUSES,
  APPLICATION_SOURCES,
  labelFor,
} from "@/lib/referral-hires";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const QUICK_FILTERS = [
  { value: "all", label: "All" },
  { value: "immediate_joiners", label: "Immediate Joiners" },
  { value: "layoff_impacted", label: "Layoff Impacted" },
  { value: "notice_period", label: "Notice Period" },
  { value: "freelancers", label: "Freelancers" },
  { value: "consultants", label: "Consultants" },
  { value: "startup_interested", label: "Startup Interested" },
];

export default function AdminTalentPoolPage() {
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [quick, setQuick] = useState("all");
  const [location, setLocation] = useState("");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all"); // all | talent_pool | referral

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (quick !== "all") params.set("quick", quick);
      if (location) params.set("location", location);
      if (search) params.set("search", search);
      if (scope !== "all") params.set("type", scope);
      const res = await fetch(`/api/admin/referral-hires/applications?${params}`);
      const data = await res.json();
      setApps(data.applications || []);
    } catch {
      toast.error("Failed to load talent pool");
    } finally {
      setLoading(false);
    }
  }, [quick, location, search, scope]);

  useEffect(() => {
    load();
  }, [load]);

  async function setTalentStatus(id: number, talentStatus: string) {
    try {
      const res = await fetch(`/api/admin/referral-hires/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talentStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Status updated");
      setApps((cur) => cur.map((a) => (a.id === id ? { ...a, talentStatus } : a)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Referral Hires</h1>
      <p className="mb-2 text-sm text-slate-500">
        Talent pool — all candidates across referral applications and direct submissions.
      </p>
      <ReferralAdminTabs />

      {/* Smart filters */}
      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setQuick(f.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              quick === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <Input
            className="w-56 pl-9"
            placeholder="Search name / email / role"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <Input
          className="w-40"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onBlur={load}
        />
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="talent_pool">Direct submissions</SelectItem>
            <SelectItem value="referral">Referral applications</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-500">{apps.length} candidates</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={26} />
            </div>
          ) : apps.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">No candidates match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="text-center">Layoff</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>CV</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.candidate.name}</div>
                        <div className="text-xs text-slate-500">{a.candidate.email}</div>
                        <div className="mt-0.5 flex flex-wrap gap-1 text-[11px] text-slate-500">
                          {a.candidate.location && <span>{a.candidate.location}</span>}
                          {a.employmentStatus && (
                            <span>• {labelFor(EMPLOYMENT_STATUSES, a.employmentStatus)}</span>
                          )}
                        </div>
                        {a.candidate.skills.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {a.candidate.skills.slice(0, 4).map((s) => (
                              <Badge key={s} variant="secondary" className="h-4 px-1 text-[10px]">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.joiningAvailability
                          ? labelFor(JOINING_AVAILABILITY, a.joiningAvailability)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {a.layoffImpacted === true ? (
                          <Badge className="border-transparent bg-rose-100 text-rose-700">Yes</Badge>
                        ) : a.layoffImpacted === false ? (
                          <span className="text-xs text-slate-400">No</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {a.opening ? (
                            <span>
                              Ref #{a.referralId}
                              <span className="block text-slate-500">{a.opening.companyName}</span>
                            </span>
                          ) : (
                            <Badge variant="secondary">Direct</Badge>
                          )}
                          <span className="mt-0.5 block text-slate-400">
                            {labelFor(APPLICATION_SOURCES, a.applicationSource || "")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {a.cv ? (
                          <a
                            href={`/api/admin/referral-hires/cvs/${a.cv.id}/download?disposition=inline`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <FileText size={13} /> CV
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">
                        {formatDate(a.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={a.talentStatus || "new"}
                          onValueChange={(v) => setTalentStatus(a.id, v)}
                        >
                          <SelectTrigger className="h-8 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TALENT_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
