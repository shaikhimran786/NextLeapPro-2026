import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    console.error("Error fetching site settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch site settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      siteName,
      slogan,
      defaultCurrency,
      primaryGradient,
      heroTitle,
      heroSubtitle,
      heroCTA,
      heroImage,
      footerHtml,
      analyticsEnabled,
      seoDefaults,
    } = body;

    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          ...(siteName !== undefined && { siteName }),
          ...(slogan !== undefined && { slogan }),
          ...(defaultCurrency !== undefined && { defaultCurrency }),
          ...(primaryGradient !== undefined && { primaryGradient }),
          ...(heroTitle !== undefined && { heroTitle }),
          ...(heroSubtitle !== undefined && { heroSubtitle }),
          ...(heroCTA !== undefined && { heroCTA }),
          ...(heroImage !== undefined && { heroImage }),
          ...(footerHtml !== undefined && { footerHtml }),
          ...(analyticsEnabled !== undefined && { analyticsEnabled }),
          ...(seoDefaults !== undefined && { seoDefaults }),
        },
      });
    } else {
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: {
          ...(siteName !== undefined && { siteName }),
          ...(slogan !== undefined && { slogan }),
          ...(defaultCurrency !== undefined && { defaultCurrency }),
          ...(primaryGradient !== undefined && { primaryGradient }),
          ...(heroTitle !== undefined && { heroTitle }),
          ...(heroSubtitle !== undefined && { heroSubtitle }),
          ...(heroCTA !== undefined && { heroCTA }),
          ...(heroImage !== undefined && { heroImage }),
          ...(footerHtml !== undefined && { footerHtml }),
          ...(analyticsEnabled !== undefined && { analyticsEnabled }),
          ...(seoDefaults !== undefined && { seoDefaults }),
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating site settings:", error);
    return NextResponse.json(
      { error: "Failed to update site settings" },
      { status: 500 }
    );
  }
}
