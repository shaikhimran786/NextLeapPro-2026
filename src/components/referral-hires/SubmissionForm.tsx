"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  MessageCircle,
  Mail,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Building2,
  Briefcase,
  Send,
  Copy,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { CvUploader, UploadedCvInfo } from "./CvUploader";
import { ReferralBrandingFooter } from "./ReferralBrandingFooter";
import {
  EMPLOYMENT_STATUSES,
  JOINING_AVAILABILITY,
  OPPORTUNITY_PREFERENCES,
  labelFor,
  WORK_MODES,
  isValidEmail,
  isValidWhatsapp,
} from "@/lib/referral-hires";

export interface OpeningContext {
  id: number;
  jobTitle: string;
  companyName: string;
  location: string;
  workMode: string;
  experienceRange: string;
  salaryRange?: string | null;
  pocName?: string | null;
}

interface Prefill {
  userId: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsappNumber: string;
  linkedinUrl: string;
  existingCv: { id: number; fileName: string; uploadedAt: string } | null;
}

interface SubmissionResult {
  applicationId: number;
  type: string;
  successMessage: string;
  message?: string;
  poc?: { name: string; email: string; whatsapp: string };
  whatsappLink?: string;
  mailtoLink?: string;
}

const STEP_LABELS_REFERRAL = ["Confirm Profile", "CV & Details", "Review & Apply"];
const STEP_LABELS_TALENT = ["Your Profile", "CV & Preferences", "Review & Submit"];

export function SubmissionForm({
  mode,
  opening,
}: {
  mode: "referral" | "talent";
  opening?: OpeningContext;
}) {
  const router = useRouter();
  const stepLabels = mode === "referral" ? STEP_LABELS_REFERRAL : STEP_LABELS_TALENT;

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  // form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedin] = useState("");
  const [portfolioUrl, setPortfolio] = useState("");

  // cv
  const [cv, setCv] = useState<UploadedCvInfo | null>(null);
  const [reuseExisting, setReuseExisting] = useState(false);

  // candidate intelligence
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [joiningAvailability, setJoiningAvailability] = useState("");
  const [layoffImpacted, setLayoffImpacted] = useState<"" | "yes" | "no">("");
  const [layoffLastWorkingMonth, setLayoffMonth] = useState("");
  const [opportunityPreference, setPrefs] = useState<string[]>([]);
  const [professionalSummary, setSummary] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/referral-hires/me")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setAuthenticated(Boolean(data.authenticated));
        if (data.prefill) {
          const p = data.prefill as Prefill;
          setPrefill(p);
          setName(p.name);
          setEmail(p.email);
          setWhatsapp(p.whatsappNumber);
          setLinkedin(p.linkedinUrl);
          if (p.existingCv) setReuseExisting(true);
        }
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const hasCv = reuseExisting ? Boolean(prefill?.existingCv) : Boolean(cv);

  function togglePref(value: string) {
    setPrefs((cur) =>
      cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]
    );
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (!authenticated) {
        if (!name.trim()) return "Please enter your full name.";
        if (!isValidEmail(email)) return "Please enter a valid email.";
        if (!isValidWhatsapp(whatsappNumber)) return "Please enter a valid WhatsApp number.";
        if (mode === "talent" && !location.trim()) return "Please enter your current location.";
      }
    }
    if (current === 1) {
      if (!hasCv) return "Please upload your CV (or reuse your existing one).";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, stepLabels.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    for (let i = 0; i < stepLabels.length - 1; i++) {
      const err = validateStep(i);
      if (err) {
        toast.error(err);
        setStep(i);
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        jobReferralId: mode === "referral" ? opening?.id : undefined,
        applicationSource: mode === "talent" ? "direct_submission" : "referral_opening",
        employmentStatus: employmentStatus || undefined,
        joiningAvailability: joiningAvailability || undefined,
        layoffImpacted: layoffImpacted ? layoffImpacted === "yes" : undefined,
        layoffLastWorkingMonth:
          layoffImpacted === "yes" && layoffLastWorkingMonth ? layoffLastWorkingMonth : undefined,
        opportunityPreference,
        professionalSummary: professionalSummary || undefined,
      };
      if (!authenticated) {
        payload.name = name;
        payload.email = email;
        payload.whatsappNumber = whatsappNumber;
        payload.location = location;
        payload.linkedinUrl = linkedinUrl || undefined;
        payload.portfolioUrl = portfolioUrl || undefined;
      }
      if (reuseExisting && prefill?.existingCv) {
        payload.existingCvId = prefill.existingCv.id;
      } else if (cv) {
        payload.cv = cv;
      }

      const res = await fetch("/api/referral-hires/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setResult(data as SubmissionResult);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function trackAndOpen(channel: "whatsapp" | "email", link: string) {
    if (result?.applicationId) {
      fetch(`/api/referral-hires/applications/${result.applicationId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      }).catch(() => {});
    }
    if (channel === "whatsapp") {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = link;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  // ---- Post-submit result screen ----
  if (result) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-5 p-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="text-emerald-600" size={30} />
            </div>
          </div>
          <h2 className="text-xl font-bold">
            {mode === "referral" ? "Application saved" : "You're in the Talent Pool"}
          </h2>
          <p className="text-sm text-muted-foreground">{result.successMessage}</p>

          {mode === "referral" && result.poc && (
            <div className="space-y-4 text-left">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Hiring contact
                </p>
                <p className="text-sm font-semibold">{result.poc.name}</p>
              </div>

              {result.message && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Your message
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={() => {
                        navigator.clipboard?.writeText(result.message || "");
                        toast.success("Message copied.");
                      }}
                    >
                      <Copy size={13} /> Copy
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground/80">{result.message}</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {result.whatsappLink && (
                  <Button
                    type="button"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => trackAndOpen("whatsapp", result.whatsappLink!)}
                  >
                    <MessageCircle size={18} /> Send on WhatsApp
                  </Button>
                )}
                {result.mailtoLink && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => trackAndOpen("email", result.mailtoLink!)}
                  >
                    <Mail size={18} /> Send via Email
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <Button variant="ghost" onClick={() => router.push("/referral-hires")}>
              Back to Referral Hires
            </Button>
          </div>

          <ReferralBrandingFooter className="pt-2" />
        </CardContent>
      </Card>
    );
  }

  // ---- Stepper form ----
  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Opening context (referral mode) */}
      {mode === "referral" && opening && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold leading-tight">{opening.jobTitle}</h3>
                <p className="text-sm text-muted-foreground">{opening.companyName}</p>
              </div>
              <Badge variant="outline">{labelFor(WORK_MODES, opening.workMode)}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {opening.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase size={12} /> {opening.experienceRange}
              </span>
              {opening.salaryRange && (
                <span className="flex items-center gap-1">
                  <Building2 size={12} /> {opening.salaryRange}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1">
            <div
              className={cn(
                "h-1.5 rounded-full",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
            <span
              className={cn(
                "text-[11px]",
                i === step ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          {/* STEP 0: profile */}
          {step === 0 && (
            <div className="space-y-4">
              {authenticated && prefill ? (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Using your Next Leap Pro profile
                  </p>
                  <p className="font-semibold">{prefill.name}</p>
                  <p className="text-muted-foreground">{prefill.email}</p>
                  {prefill.whatsappNumber && (
                    <p className="text-muted-foreground">{prefill.whatsappNumber}</p>
                  )}
                  {prefill.linkedinUrl && (
                    <p className="truncate text-muted-foreground">{prefill.linkedinUrl}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    We won&apos;t ask you to re-enter these details.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                      <Input
                        id="whatsapp"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+91 90000 00000"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="location">
                        Current Location {mode === "talent" ? "*" : ""}
                      </Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn URL</Label>
                      <Input
                        id="linkedin"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/…"
                      />
                    </div>
                  </div>
                  {mode === "talent" && (
                    <div>
                      <Label htmlFor="portfolio">Portfolio Website</Label>
                      <Input
                        id="portfolio"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolio(e.target.value)}
                        placeholder="https://…"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 1: CV + intelligence */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>CV / Resume *</Label>
                {prefill?.existingCv && (
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm">
                      <input
                        type="radio"
                        name="cvchoice"
                        checked={reuseExisting}
                        onChange={() => setReuseExisting(true)}
                      />
                      <span>
                        Reuse my CV:{" "}
                        <span className="font-medium">{prefill.existingCv.fileName}</span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm">
                      <input
                        type="radio"
                        name="cvchoice"
                        checked={!reuseExisting}
                        onChange={() => setReuseExisting(false)}
                      />
                      <span>Upload a new CV</span>
                    </label>
                  </div>
                )}
                {!reuseExisting && <CvUploader onChange={setCv} />}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Current Employment Status</Label>
                  <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_STATUSES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Joining Availability</Label>
                  <Select value={joiningAvailability} onValueChange={setJoiningAvailability}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOINING_AVAILABILITY.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Impacted by a layoff in the last 12 months?</Label>
                <div className="mt-1 flex gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <Button
                      key={v}
                      type="button"
                      variant={layoffImpacted === v ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLayoffImpacted(v)}
                      className="capitalize"
                    >
                      {v}
                    </Button>
                  ))}
                </div>
                {layoffImpacted === "yes" && (
                  <div className="mt-3">
                    <Label htmlFor="lwm">Last Working Month</Label>
                    <Input
                      id="lwm"
                      type="month"
                      value={layoffLastWorkingMonth}
                      onChange={(e) => setLayoffMonth(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Opportunity Preference</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {OPPORTUNITY_PREFERENCES.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => togglePref(o.value)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        opportunityPreference.includes(o.value)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-muted"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="summary">Short Professional Summary</Label>
                <Textarea
                  id="summary"
                  value={professionalSummary}
                  maxLength={300}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Technology leader with 20+ years in product engineering, SaaS and AI."
                  rows={3}
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {professionalSummary.length}/300
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: review */}
          {step === 2 && (
            <div className="space-y-3 text-sm">
              <Row label="Name" value={authenticated && prefill ? prefill.name : name} />
              <Row label="Email" value={authenticated && prefill ? prefill.email : email} />
              <Row
                label="WhatsApp"
                value={authenticated && prefill ? prefill.whatsappNumber : whatsappNumber}
              />
              {(location || (mode === "talent")) && <Row label="Location" value={location || "—"} />}
              <Row
                label="CV"
                value={
                  reuseExisting && prefill?.existingCv
                    ? `${prefill.existingCv.fileName} (reused)`
                    : cv?.fileName || "—"
                }
              />
              {employmentStatus && (
                <Row label="Status" value={labelFor(EMPLOYMENT_STATUSES, employmentStatus)} />
              )}
              {joiningAvailability && (
                <Row label="Availability" value={labelFor(JOINING_AVAILABILITY, joiningAvailability)} />
              )}
              {layoffImpacted && (
                <Row label="Layoff impacted" value={layoffImpacted === "yes" ? "Yes" : "No"} />
              )}
              {opportunityPreference.length > 0 && (
                <Row
                  label="Preferences"
                  value={opportunityPreference
                    .map((v) => labelFor(OPPORTUNITY_PREFERENCES, v))
                    .join(", ")}
                />
              )}
              <ReferralBrandingFooter className="justify-start pt-3" />
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between pt-2">
            {step > 0 ? (
              <Button type="button" variant="ghost" onClick={back} className="gap-1">
                <ArrowLeft size={16} /> Back
              </Button>
            ) : (
              <span />
            )}
            {step < stepLabels.length - 1 ? (
              <Button type="button" onClick={next} className="gap-1">
                Next <ArrowRight size={16} />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitting} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Submitting…
                  </>
                ) : (
                  <>
                    <Send size={16} /> {mode === "referral" ? "Apply" : "Submit Profile"}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
