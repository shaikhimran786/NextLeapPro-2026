import { Suspense } from "react";
import { getNavbarPlansData } from "@/lib/get-navbar-data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const navbarPlans = await getNavbarPlansData();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialPlansData={navbarPlans} />
      <main className="flex-grow flex items-center justify-center py-16">
        <Suspense fallback={<div className="w-full max-w-md mx-auto px-4"><div className="bg-white rounded-2xl shadow-lg p-8 border animate-pulse h-96" /></div>}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
