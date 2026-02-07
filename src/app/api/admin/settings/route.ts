import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";

export async function GET() {
  try {
    let settings = await prisma.siteSettings.findFirst();
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {},
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await request.json();
    
    const settings = await prisma.siteSettings.upsert({
      where: { id: data.id || 1 },
      update: {
        siteName: data.siteName,
        slogan: data.slogan,
        defaultCurrency: data.defaultCurrency,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        heroCTA: data.heroCTA,
        heroImage: data.heroImage,
        heroAnimation: data.heroAnimation,
        heroGradients: data.heroGradients,
        footerHtml: data.footerHtml,
        analyticsEnabled: data.analyticsEnabled,
        logoLight: data.logoLight,
        logoDark: data.logoDark,
        footerLogo: data.footerLogo,
        adminLogo: data.adminLogo,
        favicons: data.favicons,
        socialLinks: data.socialLinks,
        paymentEnabled: data.paymentEnabled,
        paymentTestMode: data.paymentTestMode,
      },
      create: {
        siteName: data.siteName || "Next Leap Pro",
        slogan: data.slogan || "Learn, Earn, and Grow",
        defaultCurrency: data.defaultCurrency || "INR",
        heroTitle: data.heroTitle || "Learn. Earn. And Grow.",
        heroSubtitle: data.heroSubtitle || "",
        heroCTA: data.heroCTA || "Get Started",
        heroImage: data.heroImage,
        heroAnimation: data.heroAnimation || { type: "fade", duration: 0.8, delay: 0.1, stagger: 0.15, easing: "easeOut", loop: false },
        heroGradients: data.heroGradients || { source: "brand", angle: 90, learn: ["#E8348A", "#FF66B2"], earn: ["#007BFF", "#00A6FF"], grow: ["#28A745", "#6BE07B"] },
        footerHtml: data.footerHtml,
        analyticsEnabled: data.analyticsEnabled ?? true,
        logoLight: data.logoLight || "/logos/logo-light.png",
        logoDark: data.logoDark || "/logos/logo-dark.png",
        footerLogo: data.footerLogo || "/logos/logo-light.png",
        adminLogo: data.adminLogo || "/logos/logo-dark.png",
        favicons: data.favicons || {},
        socialLinks: data.socialLinks || [],
        paymentEnabled: data.paymentEnabled ?? true,
        paymentTestMode: data.paymentTestMode ?? true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
