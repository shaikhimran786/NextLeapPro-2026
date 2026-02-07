import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export interface NotificationPayload {
  type: "new_registration" | "new_subscription";
  message: string;
  userName?: string;
  planName?: string;
  timestamp: string;
}

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function broadcastNotification(payload: NotificationPayload): void {
  if (io) {
    io.emit("notification", payload);
    console.log("Broadcast notification:", payload.type);
  }
}

export async function notifyNewRegistration(userName: string): Promise<void> {
  broadcastNotification({
    type: "new_registration",
    message: `${userName} just joined the community!`,
    userName,
    timestamp: new Date().toISOString(),
  });
}

export async function notifyNewSubscription(userName: string, planName: string): Promise<void> {
  broadcastNotification({
    type: "new_subscription",
    message: `${userName} just subscribed to ${planName}!`,
    userName,
    planName,
    timestamp: new Date().toISOString(),
  });
}
