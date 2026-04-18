import { test, expect, Page } from "@playwright/test";
import {
  attachSession,
  cleanupTestData,
  createTestCommunity,
  disconnect,
  ensureCardVisible,
  getMembership,
  registerTestUser,
  TestUser,
} from "./helpers";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5000";

let user: TestUser;

test.beforeAll(async () => {
  user = await registerTestUser(BASE_URL);
});

test.afterAll(async () => {
  await cleanupTestData();
  await disconnect();
});

test.beforeEach(async ({ context }) => {
  await attachSession(context, user.sessionToken, BASE_URL);
});

async function searchCommunity(page: Page, name: string) {
  const search = page.locator('input[placeholder*="Search" i]').first();
  await search.click();
  await search.fill("");
  await search.type(name, { delay: 10 });
}

test("logged-in user joins an open community from the listing card and CTA flips to Open Community", async ({ page }) => {
  const community = await createTestCommunity({ membershipType: "open", isPublic: true });

  await page.goto("/communities");
  await searchCommunity(page, community.name);
  await ensureCardVisible(page, community.id);

  const cta = page.locator(`[data-testid="cta-community-${community.id}"]`);
  await expect(cta).toBeVisible();
  await expect(cta).toContainText(/Join Community/i);

  await cta.click();

  // Optimistic update should flip the CTA without a full page reload.
  await expect(cta).toContainText(/Open Community/i, { timeout: 15_000 });
  await expect(page.locator(`[data-testid="badge-membership-${community.id}"]`)).toContainText(/Joined/i);

  // Persisted in DB.
  const membership = await getMembership(community.id, user.id);
  expect(membership).not.toBeNull();
  expect(membership?.role).toBe("member");

  // Survives a hard reload.
  await page.reload();
  await searchCommunity(page, community.name);
  await ensureCardVisible(page, community.id);
  await expect(page.locator(`[data-testid="cta-community-${community.id}"]`)).toContainText(/Open Community/i);
});

test("joining an approval community shows Request Pending optimistically and persists", async ({ page }) => {
  const community = await createTestCommunity({ membershipType: "approval", isPublic: true });

  await page.goto("/communities");
  await searchCommunity(page, community.name);
  await ensureCardVisible(page, community.id);

  const cta = page.locator(`[data-testid="cta-community-${community.id}"]`);
  await expect(cta).toContainText(/Request to Join/i);

  await cta.click();
  await expect(cta).toContainText(/Request Pending/i, { timeout: 15_000 });
  await expect(cta).toBeDisabled();
  await expect(page.locator(`[data-testid="badge-membership-${community.id}"]`)).toContainText(/Pending/i);

  const membership = await getMembership(community.id, user.id);
  expect(membership?.role).toBe("pending");

  // Persists across reload.
  await page.reload();
  await searchCommunity(page, community.name);
  await ensureCardVisible(page, community.id);
  const ctaAfter = page.locator(`[data-testid="cta-community-${community.id}"]`);
  await expect(ctaAfter).toContainText(/Request Pending/i);
  await expect(ctaAfter).toBeDisabled();
});

test("invite-only community shows a disabled Invite Only CTA and the API rejects join with 403", async ({ page, request }) => {
  const community = await createTestCommunity({ membershipType: "invite", isPublic: true });

  await page.goto("/communities");
  await searchCommunity(page, community.name);
  await ensureCardVisible(page, community.id);

  const cta = page.locator(`[data-testid="cta-community-${community.id}"]`);
  await expect(cta).toContainText(/Invite Only/i);
  await expect(cta).toBeDisabled();

  // Direct API call must be rejected even with a valid session.
  const apiRes = await request.post(`${BASE_URL}/api/communities/${community.id}/join`, {
    headers: { cookie: `session=${user.sessionToken}` },
    data: {},
  });
  expect(apiRes.status()).toBe(403);
  const body = await apiRes.json();
  expect(String(body.error || "")).toMatch(/invite-only/i);

  // No membership row was created.
  const membership = await getMembership(community.id, user.id);
  expect(membership).toBeNull();
});

test("leaving a community via the detail page button removes membership and updates the card on /communities", async ({ page, context }) => {
  const community = await createTestCommunity({ membershipType: "open", isPublic: true });

  // Pre-seed membership so the test focuses on the leave flow.
  await (await import("./helpers")).prisma.communityMember.create({
    data: { communityId: community.id, userId: user.id, role: "member" },
  });

  await page.goto(`/communities/${community.id}`);
  await expect(page.locator('[data-testid="text-community-name"]')).toContainText(community.name);

  const leaveButton = page.locator('[data-testid="button-leave-community"]').first();
  await expect(leaveButton).toBeVisible();
  await expect(leaveButton).toBeEnabled();
  await leaveButton.click();

  // The leave button opens an AlertDialog; the actual API call only fires
  // after the user confirms inside the dialog.
  const confirmLeave = page.locator('[data-testid="button-confirm-leave-community"]');
  await expect(confirmLeave).toBeVisible();
  await confirmLeave.click();

  // Wait for the membership to be removed in the database.
  await expect.poll(
    async () => (await getMembership(community.id, user.id)) === null,
    { timeout: 15_000 },
  ).toBe(true);

  // Card on the listing should now show the join CTA again.
  await page.goto("/communities");
  await searchCommunity(page, community.name);
  await ensureCardVisible(page, community.id);
  const cta = page.locator(`[data-testid="cta-community-${community.id}"]`);
  await expect(cta).toContainText(/Join Community/i);
  await expect(page.locator(`[data-testid="badge-membership-${community.id}"]`)).toHaveCount(0);
});
