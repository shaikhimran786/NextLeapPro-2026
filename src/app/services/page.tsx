import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { generateMeta } from "@/lib/metadata";
import { getNavbarPlansData } from "@/lib/get-navbar-data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ServiceCard } from "@/components/shared/ServiceCard";
import { ServicesHeader } from "./ServicesHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateMeta({
  title: "Services Marketplace",
  description: "Find mentors, coaches, and professionals to help you grow. Offer your skills and earn by providing services.",
  path: "/services",
});

async function getServices(category?: string) {
  const where: Record<string, unknown> = { isActive: true, status: "active" };
  if (category && category !== "all") {
    where.category = category;
  }
  
  const services = await prisma.service.findMany({
    where,
    include: { provider: true },
    orderBy: { rating: "desc" },
  });
  return services;
}

async function getCategories() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
  });
  return services.map((s) => s.category);
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;
  const [services, categories, navbarPlans] = await Promise.all([
    getServices(category),
    getCategories(),
    getNavbarPlansData(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialPlansData={navbarPlans} />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <ServicesHeader categories={categories} selectedCategory={category} />

          {services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  title={service.title}
                  provider={{
                    firstName: service.provider.firstName,
                    lastName: service.provider.lastName,
                    avatar: service.provider.avatar,
                  }}
                  price={service.price.toString()}
                  rating={service.rating.toString()}
                  image={service.coverImage}
                  category={service.category}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <p className="text-lg">No services available yet.</p>
              <p className="mt-2">Be the first to offer your skills!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
