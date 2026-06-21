# Referral Hires + Talent Pool

Community-powered referral hiring and a standalone talent pool for Next Leap Pro.

## One required step before it runs

The Prisma client has already been regenerated (so `prisma.jobReferral` etc. exist).
You only need to create the new tables in your database. From the project root:

```bash
npx prisma db push
```

(Alternatively apply `prisma/migrations/20260620_referral_hires_and_talent_pool/migration.sql`
directly to your Neon database — it is idempotent.)

Then restart the dev server. That's it.

> The database push could not be done from the build environment because it has no
> network route to your Neon host. `db push` from your machine works normally.

## Public pages

| Route | Purpose |
|---|---|
| `/referral-hires` | Landing + verified openings list. CTAs: Share an Opening, Apply Now, Join Talent Network. |
| `/referral-hires/share` | Multi-step Share Opening form (Job Details → Contact Details → Preview & Submit). |
| `/referral-hires/apply/[id]` | Apply to a verified opening (Confirm Profile → CV & Details → Review & Apply), then WhatsApp/Email send. |
| `/talent-pool` | Standalone Submit Your Profile / Join Talent Network (direct submission, referral id is null). |

## Admin pages (under `/admin/referral-hires`)

- **Posted Openings** — verify / reject / expire / edit / delete, verified-badge status, application counts, POC details.
- **Submitted CVs** — view / download CV (gated), contact candidate, mark shortlisted / referred / closed.
- **Referral Connections** — candidate → opening → posted by → point of contact, with WhatsApp/email/CV tracking and referral status.
- **Talent Pool** — all candidates with smart filters (immediate joiners, layoff impacted, notice period, freelancers, consultants, startup interested, location, search) and the candidate status workflow.

## Key behaviours

- New openings save as **Pending Review**; the **Verified badge** appears only after an admin verifies.
- Registered users **auto-fill** name/email/WhatsApp/LinkedIn and can **reuse their existing CV** — no duplicate data entry.
- Guests submit with the minimum (name, email, WhatsApp, CV; location for talent pool).
- Every referral message and surface includes **"Referred by Next Leap Pro Platform"** with the logo (`ReferralBrandingFooter`).
- Auto-generated apply message + one-tap **WhatsApp** (`wa.me`) and **Email** (`mailto`) send, with click tracking.

## Security / privacy

- Admin routes guarded by `checkAdminAccess` (admin session + admin role).
- Point-of-contact email/WhatsApp are **never** in public listings — revealed only after a candidate applies.
- CV files are uploaded to GCS (signed URL) and served only through the **admin-only gated download route**, never the public `/objects` URL in the UI.
- Server-side Zod validation, input sanitization, email/WhatsApp/URL validation, CV type (PDF/DOC/DOCX) + 5 MB size limit, and a per-IP rate limit on submissions.

## Data model (added to `prisma/schema.prisma`)

`GuestProfile`, `JobReferral`, `UploadedCv`, `Application` (carries the talent-intake fields:
employment status, joining availability, layoff impact, opportunity preferences, professional
summary, application source, talent status), and `ReferralActivityLog`.

## Object storage env (already used by the platform)

`PRIVATE_OBJECT_DIR` and the Replit object-storage sidecar power CV uploads, same as the
existing image upload pipeline. No new env vars are required.
