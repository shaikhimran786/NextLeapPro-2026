import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login - Next Leap Pro",
  robots: { index: false, follow: false },
};

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
