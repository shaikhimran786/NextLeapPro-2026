import { Metadata } from "next";

interface GenerateMetaOptions {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
}

const defaultMeta = {
  siteName: "Next Leap Pro",
  title: "Your career is bigger than one company — Next Leap Pro",
  description:
    "A professional opportunity ecosystem helping experienced professionals, returning women, students, and independent experts connect with communities, mentorship, and real opportunities to learn, earn and grow.",
  image: "/og-image.png",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://nextleappro.com",
  socialProfiles: [
    "https://twitter.com/nextleappro",
    "https://www.linkedin.com/company/nextleappro",
    "https://www.facebook.com/nextleappro"
  ],
};

export function generateMeta(options: GenerateMetaOptions = {}): Metadata {
  const title = options.title
    ? `${options.title} | ${defaultMeta.siteName}`
    : defaultMeta.title;
  const description = options.description || defaultMeta.description;
  const image = options.image || defaultMeta.image;
  const url = options.path
    ? `${defaultMeta.url}${options.path}`
    : defaultMeta.url;

  const metadata: Metadata = {
    title,
    description,
    metadataBase: new URL(defaultMeta.url),
    openGraph: {
      title,
      description,
      url,
      siteName: defaultMeta.siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: options.type || "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      site: "@nextleappro",
    },
    alternates: {
      canonical: url,
    },
    robots: options.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };

  return metadata;
}

export function generateEventStructuredData(event: {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  mode: string;
  price: number;
  currency: string;
  image?: string;
  organizerName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      event.mode === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    location:
      event.mode === "online"
        ? {
            "@type": "VirtualLocation",
            url: defaultMeta.url,
          }
        : {
            "@type": "Place",
            name: event.location,
            address: event.location,
          },
    image: event.image || defaultMeta.image,
    offers: {
      "@type": "Offer",
      price: event.price,
      priceCurrency: event.currency,
      availability: "https://schema.org/InStock",
      url: defaultMeta.url,
    },
    organizer: {
      "@type": "Organization",
      name: event.organizerName || defaultMeta.siteName,
      url: defaultMeta.url,
    },
  };
}

export function generateOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: defaultMeta.siteName,
    url: defaultMeta.url,
    logo: `${defaultMeta.url}/logos/nlp-logo-white.png`,
    description: defaultMeta.description,
    sameAs: Array.isArray((defaultMeta as any).socialProfiles) ? (defaultMeta as any).socialProfiles : [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "support@nextleappro.com",
    },
  };
}

export function generateServiceStructuredData(service: {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  image?: string;
  provider: {
    name: string;
    url?: string;
  };
  rating?: number;
  reviewCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    url: `${defaultMeta.url}/services/${service.id}`,
    image: service.image || defaultMeta.image,
    provider: {
      "@type": "Person",
      name: service.provider.name,
      url: service.provider.url || defaultMeta.url,
    },
    serviceType: service.category,
    offers: {
      "@type": "Offer",
      price: service.price,
      priceCurrency: service.currency,
      availability: "https://schema.org/InStock",
    },
    ...(service.rating && service.reviewCount && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: service.rating,
        reviewCount: service.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

export function generateCommunityStructuredData(community: {
  id: number;
  slug?: string | null;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  image?: string;
  location?: string;
}) {
  const path = community.slug ? `/communities/${community.slug}` : `/communities/${community.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${defaultMeta.url}${path}`,
    name: community.name,
    description: community.description,
    url: `${defaultMeta.url}${path}`,
    logo: community.image || `${defaultMeta.url}/logo.png`,
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      value: community.memberCount,
      unitText: "members",
    },
    keywords: community.category,
    ...(community.location && {
      location: {
        "@type": "Place",
        name: community.location,
        address: community.location,
      },
    }),
  };
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${defaultMeta.url}${item.url}`,
    })),
  };
}

export function generateWebSiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: defaultMeta.siteName,
    url: defaultMeta.url,
    description: defaultMeta.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${defaultMeta.url}/events?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export { defaultMeta };
