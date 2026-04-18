-- Make Community.slug nullable so admins can reset to default (numeric) URL
ALTER TABLE "Community" ALTER COLUMN "slug" DROP NOT NULL;

-- Per-community audit log for admin/owner field changes and lifecycle events.
-- communityId is nullable + ON DELETE SET NULL so delete events survive after
-- the community row is removed; the snapshot columns preserve the target name.
CREATE TABLE IF NOT EXISTS "CommunityAuditLog" (
  "id" SERIAL PRIMARY KEY,
  "communityId" INTEGER,
  "communityName" TEXT NOT NULL,
  "communitySlug" TEXT,
  "actorUserId" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "field" TEXT,
  "oldValue" TEXT,
  "newValue" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityAuditLog_community_fkey"
    FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL,
  CONSTRAINT "CommunityAuditLog_actor_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "CommunityAuditLog_communityId_createdAt_idx"
  ON "CommunityAuditLog"("communityId", "createdAt");
CREATE INDEX IF NOT EXISTS "CommunityAuditLog_createdAt_idx"
  ON "CommunityAuditLog"("createdAt");
