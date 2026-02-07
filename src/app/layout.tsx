import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers/Providers";
import { generateMeta, generateOrganizationStructuredData, generateWebSiteStructuredData } from "@/lib/metadata";
import prisma from "@/lib/prisma";
import { getUserStatusServer } from "@/lib/get-user-status-server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

interface Favicon {
  size: string;
  url: string;
}

interface SiteSettingsWithExtras {
  favicons?: Favicon[];
}

let cachedSettings: { data: SiteSettingsWithExtras | null; timestamp: number } | null = null;
const SETTINGS_CACHE_TTL = 5 * 60 * 1000;

async function getSiteSettings(): Promise<SiteSettingsWithExtras | null> {
  try {
    const now = Date.now();
    
    if (cachedSettings && (now - cachedSettings.timestamp) < SETTINGS_CACHE_TTL) {
      return cachedSettings.data;
    }
    
    const settings = await prisma.siteSettings.findFirst();
    cachedSettings = { 
      data: settings as unknown as SiteSettingsWithExtras, 
      timestamp: now 
    };
    return cachedSettings.data;
  } catch (error) {
    console.error("Failed to fetch site settings for layout:", error);
    return cachedSettings?.data || null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const baseMeta = generateMeta();
  
  const favicons: Favicon[] = Array.isArray(settings?.favicons) 
    ? settings.favicons
    : [];
  
  const icons: Metadata["icons"] = {
    icon: favicons
      .filter((f: Favicon) => f.url && ["16x16", "32x32", "192x192", "512x512"].includes(f.size))
      .map((f: Favicon) => ({
        url: f.url,
        sizes: f.size,
        type: "image/png",
      })),
    apple: favicons
      .filter((f: Favicon) => f.url && f.size === "180x180")
      .map((f: Favicon) => ({
        url: f.url,
        sizes: f.size,
        type: "image/png",
      })),
  };

  if (favicons.length === 0) {
    icons.icon = [{ url: "/favicon.ico" }];
    icons.apple = [{ url: "/apple-touch-icon.png", sizes: "180x180" }];
  }

  return {
    ...baseMeta,
    icons,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = generateOrganizationStructuredData();
  const websiteSchema = generateWebSiteStructuredData();
  const combinedSchemas = [organizationSchema, websiteSchema];
  const schemaString = JSON.stringify(combinedSchemas);
  
  const initialUserStatus = await getUserStatusServer();

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers initialUserStatus={initialUserStatus}>
          {children}
          <Toaster />
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: schemaString,
          }}
        />
      </body>
    </html>
  );
}
