import { requireAuthOrRedirect } from "@/components/auth/RequireAuth";
import ProfileEditContent from "./ProfileEditContent";

export const metadata = {
  title: "Edit Profile | Next Leap Pro",
  description: "Update your profile information"
};

export default async function ProfileEditPage() {
  await requireAuthOrRedirect("/profile/edit");
  
  return <ProfileEditContent />;
}
