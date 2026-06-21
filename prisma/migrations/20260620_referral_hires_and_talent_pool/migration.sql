-- Referral Hires + Talent Pool feature
-- Tables: GuestProfile, JobReferral, UploadedCv, Application, ReferralActivityLog
-- Idempotent: safe to re-run.

-- ----------------------------------------------------------------
-- GuestProfile: lightweight profile for non-registered submitters
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "GuestProfile" (
  "id"             SERIAL PRIMARY KEY,
  "name"           TEXT NOT NULL,
  "email"          TEXT NOT NULL,
  "whatsappNumber" TEXT NOT NULL,
  "linkedinUrl"    TEXT,
  "portfolioUrl"   TEXT,
  "location"       TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "GuestProfile_email_idx" ON "GuestProfile"("email");

-- ----------------------------------------------------------------
-- JobReferral: a posted hiring opening with mandatory point of contact
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "JobReferral" (
  "id"               SERIAL PRIMARY KEY,
  "jobTitle"         TEXT NOT NULL,
  "companyName"      TEXT NOT NULL,
  "location"         TEXT NOT NULL,
  "workMode"         TEXT NOT NULL,
  "experienceRange"  TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "salaryRange"      TEXT,
  "jobLink"          TEXT,
  "lastDateToApply"  TIMESTAMP(3),
  "referralSource"   TEXT,
  "pocName"          TEXT NOT NULL,
  "pocEmail"         TEXT NOT NULL,
  "pocWhatsapp"      TEXT NOT NULL,
  "postedByUserId"   INTEGER,
  "postedByGuestId"  INTEGER,
  "status"           TEXT NOT NULL DEFAULT 'pending_review',
  "isVerified"       BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt"       TIMESTAMP(3),
  "rejectionReason"  TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobReferral_postedByUserId_fkey"
    FOREIGN KEY ("postedByUserId") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "JobReferral_postedByGuestId_fkey"
    FOREIGN KEY ("postedByGuestId") REFERENCES "GuestProfile"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "JobReferral_status_idx" ON "JobReferral"("status");
CREATE INDEX IF NOT EXISTS "JobReferral_isVerified_idx" ON "JobReferral"("isVerified");
CREATE INDEX IF NOT EXISTS "JobReferral_postedByUserId_idx" ON "JobReferral"("postedByUserId");

-- ----------------------------------------------------------------
-- UploadedCv: protected CV file pointer (GCS object path)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "UploadedCv" (
  "id"             SERIAL PRIMARY KEY,
  "userId"         INTEGER,
  "guestProfileId" INTEGER,
  "fileUrl"        TEXT NOT NULL,
  "fileName"       TEXT NOT NULL,
  "fileType"       TEXT NOT NULL,
  "uploadedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UploadedCv_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UploadedCv_guestProfileId_fkey"
    FOREIGN KEY ("guestProfileId") REFERENCES "GuestProfile"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "UploadedCv_userId_idx" ON "UploadedCv"("userId");
CREATE INDEX IF NOT EXISTS "UploadedCv_guestProfileId_idx" ON "UploadedCv"("guestProfileId");

-- ----------------------------------------------------------------
-- Application: referral application OR direct talent-pool submission
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Application" (
  "id"                     SERIAL PRIMARY KEY,
  "jobReferralId"          INTEGER,
  "userId"                 INTEGER,
  "guestProfileId"         INTEGER,
  "cvId"                   INTEGER,
  "source"                 TEXT NOT NULL,
  "applicationType"        TEXT NOT NULL DEFAULT 'referral',
  "status"                 TEXT NOT NULL DEFAULT 'applied',
  "whatsappClicked"        BOOLEAN NOT NULL DEFAULT false,
  "emailClicked"           BOOLEAN NOT NULL DEFAULT false,
  "employmentStatus"       TEXT,
  "joiningAvailability"    TEXT,
  "layoffImpacted"         BOOLEAN,
  "layoffLastWorkingMonth" TEXT,
  "opportunityPreference"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "professionalSummary"    TEXT,
  "applicationSource"      TEXT DEFAULT 'referral_opening',
  "talentStatus"           TEXT DEFAULT 'new',
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Application_jobReferralId_fkey"
    FOREIGN KEY ("jobReferralId") REFERENCES "JobReferral"("id") ON DELETE SET NULL,
  CONSTRAINT "Application_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "Application_guestProfileId_fkey"
    FOREIGN KEY ("guestProfileId") REFERENCES "GuestProfile"("id") ON DELETE SET NULL,
  CONSTRAINT "Application_cvId_fkey"
    FOREIGN KEY ("cvId") REFERENCES "UploadedCv"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "Application_jobReferralId_idx" ON "Application"("jobReferralId");
CREATE INDEX IF NOT EXISTS "Application_userId_idx" ON "Application"("userId");
CREATE INDEX IF NOT EXISTS "Application_guestProfileId_idx" ON "Application"("guestProfileId");
CREATE INDEX IF NOT EXISTS "Application_status_idx" ON "Application"("status");
CREATE INDEX IF NOT EXISTS "Application_applicationType_idx" ON "Application"("applicationType");
CREATE INDEX IF NOT EXISTS "Application_talentStatus_idx" ON "Application"("talentStatus");

-- ----------------------------------------------------------------
-- ReferralActivityLog: audit trail per application
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ReferralActivityLog" (
  "id"            SERIAL PRIMARY KEY,
  "applicationId" INTEGER NOT NULL,
  "activityType"  TEXT NOT NULL,
  "activityBy"    TEXT NOT NULL,
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralActivityLog_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ReferralActivityLog_applicationId_idx" ON "ReferralActivityLog"("applicationId");
