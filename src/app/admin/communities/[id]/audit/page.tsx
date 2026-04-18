"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuditEntry {
  id: number;
  communityId: number | null;
  communityName: string;
  communitySlug: string | null;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  actor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export default function CommunityAuditFullHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [communityName, setCommunityName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/communities/${id}/audit?all=1`);
        if (!res.ok) {
          if (!cancelled) setError("Failed to load audit history");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setEntries(data.entries ?? []);
        setTotal(data.total ?? data.entries?.length ?? 0);
        setPageSize(data.pageSize ?? 50);
        if (data.entries?.[0]?.communityName) {
          setCommunityName(data.entries[0].communityName);
        }
      } catch {
        if (!cancelled) setError("Failed to load audit history");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">
            Audit history{communityName ? ` — ${communityName}` : ""}
          </h1>
          <p className="text-slate-600 mt-1">
            Full chronological log of admin and owner changes for this community.
          </p>
        </div>
        <Link href="/admin/communities">
          <Button variant="outline" data-testid="link-back-to-communities">
            Back to communities
          </Button>
        </Link>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading
              ? "Loading…"
              : `${total} ${total === 1 ? "entry" : "entries"} (newest first)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-red-600" data-testid="text-audit-error">
              {error}
            </p>
          ) : isLoading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-slate-500" data-testid="text-audit-empty-full">
              No audit entries yet.
            </p>
          ) : (
            <ul className="divide-y border rounded" data-testid="list-audit-entries-full">
              {entries.map((entry) => {
                const actorName = entry.actor
                  ? `${entry.actor.firstName} ${entry.actor.lastName}`.trim() || entry.actor.email
                  : "System";
                const summary = entry.field
                  ? `${entry.action} ${entry.field}: ${entry.oldValue ?? "—"} → ${entry.newValue ?? "—"}`
                  : `${entry.action}${entry.newValue ? `: ${entry.newValue}` : ""}`;
                return (
                  <li
                    key={entry.id}
                    className="px-4 py-3"
                    data-testid={`audit-entry-full-${entry.id}`}
                  >
                    <div className="font-medium text-slate-700 text-sm break-all">{summary}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {actorName} • {new Date(entry.createdAt).toLocaleString()}
                      {entry.communityId === null && (
                        <span className="ml-2 italic">(community deleted)</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!isLoading && total > entries.length && (
            <p className="text-xs text-slate-500 mt-3" data-testid="text-page-size-note">
              Showing {entries.length} of {total}. Page size {pageSize}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
