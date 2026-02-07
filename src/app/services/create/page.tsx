import { Metadata } from "next";
import { redirect } from "next/navigation";
import { generateMeta } from "@/lib/metadata";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUserId } from "@/lib/auth-utils";
import { CreateServiceForm } from "./CreateServiceForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateMeta({
  title: "Offer Your Service",
  description: "Create a service listing to offer your skills and expertise to the community.",
  path: "/services/create",
});

export default async function CreateServicePage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/auth/login?redirect=/services/create");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold mb-2">Offer Your Service</h1>
            <p className="text-muted-foreground">
              Share your skills and expertise with the community. Create a service listing that showcases what you can offer.
            </p>
          </div>

          <CreateServiceForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
