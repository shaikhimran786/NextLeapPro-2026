import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Admin Dashboard - Next Leap Pro",
  robots: { index: false, follow: false },
};

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const adminSessionCookie = cookieStore.get("admin_session");

  if (!adminSessionCookie?.value) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token: adminSessionCookie.value },
    include: {
      user: {
        include: {
          roles: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      try {
        await prisma.session.delete({ where: { id: session.id } });
      } catch {
        // Ignore deletion errors
      }
    }
    return null;
  }

  const isAdmin = session.user.roles.some(
    (role) => role.name.toLowerCase() === "admin"
  );

  if (!isAdmin) {
    return null;
  }

  return session.user;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await checkAdminAuth();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 ml-64 p-8">{children}</main>
      </div>
    </div>
  );
}
