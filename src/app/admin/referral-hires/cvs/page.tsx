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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Mail,
  MessageCircle,
  Search,
} from "@/lib/icons";
import { ReferralAdminTabs } from "@/components/admin/referral-hires/ReferralAdminTabs";
import { AdminApplication } from "@/lib/referral-admin-types";
import { APPLICATION_STATUSES, labelFor, buildWhatsappLink } from "@/lib/referral-hires";
import { formatDate } from "@/lib/utils";

export default function AdminCvsPage() {
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`/api/admin/referral-hires/applications?${params}`);
      const data = await res.json();
      setApps(data.applications || []);
    } catch {
      toast.error("Failed to load CVs");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: number, status: string) {
    try {
      const res = await fetch(`/api/admin/referral-hires/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(`Marked ${labelFor(APPLICATION_STATUSES, status)}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  function cvUrl(cvId: number, disposition: "inline" | "attachment") {
    return `/api/admin/referral-hires/cvs/${cvId}/download?disposition=${disposition}`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Referral Hires</h1>
      <p className="mb-2 text-sm text-slate-500">Submitted CVs and applications.</p>
      <ReferralAdminTabs />

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
            className="w-64 pl-9"
            placeholder="Search candidate or role"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All applications</SelectItem>
            <SelectItem value="referral">Referral applications</SelectItem>
            <SelectItem value="talent_pool">Talent pool</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-500">{apps.length} records</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={26} />
            </div>
          ) : apps.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>CV</TableHead>
                    <TableHead>Applied Role</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.candidate.name}</div>
                        <div className="text-xs text-slate-500">{a.candidate.email}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <MessageCircle size={11} /> {a.candidate.whatsapp || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {a.cv ? (
                          <a
                            href={cvUrl(a.cv.id, "inline")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <FileText size={13} /> {a.cv.fileName}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">No CV</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.opening ? (
                          <div>
                            <div className="text-sm">{a.opening.jobTitle}</div>
                            <div className="text-xs text-slate-500">{a.opening.companyName}</div>
                          </div>
                        ) : (
                          <Badge variant="secondary">Direct Talent Submission</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.source === "registered" ? "default" : "outline"}>
                          {a.source === "registered" ? "Registered" : "Guest"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{labelFor(APPLICATION_STATUSES, a.status)}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">
                        {formatDate(a.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>CV</DropdownMenuLabel>
                            {a.cv && (
                              <>
                                <DropdownMenuItem asChild>
                                  <a href={cvUrl(a.cv.id, "inline")} target="_blank" rel="noopener noreferrer">
                                    <Eye size={14} className="mr-2" /> View CV
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a href={cvUrl(a.cv.id, "attachment")}>
                                    <FileText size={14} className="mr-2" /> Download CV
                                  </a>
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Contact candidate</DropdownMenuLabel>
                            {a.candidate.email && (
                              <DropdownMenuItem asChild>
                                <a href={`mailto:${a.candidate.email}`}>
                                  <Mail size={14} className="mr-2" /> Email
                                </a>
                              </DropdownMenuItem>
                            )}
                            {a.candidate.whatsapp && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={buildWhatsappLink(a.candidate.whatsapp, "")}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <MessageCircle size={14} className="mr-2" /> WhatsApp
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Mark as</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setStatus(a.id, "shortlisted")}>
                              Shortlisted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatus(a.id, "sent_to_contact")}>
                              Referred (Sent to contact)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatus(a.id, "closed")}>
                              Closed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
