"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Users, Search, Eye, XCircle, RefreshCw, CreditCard, Calendar, IndianRupee } from "@/lib/icons";
import { formatINR, formatDateTime } from "@/lib/utils";

interface Subscriber {
  id: number;
  userId: number;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  planId: number;
  plan: {
    id: number;
    name: string;
    tier: string;
    price: number;
  };
  status: string;
  cashfreeSubscriptionId: string | null;
  paymentGateway: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  payments: {
    id: number;
    amount: number;
    status: string;
    createdAt: string;
  }[];
}

interface SubscriberDetails extends Subscriber {
  allPayments: {
    id: number;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string | null;
    cashfreePaymentId: string | null;
    createdAt: string;
  }[];
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubscriber, setSelectedSubscriber] = useState<SubscriberDetails | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [subscriberToCancel, setSubscriberToCancel] = useState<Subscriber | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchSubscribers();
  }, [statusFilter]);

  async function fetchSubscribers() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/admin/subscribers?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch subscribers");
      const data = await response.json();
      setSubscribers(data.subscribers);
      setTotal(data.total);
    } catch (error) {
      toast.error("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubscriberDetails(id: number) {
    try {
      const response = await fetch(`/api/admin/subscribers/${id}`);
      if (!response.ok) throw new Error("Failed to fetch details");
      const data = await response.json();
      setSelectedSubscriber(data.subscriber);
    } catch (error) {
      toast.error("Failed to load subscriber details");
    }
  }

  async function cancelSubscription() {
    if (!subscriberToCancel) return;

    try {
      const response = await fetch(`/api/admin/subscribers/${subscriberToCancel.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by admin" }),
      });

      if (!response.ok) throw new Error("Failed to cancel subscription");

      toast.success("Subscription cancelled successfully");

      setCancelDialogOpen(false);
      setSubscriberToCancel(null);
      fetchSubscribers();
    } catch (error) {
      toast.error("Failed to cancel subscription");
    }
  }

  async function reactivateSubscription(id: number) {
    try {
      const response = await fetch(`/api/admin/subscribers/${id}/reactivate`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to reactivate subscription");

      toast.success("Subscription reactivated successfully");

      fetchSubscribers();
    } catch (error) {
      toast.error("Failed to reactivate subscription");
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { className: string; label: string }> = {
      active: { className: "bg-green-100 text-green-800", label: "Active" },
      pending: { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
      cancelled: { className: "bg-red-100 text-red-800", label: "Cancelled" },
      expired: { className: "bg-gray-100 text-gray-800", label: "Expired" },
      past_due: { className: "bg-orange-100 text-orange-800", label: "Past Due" },
      trialing: { className: "bg-blue-100 text-blue-800", label: "Trial" },
    };

    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchSubscribers();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Subscribers</h1>
          <p className="text-slate-600 mt-1">Manage subscription members and payment history</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {total} Total
        </Badge>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Subscribers
          </CardTitle>
          <CardDescription>View and manage platform subscribers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-subscriber-search"
                />
              </div>
              <Button type="submit" data-testid="button-search-subscribers">
                Search
              </Button>
            </form>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="trialing">Trial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No subscribers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead>Total Paid</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((sub) => {
                  const totalPaid = sub.payments
                    ?.filter((p) => p.status === "captured")
                    .reduce((sum, p) => sum + p.amount, 0) || 0;

                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {sub.user.firstName} {sub.user.lastName}
                          </p>
                          <p className="text-sm text-slate-500">{sub.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.plan.name}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {formatINR(totalPaid).replace("₹", "")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchSubscriberDetails(sub.id)}
                            data-testid={`button-view-subscriber-${sub.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {sub.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSubscriberToCancel(sub);
                                setCancelDialogOpen(true);
                              }}
                              data-testid={`button-cancel-subscriber-${sub.id}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(sub.status === "cancelled" || sub.status === "expired") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => reactivateSubscription(sub.id)}
                              data-testid={`button-reactivate-subscriber-${sub.id}`}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedSubscriber} onOpenChange={() => setSelectedSubscriber(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscriber Details</DialogTitle>
          </DialogHeader>
          {selectedSubscriber && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">User</p>
                  <p className="font-medium">
                    {selectedSubscriber.user.firstName} {selectedSubscriber.user.lastName}
                  </p>
                  <p className="text-sm text-slate-500">{selectedSubscriber.user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Plan</p>
                  <p className="font-medium">{selectedSubscriber.plan.name}</p>
                  <p className="text-sm text-slate-500">
                    {formatINR(selectedSubscriber.plan.price)}/month
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Status</p>
                  {getStatusBadge(selectedSubscriber.status)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Subscribed On</p>
                  <p className="font-medium">
                    {new Date(selectedSubscriber.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Current Period</p>
                  <p className="font-medium">
                    {selectedSubscriber.currentPeriodStart
                      ? new Date(selectedSubscriber.currentPeriodStart).toLocaleDateString()
                      : "-"}{" "}
                    -{" "}
                    {selectedSubscriber.currentPeriodEnd
                      ? new Date(selectedSubscriber.currentPeriodEnd).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                {selectedSubscriber.cancelledAt && (
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Cancelled On</p>
                    <p className="font-medium text-red-600">
                      {new Date(selectedSubscriber.cancelledAt).toLocaleDateString()}
                    </p>
                    {selectedSubscriber.cancelReason && (
                      <p className="text-sm text-slate-500">{selectedSubscriber.cancelReason}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment History
                </h4>
                {selectedSubscriber.allPayments && selectedSubscriber.allPayments.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedSubscriber.allPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{formatINR(payment.amount)}</p>
                          <p className="text-xs text-slate-500">
                            {payment.paymentMethod || "Unknown method"}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              payment.status === "captured"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {payment.status}
                          </Badge>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No payment records</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this subscription for{" "}
              <strong>
                {subscriberToCancel?.user.firstName} {subscriberToCancel?.user.lastName}
              </strong>
              ? They will retain access until the end of their current billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={cancelSubscription} data-testid="button-confirm-cancel">
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
