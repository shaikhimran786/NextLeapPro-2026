import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { generateMeta } from "@/lib/metadata";
import { getNavbarPlansData } from "@/lib/get-navbar-data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CommunityCard } from "@/components/shared/CommunityCard";
import { CreateCommunityButton } from "@/components/communities/CreateCommunityButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateMeta({
  title: "Communities",
  description: "Join communities of like-minded professionals and grow together.",
  path: "/communities",
});

async function getCommunities() {
  const communities = await prisma.community.findMany({
    include: { members: true },
    orderBy: { createdAt: "desc" },
  });
  return communities.map((c) => ({
    ...c,
    memberCount: c.members.length,
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

          {communities.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {communities.map((community) => (
                <CommunityCard
                  key={community.id}
                  id={community.id}
                  name={community.name}
                  description={community.description}
                  logo={community.logo}
                  category={community.category}
                  memberCount={community.memberCount}
                  location={community.location}
                  tags={community.tags}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <p className="text-lg">No communities yet.</p>
              <p className="mt-2">Be the first to create one!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
