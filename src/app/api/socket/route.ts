import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    status: "Socket.IO endpoint",
    message: "Use the socket client to connect"
  });
}
