"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Loader2, ArrowRight, CheckCircle, XCircle } from "@/lib/icons";
import { ReferralAdminTabs } from "@/components/admin/referral-hires/ReferralAdminTabs";
import { AdminApplication } from "@/lib/referral-admin-types";
import { APPLICATION_STATUSES } from "@/lib/referral-hires";
import { formatDate } from "@/lib/utils";

function Flag({ on }: { on: boolean }) {
  return on ? (
    <CheckCircle size={15} className="text-emerald-600" />
  ) : (
    <XCircle size={15} className="text-slate-300" />
  );
}

export default function AdminConnectionsPage() {
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/referral-hires/applications?type=referral`);
      const data = await res.json();
      setApps(data.applications || []);
    } catch {
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  }, []);

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
      toast.success("Referral status updated");
      setApps((cur) => cur.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Referral Hires</h1>
      <p className="mb-2 text-sm text-slate-500">
        End-to-end mapping: candidate → opening → posted by → point of contact.
      </p>
      <ReferralAdminTabs />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={26} />
            </div>
          ) : apps.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">No referral connections yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Connection</TableHead>
                    <TableHead>Point of Contact</TableHead>
                    <TableHead className="text-center">CV</TableHead>
                    <TableHead className="text-center">WhatsApp</TableHead>
                    <TableHead className="text-center">Email</TableHead>
                    <TableHead>Referral Status</TableHead>
                    <TableHead>Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5 text-sm">
                          <span className="font-medium">{a.candidate.name}</span>
                          <ArrowRight size={12} className="text-slate-400" />
                          <span>
                            {a.opening?.jobTitle} <span className="text-slate-400">@</span>{" "}
                            {a.opening?.companyName}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <span>Ref #{a.referralId}</span>
                          <span>•</span>
                          <span>Posted by {a.opening?.postedBy}</span>
                          <span>•</span>
                          <Badge variant="outline" className="h-4 px-1 text-[10px]">
                            {a.source === "registered" ? "Registered" : "Guest"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-slate-700">{a.opening?.pocName}</div>
                        <div className="text-slate-500">{a.opening?.pocEmail}</div>
                        <div className="text-slate-500">{a.opening?.pocWhatsapp}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        {a.cv ? (
                          <Badge variant="outline" className="font-normal">
                            {a.cv.reused ? "Reused" : "Uploaded"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Flag on={a.whatsappClicked} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Flag on={a.emailClicked} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={a.status} onValueChange={(v) => setStatus(a.id, v)}>
                          <SelectTrigger className="h-8 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {APPLICATION_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">
                        {formatDate(a.createdAt)}
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
