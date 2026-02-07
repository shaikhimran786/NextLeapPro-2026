import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nextleappro.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/admin/*",
          "/api/",
          "/api/*",
          "/auth/",
          "/auth/*",
          "/dashboard/",
          "/dashboard/*",
          "/profile/edit",
          "/_next/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/events/", "/services/", "/communities/"],
        disallow: ["/admin/", "/api/", "/auth/", "/dashboard/", "/profile/edit"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/", "/events/", "/services/", "/communities/"],
        disallow: ["/admin/", "/api/", "/auth/", "/dashboard/", "/profile/edit"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
