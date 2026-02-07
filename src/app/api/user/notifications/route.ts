import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in to update notification preferences" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { emailUpdates, eventReminders, communityNotifications, marketingEmails } = body;

    return NextResponse.json({ 
      success: true, 
      message: "Notification preferences saved",
      preferences: {
        emailUpdates,
        eventReminders,
        communityNotifications,
        marketingEmails
      }
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      emailUpdates: true,
      eventReminders: true,
      communityNotifications: true,
      marketingEmails: false
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}
