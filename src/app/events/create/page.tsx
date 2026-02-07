import { requireAuthOrRedirect } from "@/components/auth/RequireAuth";
import CreateEventContent from "./CreateEventContent";

export const metadata = {
  title: "Create Event | Next Leap Pro",
  description: "Create a new event for your community"
};

export default async function CreateEventPage() {
  await requireAuthOrRedirect("/events/create");
  
  return <CreateEventContent />;
}
