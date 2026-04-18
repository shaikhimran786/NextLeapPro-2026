-- Add owner-controlled profile image column
ALTER TABLE "Community" ADD COLUMN IF NOT EXISTS "profileImage" TEXT;

-- Persisted alias table to keep old slugs working after a rename (308 redirect target)
CREATE TABLE IF NOT EXISTS "CommunitySlugAlias" (
  "id" SERIAL PRIMARY KEY,
  "oldSlug" TEXT NOT NULL,
  "communityId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunitySlugAlias_community_fkey"
    FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommunitySlugAlias_oldSlug_key" ON "CommunitySlugAlias"("oldSlug");
CREATE INDEX IF NOT EXISTS "CommunitySlugAlias_communityId_idx" ON "CommunitySlugAlias"("communityId");
