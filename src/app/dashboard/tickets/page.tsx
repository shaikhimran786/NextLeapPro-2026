import { requireAuthOrRedirect } from "@/components/auth/RequireAuth";
import TicketsContent from "./TicketsContent";

export const metadata = {
  title: "My Tickets | Next Leap Pro",
  description: "View and manage your event registrations"
};

export default async function TicketsPage() {
  await requireAuthOrRedirect("/dashboard/tickets");
  
  return <TicketsContent />;
}
