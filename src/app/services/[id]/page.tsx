import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { generateMeta, generateServiceStructuredData, generateBreadcrumbStructuredData } from "@/lib/metadata";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ServiceDetailContent } from "./ServiceDetailContent";
import { checkPremiumStatus } from "@/lib/auth-utils";

export const revalidate = 300; // 5-minute ISR

export async function generateStaticParams() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: { id: true },
    take: 50,
    orderBy: { createdAt: "desc" },
  });
  return services.map((service) => ({ id: service.id.toString() }));
}

type PageParams = Promise<{ id: string }>;

const getService = cache(async (id: number) => {
  const service = await prisma.service.findUnique({
    where: { id, isActive: true },
    include: {
      provider: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          email: true,
          handle: true,
          skills: true,
          socialLinks: true,
          isPublished: true,
        },
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  return service;
});

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const resolvedParams = await params;
  const numericId = parseInt(resolvedParams.id, 10);
  if (isNaN(numericId)) {
    return generateMeta({ title: "Service Not Found", path: "/services" });
  }
  const service = await getService(numericId);
  if (!service) {
    return generateMeta({ title: "Service Not Found", path: "/services" });
  }
  return generateMeta({
    title: service.title,
    description: service.description.substring(0, 160),
    path: `/services/${service.id}`,
  });
}

export default async function ServiceDetailPage({ params }: { params: PageParams }) {
  const resolvedParams = await params;
  const serviceId = parseInt(resolvedParams.id, 10);
  
  if (isNaN(serviceId)) {
    notFound();
  }

  const service = await getService(serviceId);

  if (!service) {
    notFound();
  }

  const isPremium = await checkPremiumStatus();

  const serviceData = {
    id: service.id,
    title: service.title,
    description: service.description,
    coverImage: service.coverImage,
    category: service.category,
    tags: service.tags,
    skills: service.skills,
    price: service.price.toString(),
    currency: service.currency,
    deliveryType: service.deliveryType,
    availability: service.availability,
    rating: service.rating.toString(),
    reviewCount: service.reviewCount,
    createdAt: service.createdAt.toISOString(),
    provider: {
      id: service.provider.id,
      firstName: service.provider.firstName,
      lastName: service.provider.lastName,
      avatar: service.provider.avatar,
      bio: service.provider.bio,
      email: isPremium ? service.provider.email : null,
      handle: service.provider.handle,
      skills: service.provider.skills,
      socialLinks: isPremium ? (service.provider.socialLinks as Record<string, string> | null) : null,
      isPublished: service.provider.isPublished,
    },
    reviews: service.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      reviewer: {
        firstName: review.reviewer.firstName,
        lastName: review.reviewer.lastName,
        avatar: review.reviewer.avatar,
      },
    })),
    isPremiumUser: isPremium,
  };

  const structuredData = generateServiceStructuredData({
    id: service.id,
    title: service.title,
    description: service.description,
    price: Number(service.price),
    currency: service.currency,
    category: service.category,
    image: service.coverImage || undefined,
    provider: {
      name: `${service.provider.firstName} ${service.provider.lastName}`,
      url: service.provider.handle ? `/u/${service.provider.handle}` : undefined,
    },
    rating: Number(service.rating),
    reviewCount: service.reviewCount,
  });

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "Services", url: "/services" },
    { name: service.title, url: `/services/${service.id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([structuredData, breadcrumbData]) }}
      />
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow py-8">
          <ServiceDetailContent service={serviceData} />
        </main>
        <Footer />
      </div>
    </>
  );
}
