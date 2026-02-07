import { requireAuthOrRedirect } from "@/components/auth/RequireAuth";
import SettingsContent from "./SettingsContent";

export const metadata = {
  title: "Settings | Next Leap Pro",
  description: "Manage your account settings and preferences"
};

export default async function SettingsPage() {
  await requireAuthOrRedirect("/settings");
  
  return <SettingsContent />;
}
