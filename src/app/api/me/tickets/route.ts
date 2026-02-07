import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            coverImage: true,
            category: true,
            mode: true,
            startDate: true,
            endDate: true,
            timezone: true,
            venue: true,
            venueAddress: true,
            onlineLink: true,
            virtualLinkHidden: true,
            price: true,
            currency: true,
          },
        },
      },
      orderBy: { registeredAt: "desc" },
    });

    const tickets = registrations.map((reg) => ({
      id: reg.id,
      status: reg.status,
      paymentStatus: reg.paymentStatus,
      paidAmount: reg.paidAmount ? Number(reg.paidAmount) : 0,
      qrCode: reg.qrCode,
      checkedIn: reg.checkedIn,
      checkedInAt: reg.checkedInAt,
      registeredAt: reg.registeredAt,
      event: {
        id: reg.event.id,
        title: reg.event.title,
        slug: reg.event.slug,
        shortDescription: reg.event.shortDescription,
        coverImage: reg.event.coverImage,
        category: reg.event.category,
        mode: reg.event.mode,
        startDate: reg.event.startDate,
        endDate: reg.event.endDate,
        timezone: reg.event.timezone,
        venue: reg.event.venue,
        venueAddress: reg.event.venueAddress,
        onlineLink: !reg.event.virtualLinkHidden ? reg.event.onlineLink : null,
        price: Number(reg.event.price),
        currency: reg.event.currency,
      },
    }));

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}
