"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { BadgeCheck, XCircle, Clock, Edit, Trash2, Loader2, Mail, MessageCircle } from "@/lib/icons";
import { ReferralAdminTabs } from "@/components/admin/referral-hires/ReferralAdminTabs";
import { JOB_STATUSES, labelFor } from "@/lib/referral-hires";
import { formatDate } from "@/lib/utils";

interface AdminOpening {
  id: number;
  jobTitle: string;
  companyName: string;
  location: string;
  workMode: string;
  experienceRange: string;
  shortDescription: string;
  salaryRange: string | null;
  jobLink: string | null;
  pocName: string;
  pocEmail: string;
  pocWhatsapp: string;
  status: string;
  isVerified: boolean;
  rejectionReason: string | null;
  createdAt: string;
  applicationsCount: number;
  postedBy: { type: string; name: string; email: string };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: "bg-emerald-100 text-emerald-700",
    pending_review: "bg-amber-100 text-amber-700",
    rejected: "bg-rose-100 text-rose-700",
    expired: "bg-slate-200 text-slate-600",
  };
  return (
    <Badge className={`border-transparent ${map[status] || "bg-slate-100 text-slate-700"}`}>
      {labelFor(JOB_STATUSES, status)}
    </Badge>
  );
}

export default function AdminOpeningsPage() {
  const [openings, setOpenings] = useState<AdminOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [rejectTarget, setRejectTarget] = useState<AdminOpening | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editTarget, setEditTarget] = useState<AdminOpening | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOpening | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/referral-hires/openings?${params}`);
      const data = await res.json();
      setOpenings(data.openings || []);
    } catch {
      toast.error("Failed to load openings");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: number, action: string, payload?: Record<string, unknown>) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/referral-hires/openings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast.success("Updated");
      await load();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/referral-hires/openings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Deleted");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Referral Hires</h1>
          <p className="text-sm text-slate-500">Review, verify and manage posted openings.</p>
        </div>
      </div>
      <ReferralAdminTabs />

      <div className="mb-4 flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {JOB_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-500">{openings.length} openings</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={26} />
            </div>
          ) : openings.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">No openings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job / Company</TableHead>
                    <TableHead>Posted By</TableHead>
                    <TableHead>Point of Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Apps</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openings.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <div className="font-medium">{o.jobTitle}</div>
                        <div className="text-xs text-slate-500">
                          {o.companyName} • {o.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{o.postedBy.name}</div>
                        <div className="text-xs capitalize text-slate-400">{o.postedBy.type}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{o.pocName}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail size={11} /> {o.pocEmail}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MessageCircle size={11} /> {o.pocWhatsapp}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                        {o.isVerified && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                            <BadgeCheck size={12} /> Verified badge
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{o.applicationsCount}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">
                        {formatDate(o.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-1">
                          {o.status !== "verified" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 px-2 text-emerald-700"
                              disabled={busyId === o.id}
                              onClick={() => act(o.id, "verify")}
                            >
                              <BadgeCheck size={13} /> Verify
                            </Button>
                          )}
                          {o.status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 px-2 text-rose-700"
                              disabled={busyId === o.id}
                              onClick={() => {
                                setRejectTarget(o);
                                setRejectReason("");
                              }}
                            >
                              <XCircle size={13} /> Reject
                            </Button>
                          )}
                          {o.status !== "expired" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 px-2 text-slate-600"
                              disabled={busyId === o.id}
                              onClick={() => act(o.id, "expire")}
                            >
                              <Clock size={13} /> Expire
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditTarget(o)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-rose-600"
                            onClick={() => setDeleteTarget(o)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject opening</DialogTitle>
            <DialogDescription>
              Optionally add a reason. The opening will be hidden from the public list.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (rejectTarget) {
                  const ok = await act(rejectTarget.id, "reject", { reason: rejectReason });
                  if (ok) setRejectTarget(null);
                }
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <EditOpeningDialog
        opening={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={async () => {
          setEditTarget(null);
          await load();
        }}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete opening?</DialogTitle>
            <DialogDescription>
              This permanently removes “{deleteTarget?.jobTitle}”. Applications linked to it will be
              kept but unlinked. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busyId === deleteTarget?.id}
              onClick={() => deleteTarget && remove(deleteTarget.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditOpeningDialog({
  opening,
  onClose,
  onSaved,
}: {
  opening: AdminOpening | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fields, setFields] = useState({
    jobTitle: "",
    companyName: "",
    location: "",
    experienceRange: "",
    salaryRange: "",
    shortDescription: "",
    pocName: "",
    pocEmail: "",
    pocWhatsapp: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (opening) {
      setFields({
        jobTitle: opening.jobTitle,
        companyName: opening.companyName,
        location: opening.location,
        experienceRange: opening.experienceRange,
        salaryRange: opening.salaryRange || "",
        shortDescription: opening.shortDescription,
        pocName: opening.pocName,
        pocEmail: opening.pocEmail,
        pocWhatsapp: opening.pocWhatsapp,
      });
    }
  }, [opening]);

  async function save() {
    if (!opening) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/referral-hires/openings/${opening.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Saved");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!opening} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit opening</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {(
            [
              ["jobTitle", "Job Title"],
              ["companyName", "Company"],
              ["location", "Location"],
              ["experienceRange", "Experience Range"],
              ["salaryRange", "Salary Range"],
              ["pocName", "POC Name"],
              ["pocEmail", "POC Email"],
              ["pocWhatsapp", "POC WhatsApp"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                value={fields[key]}
                onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <Label>Short Description</Label>
            <Textarea
              rows={3}
              value={fields.shortDescription}
              onChange={(e) => setFields((f) => ({ ...f, shortDescription: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="animate-spin" size={15} />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
