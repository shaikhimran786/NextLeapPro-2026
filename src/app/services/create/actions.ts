"use server";

import prisma from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-utils";

interface CreateServiceInput {
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryType: string;
  availability?: string;
  coverImage: string;
  skills: string[];
  tags: string[];
}

export async function createService(input: CreateServiceInput) {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return { success: false, error: "You must be logged in to create a service" };
  }

  try {
    const service = await prisma.service.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        price: input.price,
        currency: "INR",
        deliveryType: input.deliveryType,
        availability: input.availability || null,
        coverImage: input.coverImage,
        skills: input.skills,
        tags: input.tags,
        providerId: userId,
        status: "active",
        isActive: true,
      },
    });

    return { success: true, serviceId: service.id };
  } catch (error) {
    console.error("Failed to create service:", error);
    return { success: false, error: "Failed to create service. Please try again." };
  }
}

export async function getMyServices() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return [];
  }

  try {
    const services = await prisma.service.findMany({
      where: { providerId: userId },
      orderBy: { createdAt: "desc" },
    });

    return services.map((service) => ({
      id: service.id,
      title: service.title,
      category: service.category,
      price: service.price.toString(),
      rating: service.rating.toString(),
      reviewCount: service.reviewCount,
      status: service.status,
      isActive: service.isActive,
      createdAt: service.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return [];
  }
}

export async function updateServiceStatus(serviceId: number, isActive: boolean) {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, providerId: userId },
    });

    if (!service) {
      return { success: false, error: "Service not found or you don't have permission" };
    }

    await prisma.service.update({
      where: { id: serviceId },
      data: { isActive },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update service status:", error);
    return { success: false, error: "Failed to update service status" };
  }
}
