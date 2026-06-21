"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, Send, CheckCircle, ShieldCheck } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ReferralBrandingFooter } from "./ReferralBrandingFooter";
import {
  WORK_MODES,
  REFERRAL_SOURCES,
  labelFor,
  isValidEmail,
  isValidWhatsapp,
  isValidUrl,
} from "@/lib/referral-hires";

const STEPS = ["Job Details", "Contact Details", "Preview & Submit"];

export function ShareOpeningForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    jobTitle: "",
    companyName: "",
    location: "",
    workMode: "",
    experienceRange: "",
    shortDescription: "",
    salaryRange: "",
    jobLink: "",
    lastDateToApply: "",
    referralSource: "",
    pocName: "",
    pocEmail: "",
    pocWhatsapp: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (form.jobTitle.trim().length < 2) return "Please enter the job title.";
      if (!form.companyName.trim()) return "Please enter the company name.";
      if (!form.location.trim()) return "Please enter the location.";
      if (!form.workMode) return "Please select a work mode.";
      if (!form.experienceRange.trim()) return "Please enter the experience range.";
      if (form.shortDescription.trim().length < 10)
        return "Please add a short description (at least 10 characters).";
      if (form.jobLink && !isValidUrl(form.jobLink)) return "Job link must be a valid URL.";
    }
    if (current === 1) {
      if (!form.pocName.trim()) return "Point of contact name is required.";
      if (!isValidEmail(form.pocEmail)) return "Enter a valid point of contact email.";
      if (!isValidWhatsapp(form.pocWhatsapp)) return "Enter a valid WhatsApp number.";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) return toast.error(err);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleSubmit() {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const err = validateStep(i);
      if (err) {
        toast.error(err);
        setStep(i);
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/referral-hires/openings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-4 p-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="text-emerald-600" size={30} />
            </div>
          </div>
          <h2 className="text-xl font-bold">Opening submitted</h2>
          <p className="text-sm text-muted-foreground">
            Thanks! Your opening is now <span className="font-medium">Pending Review</span>. It will
            appear publicly with a Verified badge once our team approves it.
          </p>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => router.push("/referral-hires")}>
              Back to Referral Hires
            </Button>
            <Button
              onClick={() => {
                setForm({
                  jobTitle: "",
                  companyName: "",
                  location: "",
                  workMode: "",
                  experienceRange: "",
                  shortDescription: "",
                  salaryRange: "",
                  jobLink: "",
                  lastDateToApply: "",
                  referralSource: "",
                  pocName: "",
                  pocEmail: "",
                  pocWhatsapp: "",
                });
                setStep(0);
                setDone(false);
              }}
            >
              Share another
            </Button>
          </div>
          <ReferralBrandingFooter className="pt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1">
            <div className={cn("h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
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
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={form.jobTitle}
                  onChange={(e) => set("jobTitle", e.target.value)}
                  placeholder="e.g. Senior Product Designer"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="City / Remote"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Work Mode *</Label>
                  <Select value={form.workMode} onValueChange={(v) => set("workMode", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_MODES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experienceRange">Experience Range *</Label>
                  <Input
                    id="experienceRange"
                    value={form.experienceRange}
                    onChange={(e) => set("experienceRange", e.target.value)}
                    placeholder="e.g. 3–6 years"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="shortDescription">Short Job Description *</Label>
                <Textarea
                  id="shortDescription"
                  rows={4}
                  value={form.shortDescription}
                  onChange={(e) => set("shortDescription", e.target.value)}
                  placeholder="A couple of lines about the role and what you're looking for."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="salaryRange">Salary Range</Label>
                  <Input
                    id="salaryRange"
                    value={form.salaryRange}
                    onChange={(e) => set("salaryRange", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="jobLink">Job Link</Label>
                  <Input
                    id="jobLink"
                    value={form.jobLink}
                    onChange={(e) => set("jobLink", e.target.value)}
                    placeholder="https://… (optional)"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="lastDateToApply">Last Date to Apply</Label>
                  <Input
                    id="lastDateToApply"
                    type="date"
                    value={form.lastDateToApply}
                    onChange={(e) => set("lastDateToApply", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Referral Source</Label>
                  <Select
                    value={form.referralSource}
                    onValueChange={(v) => set("referralSource", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {REFERRAL_SOURCES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={16} />
                <span>
                  A point of contact is required. To protect privacy, these details are revealed to
                  candidates only after they apply.
                </span>
              </div>
              <div>
                <Label htmlFor="pocName">Point of Contact Name *</Label>
                <Input
                  id="pocName"
                  value={form.pocName}
                  onChange={(e) => set("pocName", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="pocEmail">Point of Contact Email *</Label>
                  <Input
                    id="pocEmail"
                    type="email"
                    value={form.pocEmail}
                    onChange={(e) => set("pocEmail", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pocWhatsapp">Point of Contact WhatsApp *</Label>
                  <Input
                    id="pocWhatsapp"
                    value={form.pocWhatsapp}
                    onChange={(e) => set("pocWhatsapp", e.target.value)}
                    placeholder="+91 90000 00000"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 text-sm">
              <Row label="Job Title" value={form.jobTitle} />
              <Row label="Company" value={form.companyName} />
              <Row label="Location" value={form.location} />
              <Row label="Work Mode" value={labelFor(WORK_MODES, form.workMode)} />
              <Row label="Experience" value={form.experienceRange} />
              {form.salaryRange && <Row label="Salary" value={form.salaryRange} />}
              {form.jobLink && <Row label="Job Link" value={form.jobLink} />}
              {form.lastDateToApply && <Row label="Last Date" value={form.lastDateToApply} />}
              {form.referralSource && (
                <Row label="Source" value={labelFor(REFERRAL_SOURCES, form.referralSource)} />
              )}
              <Row label="Contact" value={`${form.pocName}`} />
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                {form.shortDescription}
              </div>
              <ReferralBrandingFooter className="justify-start pt-2" />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {step > 0 ? (
              <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} className="gap-1">
                <ArrowLeft size={16} /> Back
              </Button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
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
                    <Send size={16} /> Submit Opening
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
