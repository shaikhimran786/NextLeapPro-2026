#!/bin/bash
set -e

npm install --legacy-peer-deps
npx prisma generate

# Apply any pending Prisma schema changes to the database. Without this the
# generated client gets ahead of the actual DB after a merge that adds columns
# or tables (e.g. Community.profileImage, CommunityAuditLog, CommunitySlugAlias),
# which made every Community query fail with "column does not exist" and broke
# the admin Communities pages with HTTP 500s.
if [ -n "$DATABASE_URL" ]; then
  npx prisma db push --skip-generate
else
  echo "post-merge: DATABASE_URL not set, skipping prisma db push"
fi
