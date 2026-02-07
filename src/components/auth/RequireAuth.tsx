import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export async function RequireAuth({ children, redirectTo }: RequireAuthProps) {
  const user = await getCurrentUser();
  
  if (!user) {
    const loginUrl = redirectTo 
      ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
      : "/auth/login";
    redirect(loginUrl);
  }
  
  return <>{children}</>;
}

export async function getAuthenticatedUser() {
  const user = await getCurrentUser();
  return user;
}

export async function requireAuthOrRedirect(redirectPath: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`);
  }
  
  return user;
}
