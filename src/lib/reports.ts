import { useEffect, useState } from "react";

import sampleGarbage from "@/assets/sample-garbage.jpg";
import samplePothole from "@/assets/sample-pothole.jpg";
import sampleStreetlight from "@/assets/sample-streetlight.jpg";

export const ISSUE_TYPES = [
  "Pothole",
  "Garbage",
  "Broken Streetlight",
  "Drainage",
  "Water Leakage",
  "Road Damage",
  "Other",
] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export type Severity = "Low" | "Medium" | "Critical";

export const STATUSES = ["Pending", "AI Verified", "In Progress", "Resolved"] as const;
export type ReportStatus = (typeof STATUSES)[number];

export interface TimelineEvent {
  label: ReportStatus | "Reported";
  at: string;
}

export interface CommunityReport {
  id: string;
  title: string;
  category: IssueType;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  severity: Severity;
  status: ReportStatus;
  /** 0–100; always produced by the simulated analyzer */
  confidence: number;
  aiSummary: string;
  suggestedAction: string;
  /** data URL (user uploads) or bundled asset URL (samples) */
  photo?: string;
  createdAt: string;
  upvotes: number;
  upvotedByMe: boolean;
  isSample: boolean;
  timeline: TimelineEvent[];
}

export interface NewReportInput {
  title: string;
  category: IssueType;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  photo?: string;
}

const STORAGE_KEY = "communityguardian.reports.v1";
const UPDATED_EVENT = "communityguardian:reports-updated";

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 86_400_000).toISOString();

const STATUS_ORDER: ReportStatus[] = ["Pending", "AI Verified", "In Progress", "Resolved"];

/** Build a plausible timeline: Reported, then each status up to `status`. */
function buildTimeline(status: ReportStatus, createdAt: string): TimelineEvent[] {
  const upto = STATUS_ORDER.indexOf(status);
  const labels: TimelineEvent["label"][] = ["Reported", ...STATUS_ORDER.slice(1, upto + 1)];
  return labels.map((label, i) => ({
    label,
    at: new Date(new Date(createdAt).getTime() + i * 3_600_000).toISOString(),
  }));
}

export const SAMPLE_REPORTS: CommunityReport[] = [
  {
    id: "sample-1",
    title: "Deep pothole filling with rainwater",
    category: "Pothole",
    description:
      "A wide, deep pothole has opened up on the main carriageway near the bus stop. It fills with water every time it rains and two-wheelers are swerving dangerously to avoid it.",
    location: "Palm Avenue Road, near Bus Stop 12, Greenfield Colony",
    latitude: 12.9722,
    longitude: 77.5931,
    severity: "Critical",
    status: "In Progress",
    confidence: 94,
    aiSummary:
      "Road surface defect consistent with a deep pothole. Water accumulation suggests an active base failure that will widen without repair.",
    suggestedAction: "Prioritised road repair ticket with barricading and temporary filling.",
    photo: samplePothole,
    createdAt: daysAgo(6),
    upvotes: 34,
    upvotedByMe: false,
    isSample: true,
    timeline: buildTimeline("In Progress", daysAgo(6)),
  },
  {
    id: "sample-2",
    title: "Overflowing garbage bins on street corner",
    category: "Garbage",
    description:
      "The community waste bins have not been collected for three days. Bags are piling onto the footpath and attracting stray animals near the school crossing.",
    location: "Market Lane & 4th Cross, Greenfield Colony",
    latitude: 12.9738,
    longitude: 77.5963,
    severity: "Medium",
    status: "AI Verified",
    confidence: 91,
    aiSummary:
      "Waste overflow detected beside collection bins with spillage onto the pedestrian path. Elevated sanitation risk due to proximity to a school crossing.",
    suggestedAction: "Escalate to sanitation department for immediate pickup and route review.",
    photo: sampleGarbage,
    createdAt: daysAgo(3),
    upvotes: 21,
    upvotedByMe: false,
    isSample: true,
    timeline: buildTimeline("AI Verified", daysAgo(3)),
  },
  {
    id: "sample-3",
    title: "Streetlight hanging dangerously from pole",
    category: "Broken Streetlight",
    description:
      "The lamp head of the streetlight has come loose and is hanging by its wires over the footpath. The street has been dark for a week and pedestrians feel unsafe after dusk.",
    location: "Orchard Street, opposite House 24, Greenfield Colony",
    latitude: 12.9698,
    longitude: 77.5906,
    severity: "Critical",
    status: "In Progress",
    confidence: 96,
    aiSummary:
      "Damaged luminaire hanging from the pole with exposed wiring. Public safety hazard on an unlit residential street after dark.",
    suggestedAction: "Emergency electrical crew dispatch to secure wiring and restore lighting.",
    photo: sampleStreetlight,
    createdAt: daysAgo(9),
    upvotes: 45,
    upvotedByMe: false,
    isSample: true,
    timeline: buildTimeline("In Progress", daysAgo(9)),
  },
  {
    id: "sample-4",
    title: "Blocked stormwater drain flooding the lane",
    category: "Drainage",
    description:
      "The stormwater drain is completely choked with silt and plastic. Rainwater backs up into the lane and has entered at least two ground-floor homes in the last shower.",
    location: "Lakeside Walk, Greenfield Colony",
    latitude: 12.9709,
    longitude: 77.5978,
    severity: "Critical",
    status: "Resolved",
    confidence: 89,
    aiSummary:
      "Drain inlet blocked with debris; standing water noted along the lane with risk of water entering homes during rainfall.",
    suggestedAction: "Desilting work order completed and drain cover replacement scheduled.",
    createdAt: daysAgo(14),
    upvotes: 28,
    upvotedByMe: false,
    isSample: true,
    timeline: buildTimeline("Resolved", daysAgo(14)),
  },
  {
    id: "sample-5",
    title: "Continuous water leakage from pipeline joint",
    category: "Water Leakage",
    description:
      "A pipeline joint near the gate has been leaking for days. The road surface stays wet around the clock and the seepage is starting to damage the footpath edge.",
    location: "Main Market Road, near Water Tank, Greenfield Colony",
    latitude: 12.9745,
    longitude: 77.5919,
    severity: "Medium",
    status: "Pending",
    confidence: 87,
    aiSummary:
      "Persistent water discharge along the pipeline alignment, likely a joint failure. Continuous loss and surface weakening observed.",
    suggestedAction: "Water board inspection ticket with valve-zone isolation check.",
    createdAt: daysAgo(1),
    upvotes: 12,
    upvotedByMe: false,
    isSample: true,
    timeline: buildTimeline("Pending", daysAgo(1)),
  },
  {
    id: "sample-6",
    title: "Cracked speed bump and broken edge near school",
    category: "Road Damage",
    description:
      "The speed bump outside the school gate has cracked in the middle and its edges have broken off. Vehicles speed over the gap and it is risky for children crossing.",
    location: "School Gate Lane, Greenfield Public School",
    latitude: 12.9762,
    longitude: 77.5944,
    severity: "Medium",
    status: "Resolved",
    confidence: 92,
    aiSummary:
      "Road surface damage concentrated at the speed bump with material loss on both edges near a pedestrian crossing zone.",
    suggestedAction: "Repair completed by roads division; monitoring added to monthly inspection.",
    createdAt: daysAgo(21),
    upvotes: 17,
    upvotedByMe: false,
    isSample: true,
    timeline: buildTimeline("Resolved", daysAgo(21)),
  },
];

function isCommunityReport(value: unknown): value is CommunityReport {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CommunityReport).id === "string" &&
    typeof (value as CommunityReport).title === "string"
  );
}

/** Read all reports: seed samples on first run, localStorage afterwards. */
export function getReports(): CommunityReport[] {
  if (typeof window === "undefined") return SAMPLE_REPORTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_REPORTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isCommunityReport)) return SAMPLE_REPORTS;
    return parsed;
  } catch {
    return SAMPLE_REPORTS;
  }
}

function persist(reports: CommunityReport[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // Storage full (very large photos) — keep the session working in memory.
  }
  window.dispatchEvent(new Event(UPDATED_EVENT));
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Create a report in the Pending state; the simulated analysis finalises it. */
export function addReport(input: NewReportInput): CommunityReport {
  const report: CommunityReport = {
    ...input,
    id: makeId(),
    severity: "Low",
    status: "Pending",
    confidence: 0,
    aiSummary: "Awaiting simulated AI analysis.",
    suggestedAction: "Awaiting simulated AI analysis.",
    createdAt: new Date().toISOString(),
    upvotes: 0,
    upvotedByMe: false,
    isSample: false,
    timeline: [{ label: "Reported", at: new Date().toISOString() }],
  };
  persist([report, ...getReports()]);
  return report;
}

/** Store the simulated analysis result and move the report to AI Verified. */
export function finaliseReport(
  id: string,
  result: Pick<CommunityReport, "severity" | "confidence" | "aiSummary" | "suggestedAction">,
) {
  const reports = getReports();
  const updated = reports.map((r) =>
    r.id === id
      ? {
          ...r,
          ...result,
          status: "AI Verified" as ReportStatus,
          timeline: [...r.timeline, { label: "AI Verified", at: new Date().toISOString() }],
        }
      : r,
  );
  persist(updated);
}

export function toggleUpvote(id: string) {
  const updated = getReports().map((r) =>
    r.id === id
      ? { ...r, upvotedByMe: !r.upvotedByMe, upvotes: r.upvotes + (r.upvotedByMe ? -1 : 1) }
      : r,
  );
  persist(updated);
}

export function setStatus(id: string, status: ReportStatus) {
  const updated = getReports().map((r) => {
    if (r.id !== id || r.status === status) return r;
    const timeline = buildTimeline(status, r.createdAt);
    return { ...r, status, timeline };
  });
  persist(updated);
}

export function getReport(id: string): CommunityReport | undefined {
  return getReports().find((r) => r.id === id);
}

/** Subscribe to report changes (same tab via custom event, other tabs via storage). */
export function useReports(): CommunityReport[] {
  const [reports, setReports] = useState<CommunityReport[]>(() => getReports());

  useEffect(() => {
    const sync = () => setReports(getReports());
    window.addEventListener(UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    sync();
    return () => {
      window.removeEventListener(UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return reports;
}
