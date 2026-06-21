/** Shared (type-only) shapes for the admin Referral Hires applications views. */

export interface AdminCandidate {
  type: "registered" | "guest" | "unknown";
  name: string;
  email: string;
  whatsapp: string;
  linkedin: string;
  location: string;
  skills: string[];
}

export interface AdminOpeningRef {
  id: number;
  jobTitle: string;
  companyName: string;
  pocName: string;
  pocEmail: string;
  pocWhatsapp: string;
  postedBy: string;
}

export interface AdminActivity {
  activityType: string;
  activityBy: string;
  notes: string | null;
  createdAt: string;
}

export interface AdminApplication {
  id: number;
  source: string; // registered | guest
  applicationType: string; // referral | talent_pool
  applicationSource: string | null;
  status: string;
  talentStatus: string | null;
  whatsappClicked: boolean;
  emailClicked: boolean;
  createdAt: string;
  employmentStatus: string | null;
  joiningAvailability: string | null;
  layoffImpacted: boolean | null;
  layoffLastWorkingMonth: string | null;
  opportunityPreference: string[];
  professionalSummary: string | null;
  candidate: AdminCandidate;
  cv: { id: number; fileName: string; fileType: string; reused: boolean } | null;
  opening: AdminOpeningRef | null;
  referralId: number | null;
  activity: AdminActivity[];
}
