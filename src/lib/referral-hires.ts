/**
 * Referral Hires + Talent Pool — shared constants, option lists, validation,
 * and message/branding helpers used by both client and server code.
 *
 * Keep this framework-agnostic (no server-only imports) so it can be imported
 * from React components and API routes alike.
 */

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------
export const REFERRAL_FOOTER = "Referred by Next Leap Pro Platform";

// ---------------------------------------------------------------------------
// Option lists (value + human label). Values are stored in the DB.
// ---------------------------------------------------------------------------
export type Option = { value: string; label: string };

export const WORK_MODES: Option[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

export const REFERRAL_SOURCES: Option[] = [
  { value: "self", label: "Self" },
  { value: "hr", label: "HR" },
  { value: "friend", label: "Friend" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

export const JOB_STATUSES: Option[] = [
  { value: "pending_review", label: "Pending Review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

export const APPLICATION_STATUSES: Option[] = [
  { value: "applied", label: "Applied" },
  { value: "sent_to_contact", label: "Sent to Contact" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
  { value: "closed", label: "Closed" },
];

export const EMPLOYMENT_STATUSES: Option[] = [
  { value: "currently_employed", label: "Currently Employed" },
  { value: "serving_notice", label: "Serving Notice Period" },
  { value: "open_to_opportunities", label: "Open to Opportunities" },
  { value: "freelancer", label: "Freelancer / Consultant" },
  { value: "returning", label: "Returning Professional" },
  { value: "student", label: "Student / Fresher" },
  { value: "layoff_impacted", label: "Layoff Impacted" },
];

export const JOINING_AVAILABILITY: Option[] = [
  { value: "immediate", label: "Immediate" },
  { value: "within_15", label: "Within 15 Days" },
  { value: "within_30", label: "Within 30 Days" },
  { value: "within_60", label: "Within 60 Days" },
  { value: "more_than_60", label: "More Than 60 Days" },
];

export const OPPORTUNITY_PREFERENCES: Option[] = [
  { value: "full_time", label: "Full-Time Employment" },
  { value: "contract", label: "Contract Role" },
  { value: "freelance", label: "Freelance Projects" },
  { value: "consulting", label: "Consulting Opportunities" },
  { value: "startup", label: "Startup Opportunities" },
  { value: "remote", label: "Remote Work" },
  { value: "hybrid", label: "Hybrid Work" },
  { value: "community", label: "Community Referrals" },
];

export const APPLICATION_SOURCES: Option[] = [
  { value: "referral_opening", label: "Referral Opening" },
  { value: "direct_submission", label: "Direct Submission" },
  { value: "community_event", label: "Community Event" },
  { value: "whatsapp_group", label: "WhatsApp Group" },
  { value: "partner_referral", label: "Partner Referral" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
];

export const TALENT_STATUSES: Option[] = [
  { value: "new", label: "New" },
  { value: "under_review", label: "Under Review" },
  { value: "referred", label: "Referred" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "selected", label: "Selected" },
  { value: "on_hold", label: "On Hold" },
  { value: "archived", label: "Archived" },
];

export function labelFor(options: Option[], value: string | null | undefined): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

export function isValidOption(options: Option[], value: string | null | undefined): boolean {
  if (value == null || value === "") return false;
  return options.some((o) => o.value === value);
}

// ---------------------------------------------------------------------------
// CV file rules
// ---------------------------------------------------------------------------
export const CV_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const CV_ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"] as const;
export const CV_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function isAllowedCvFile(fileName: string, mimeType?: string): boolean {
  const ext = getFileExtension(fileName);
  const extOk = (CV_ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
  // Some browsers report empty/odd mime types; accept when extension is valid.
  const mimeOk = !mimeType || CV_ALLOWED_MIME_TYPES.includes(mimeType) || mimeType === "application/octet-stream";
  return extOk && mimeOk;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Digits only, 8-15 (E.164-ish). Strips spaces, dashes, parentheses, leading +. */
export function isValidWhatsapp(value: string): boolean {
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/** Normalize a phone/WhatsApp number to digits only for use in wa.me links. */
export function normalizeWhatsapp(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Basic input sanitization: trim, strip control chars and angle brackets to
 * neutralize stored-XSS vectors, and clamp length. Not a substitute for
 * output encoding, but a sensible defense-in-depth default for stored text.
 */
export function sanitizeText(value: unknown, maxLength = 2000): string {
  if (typeof value !== "string") return "";
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

// ---------------------------------------------------------------------------
// Referral message + send link builders
// ---------------------------------------------------------------------------
export function buildReferralMessage(jobTitle: string, companyName: string): string {
  return (
    `Hi, I found this opportunity on Next Leap Pro and would like to apply for the ${jobTitle} role at ${companyName}. ` +
    `Please find my profile and CV attached/shared.\n\n` +
    `${REFERRAL_FOOTER}`
  );
}

export function buildWhatsappLink(pocWhatsapp: string, message: string): string {
  const number = normalizeWhatsapp(pocWhatsapp);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildMailtoLink(pocEmail: string, jobTitle: string, companyName: string, message: string): string {
  const subject = `Application for ${jobTitle} at ${companyName} — via Next Leap Pro`;
  return `mailto:${pocEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
