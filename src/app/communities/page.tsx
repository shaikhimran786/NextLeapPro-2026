import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { generateMeta } from "@/lib/metadata";
import { getNavbarPlansData } from "@/lib/get-navbar-data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CommunityListFilter } from "@/components/communities/CommunityListFilter";
import { CreateCommunityButton } from "@/components/communities/CreateCommunityButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateMeta({
  title: "Communities",
  description: "Join communities of like-minded professionals and grow together.",
  path: "/communities",
});

async function getCommunities() {
  const communities = await prisma.community.findMany({
    where: { isPublic: true },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return communities.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    shortDescription: c.shortDescription,
    logo: c.logo,
    category: c.category,
    tags: c.tags,
    location: c.location,
    mode: c.mode,
    membershipType: c.membershipType,
    memberCount: c._count.members,
  }));
}

export default async function CommunitiesPage() {
  const [communities, navbarPlans] = await Promise.all([
    getCommunities(),
    getNavbarPlansData(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialPlansData={navbarPlans} />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-heading font-bold mb-4">Communities</h1>
              <p className="text-slate-600 text-lg">
                Join communities of like-minded professionals and grow together.
              </p>
            </div>
            <CreateCommunityButton />
          </div>

          <CommunityListFilter
            communities={communities}
            categories={[...new Set(communities.map((c) => c.category))]}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
