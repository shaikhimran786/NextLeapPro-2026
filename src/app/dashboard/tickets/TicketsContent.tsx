"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  QrCode,
  Loader2,
  CreditCard,
  Wallet
} from "@/lib/icons";
import { formatDateTime, formatINR } from "@/lib/utils";

interface Event {
  id: number;
  title: string;
  slug: string | null;
  shortDescription: string | null;
  coverImage: string;
  category: string;
  mode: string;
  startDate: string;
  endDate: string;
  timezone: string | null;
  venue: string | null;
  venueAddress: string | null;
  onlineLink: string | null;
  price: number;
  currency: string;
}

interface TicketData {
  id: number;
  status: string;
  paymentStatus: string | null;
  paidAmount: number;
  qrCode: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  registeredAt: string;
  event: Event;
}

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
    case "registered":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confirmed
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    case "attended":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Attended
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          {status}
        </Badge>
      );
  }
}

function getPaymentBadge(paymentStatus: string | null, paidAmount: number) {
  if (paidAmount === 0 || paidAmount === null) {
    return (
      <Badge className="bg-slate-100 text-slate-600 border-slate-200">
        Free
      </Badge>
    );
  }
  
  switch (paymentStatus?.toLowerCase()) {
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <Wallet className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
          <CreditCard className="h-3 w-3 mr-1" />
          Payment Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Payment Failed
        </Badge>
      );
    case "refunded":
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          Refunded
        </Badge>
      );
    default:
      return null;
  }
}

function getEventStatus(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) {
    return { label: "Upcoming", className: "bg-primary/10 text-primary" };
  } else if (now >= start && now <= end) {
    return { label: "Live Now", className: "bg-green-100 text-green-800 animate-pulse" };
  } else {
    return { label: "Ended", className: "bg-slate-100 text-slate-600" };
  }
}

export default function TicketsContent() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      const res = await fetch("/api/me/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      } else if (res.status === 401) {
        router.push("/auth/login?redirect=/dashboard/tickets");
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const upcomingTickets = tickets.filter(t => {
    const eventEnd = new Date(t.event.endDate);
    return eventEnd >= new Date() && t.status !== "cancelled";
  });

  const pastTickets = tickets.filter(t => {
    const eventEnd = new Date(t.event.endDate);
    return eventEnd < new Date() || t.status === "cancelled";
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Ticket className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900" data-testid="text-page-title">
                My Tickets
              </h1>
              <p className="text-slate-600">Your event registrations and tickets</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Ticket className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">No tickets yet</h2>
              <p className="text-slate-500 mb-6">You haven't registered for any events yet.</p>
              <Link href="/events">
                <Button data-testid="button-browse-events">Browse Events</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {upcomingTickets.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Events ({upcomingTickets.length})
                </h2>
                <div className="space-y-4">
                  {upcomingTickets.map((ticket) => {
                    const eventStatus = getEventStatus(ticket.event.startDate, ticket.event.endDate);
                    return (
                      <Card 
                        key={ticket.id} 
                        className="overflow-hidden hover:shadow-lg transition-shadow"
                        data-testid={`ticket-card-${ticket.id}`}
                      >
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-48 h-32 md:h-auto relative">
                            <img
                              src={ticket.event.coverImage || "/placeholder-event.jpg"}
                              alt={ticket.event.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge className={eventStatus.className}>
                                {eventStatus.label}
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="flex-1 p-5">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {getStatusBadge(ticket.status)}
                                  {getPaymentBadge(ticket.paymentStatus, ticket.paidAmount)}
                                  <Badge variant="outline">{ticket.event.category}</Badge>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                  {ticket.event.title}
                                </h3>
                                <div className="space-y-1.5 text-sm text-slate-600">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span>{formatDateTime(ticket.event.startDate)}</span>
                                  </div>
                                  {ticket.event.mode === "online" ? (
                                    <div className="flex items-center gap-2">
                                      <Video className="h-4 w-4 text-blue-500" />
                                      <span>Online Event</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-slate-400" />
                                      <span>{ticket.event.venue || ticket.event.venueAddress || "TBA"}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {ticket.qrCode && (
                                  <div className="p-2 bg-white border rounded-lg">
                                    <QrCode className="h-12 w-12 text-slate-700" />
                                  </div>
                                )}
                                <div className="text-right">
                                  <p className="text-xs text-slate-500">Registered</p>
                                  <p className="text-sm text-slate-700">
                                    {new Date(ticket.registeredAt).toLocaleDateString()}
                                  </p>
                                </div>
                                {ticket.paidAmount > 0 && (
                                  <p className="text-sm font-medium text-green-600">
                                    Paid: {formatINR(ticket.paidAmount)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                              <Link href={`/events/${ticket.event.id}`}>
                                <Button variant="outline" size="sm" data-testid={`button-view-event-${ticket.id}`}>
                                  View Event
                                </Button>
                              </Link>
                              {ticket.paymentStatus === "pending" && ticket.paidAmount > 0 && (
                                <Link href={`/events/${ticket.event.id}`}>
                                  <Button 
                                    size="sm" 
                                    className="bg-amber-500 hover:bg-amber-600"
                                    data-testid={`button-complete-payment-${ticket.id}`}
                                  >
                                    <CreditCard className="h-4 w-4 mr-1" />
                                    Complete Payment
                                  </Button>
                                </Link>
                              )}
                              {ticket.event.mode === "online" && ticket.event.onlineLink && eventStatus.label === "Live Now" && ticket.status === "registered" && ticket.paymentStatus === "paid" && (
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => window.open(ticket.event.onlineLink!, "_blank")}
                                  data-testid={`button-join-${ticket.id}`}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Join Now
                                </Button>
                              )}
                              {ticket.qrCode && ticket.status === "registered" && (
                                <div className="ml-auto text-xs text-slate-500">
                                  Ticket: <span className="font-mono font-medium">{ticket.qrCode}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {pastTickets.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-500" />
                  Past Events ({pastTickets.length})
                </h2>
                <div className="space-y-4">
                  {pastTickets.map((ticket) => (
                    <Card 
                      key={ticket.id} 
                      className="overflow-hidden opacity-75 hover:opacity-100 transition-opacity"
                      data-testid={`ticket-card-past-${ticket.id}`}
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-48 h-32 md:h-auto relative grayscale">
                          <img
                            src={ticket.event.coverImage || "/placeholder-event.jpg"}
                            alt={ticket.event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="flex-1 p-5">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(ticket.status)}
                                {ticket.checkedIn && (
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Attended
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                                {ticket.event.title}
                              </h3>
                              <div className="space-y-1.5 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDateTime(ticket.event.startDate)}</span>
                                </div>
                                {ticket.event.mode === "online" ? (
                                  <div className="flex items-center gap-2">
                                    <Video className="h-4 w-4" />
                                    <span>Online Event</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{ticket.event.venue || "Venue"}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Event ended</p>
                              <p className="text-sm text-slate-600">
                                {new Date(ticket.event.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t">
                            <Link href={`/events/${ticket.event.id}`}>
                              <Button variant="ghost" size="sm" data-testid={`button-view-past-event-${ticket.id}`}>
                                View Event Details
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
