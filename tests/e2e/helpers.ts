import { BrowserContext, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

export const prisma = new PrismaClient();

export interface TestUser {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  sessionToken: string;
}

const trackedUserIds = new Set<number>();
const trackedCommunityIds = new Set<number>();

/**
 * Register a brand-new user via the public registration API and return the
 * user along with the session token created by the server. This guarantees
 * the test exercises the same auth path real users do.
 */
export async function registerTestUser(
  apiBaseURL: string,
  overrides: Partial<{ firstName: string; lastName: string }> = {},
): Promise<TestUser> {
  const id = nanoid(8).toLowerCase();
  const email = `e2e-${id}@example.test`;
  const password = "Password!2345";
  const firstName = overrides.firstName ?? `E2E${id}`;
  const lastName = overrides.lastName ?? "Tester";

  const res = await fetch(`${apiBaseURL}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ firstName, lastName, email, password }),
  });
  if (!res.ok) {
    throw new Error(`Failed to register user: ${res.status} ${await res.text()}`);
  }
  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = /session=([^;]+)/.exec(setCookie);
  if (!match) {
    throw new Error(`Registration did not return a session cookie: ${setCookie}`);
  }
  const sessionToken = match[1];

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { email } });
  trackedUserIds.add(dbUser.id);

  return {
    id: dbUser.id,
    email,
    password,
    firstName,
    lastName,
    sessionToken,
  };
}

/**
 * Attach the session cookie returned by /api/auth/register to a Playwright
 * browser context so subsequent navigations are authenticated.
 */
export async function attachSession(
  context: BrowserContext,
  sessionToken: string,
  baseURL: string,
) {
  const url = new URL(baseURL);
  await context.addCookies([
    {
      name: "session",
      value: sessionToken,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

export interface TestCommunityOptions {
  membershipType?: "open" | "approval" | "invite";
  isPublic?: boolean;
  category?: string;
  ownerId?: number | null;
}

/**
 * Create a community directly via Prisma so tests can pin membershipType,
 * isPublic, etc. without depending on the create UI.
 */
export async function createTestCommunity(
  options: TestCommunityOptions = {},
): Promise<{ id: number; name: string; slug: string | null; membershipType: string; isPublic: boolean }> {
  const id = nanoid(10).toLowerCase();
  const membershipType = options.membershipType ?? "open";
  const isPublic = options.isPublic ?? true;
  const name = `E2E Community ${id}`;
  const slug = `e2e-community-${id}`;

  const community = await prisma.community.create({
    data: {
      name,
      slug,
      description: `Auto-created community for the e2e join/leave suite (${id}).`,
      logo: "/community-logo.png",
      category: options.category ?? "Technology",
      tags: ["e2e", "automation"],
      mode: "online",
      membershipType,
      isPublic,
      creatorId: options.ownerId ?? null,
      createdByAdmin: true,
    },
  });
  trackedCommunityIds.add(community.id);
  return {
    id: community.id,
    name: community.name,
    slug: community.slug,
    membershipType: community.membershipType,
    isPublic: community.isPublic,
  };
}

export async function getMembership(communityId: number, userId: number) {
  return prisma.communityMember.findFirst({ where: { communityId, userId } });
}

/**
 * Tear down everything this run created so the dev DB stays clean and tests
 * remain idempotent across reruns.
 */
export async function cleanupTestData() {
  if (trackedUserIds.size === 0 && trackedCommunityIds.size === 0) return;
  const userIds = Array.from(trackedUserIds);
  const communityIds = Array.from(trackedCommunityIds);

  try {
    await prisma.communityMember.deleteMany({
      where: {
        OR: [
          userIds.length > 0 ? { userId: { in: userIds } } : { id: -1 },
          communityIds.length > 0 ? { communityId: { in: communityIds } } : { id: -1 },
        ],
      },
    });
    await prisma.adminAuditLog.deleteMany({
      where: userIds.length > 0 ? { userId: { in: userIds } } : { id: -1 },
    });
    if (communityIds.length > 0) {
      await prisma.community.deleteMany({ where: { id: { in: communityIds } } });
    }
    if (userIds.length > 0) {
      await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  } finally {
    trackedUserIds.clear();
    trackedCommunityIds.clear();
  }
}

export async function disconnect() {
  await prisma.$disconnect();
}

/**
 * Scroll a community card into view on /communities. The listing is paginated
 * with infinite-scroll/virtualisation, so freshly-created communities may not
 * appear without nudging the page. We poll up to N attempts.
 */
export async function ensureCardVisible(page: import("@playwright/test").Page, communityId: number) {
  const cardSelector = `[data-testid="community-card-${communityId}"]`;
  for (let i = 0; i < 12; i++) {
    const handle = await page.$(cardSelector);
    if (handle) {
      await handle.scrollIntoViewIfNeeded();
      break;
    }
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(400);
  }
  await expect(page.locator(cardSelector)).toBeVisible();
  // Wait for client-side hydration: CTA only renders once `isMounted` flips.
  await expect(page.locator(`[data-testid="cta-community-${communityId}"]`)).toBeVisible({
    timeout: 60_000,
  });
}
