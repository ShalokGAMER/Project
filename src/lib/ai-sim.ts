import type { CommunityReport, IssueType, Severity } from "./reports";

/*
 * Simulated AI analysis. Nothing here contacts a model — every result is
 * generated locally from the selected category and the user's description,
 * and the UI must always label it as a demonstration.
 */

export const SCAN_STEPS = [
  "Analyzing image…",
  "Identifying civic issue…",
  "Assessing severity…",
  "Preparing report…",
] as const;

export const SCAN_DURATION_MS = 6000;

/** Drive the animated scan: progress 0–100 plus the active step index. */
export function runScan(onUpdate: (progress: number, step: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - started;
      const progress = Math.min(100, Math.round((elapsed / SCAN_DURATION_MS) * 100));
      const step = Math.min(
        SCAN_STEPS.length - 1,
        Math.floor((elapsed / SCAN_DURATION_MS) * SCAN_STEPS.length),
      );
      onUpdate(progress, step);
      if (elapsed >= SCAN_DURATION_MS) {
        window.clearInterval(timer);
        resolve();
      }
    }, 180);
  });
}

const CRITICAL_KEYWORDS = [
  "child",
  "children",
  "school",
  "accident",
  "injur",
  "danger",
  "unsafe",
  "sewage",
  "flood",
  "flooded",
  "open wire",
  "live wire",
  "electric",
  "deep",
  "sink",
  "collapse",
  "night",
  "dark",
];
const MEDIUM_KEYWORDS = [
  "overflow",
  "spill",
  "smell",
  "block",
  "choke",
  "leak",
  "broken",
  "crack",
  "damage",
  "puddle",
  "rain",
  "mosquito",
  "dengue",
  "wet",
  "pile",
];

const CATEGORY_BASE_SCORE: Record<IssueType, number> = {
  Pothole: 1,
  Garbage: 1,
  "Broken Streetlight": 2,
  Drainage: 1,
  "Water Leakage": 1,
  "Road Damage": 1,
  Other: 0,
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Keyword-based severity estimate so results react to what the user wrote. */
export function estimateSeverity(category: IssueType, description: string): Severity {
  const text = description.toLowerCase();
  let score = CATEGORY_BASE_SCORE[category];
  for (const word of CRITICAL_KEYWORDS) if (text.includes(word)) score += 2;
  for (const word of MEDIUM_KEYWORDS) if (text.includes(word)) score += 1;
  if (score >= 5) return "Critical";
  if (score >= 2) return "Medium";
  return "Low";
}

export interface AiAnalysis {
  severity: Severity;
  confidence: number;
  aiSummary: string;
  suggestedAction: string;
}

const SUMMARY_BY_CATEGORY: Record<IssueType, (location: string) => string> = {
  Pothole: (loc) =>
    `Road surface defect consistent with a pothole detected at ${loc}. The depression appears to hold water, which accelerates surface damage and is hazardous for two-wheelers.`,
  Garbage: (loc) =>
    `Waste accumulation detected at ${loc}. Spillage beyond the collection point raises sanitation and public-health concerns for the immediate area.`,
  "Broken Streetlight": (loc) =>
    `Streetlight fault detected at ${loc}. The fitting appears damaged or non-functional, leaving the stretch poorly lit after dark.`,
  Drainage: (loc) =>
    `Drainage blockage or overflow detected at ${loc}. Standing water suggests the outlet is choked and could worsen with rainfall.`,
  "Water Leakage": (loc) =>
    `Continuous water discharge detected near ${loc}, consistent with a pipeline or joint failure and ongoing water loss.`,
  "Road Damage": (loc) =>
    `Road surface damage detected at ${loc}, including cracking and edge material loss that may worsen under traffic.`,
  Other: (loc) =>
    `Civic issue detected at ${loc}. The recorded description and photo suggest a local maintenance problem requiring departmental attention.`,
};

const ACTION_BY_CATEGORY: Record<IssueType, string> = {
  Pothole: "Route to the roads division for inspection, temporary filling and permanent repair.",
  Garbage: "Escalate to the sanitation department for pickup and collection-route review.",
  "Broken Streetlight": "Dispatch the electrical maintenance crew to repair or replace the fitting.",
  Drainage: "Raise a desilting work order and check the outlet before the next rainfall.",
  "Water Leakage": "Refer to the water board for a valve-zone check and pipeline joint repair.",
  "Road Damage": "Route to the roads division for a surface repair and safety assessment.",
  Other: "Forward to the municipal helpdesk for categorisation and field inspection.",
};

/** Produce a deterministic, plausible "AI" result from the user's inputs. */
export function analyzeReport(
  category: IssueType,
  description: string,
  location: string,
): AiAnalysis {
  const severity = estimateSeverity(category, description);
  const confidence = 84 + (hashString(`${category}|${description}|${location}`) % 14);
  return {
    severity,
    confidence,
    aiSummary: SUMMARY_BY_CATEGORY[category](location),
    suggestedAction: ACTION_BY_CATEGORY[category],
  };
}

const ISSUE_PHRASE: Record<IssueType, string> = {
  Pothole: "a pothole",
  Garbage: "garbage accumulation",
  "Broken Streetlight": "a broken streetlight",
  Drainage: "a blocked/overflowing drain",
  "Water Leakage": "a water pipeline leakage",
  "Road Damage": "road surface damage",
  Other: "a civic issue",
};

const IMPACT_BY_SEVERITY: Record<Severity, string> = {
  Low:
    "While the issue is currently of low urgency, it affects the daily convenience of residents and may deteriorate if left unattended. An inspection at the department's convenience would prevent further decline.",
  Medium:
    "The issue is affecting the daily movement and comfort of several families in the locality. Timely attention is requested, as the condition is likely to worsen with regular use and weather exposure.",
  Critical:
    "The issue poses an immediate risk to public safety, with children, elderly residents and two-wheeler commuters particularly exposed. Urgent inspection and corrective action are requested at the earliest.",
};

export interface LetterInput {
  category: IssueType;
  description: string;
  location: string;
  severity: Severity;
}

/** Build the editable formal complaint letter from the analysis result. */
export function buildComplaintLetter({ category, description, location, severity }: LetterInput) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `To,
The Municipal Commissioner
Municipal Corporation Office
[City]

Date: ${today}

Subject: Complaint Regarding ${ISSUE_PHRASE[category]} at ${location}

Respected Sir/Madam,

I wish to bring to your kind attention a civic issue in our neighbourhood that requires the department's attention.

Details of the problem:
${description}

Location of the issue:
${location}

Public impact and urgency:
${IMPACT_BY_SEVERITY[severity]}

I therefore request that the concerned department depute an official for an on-site inspection and take the necessary steps to resolve this issue. I would be grateful for an update on the action taken, so that residents may be informed accordingly.

Thank you for your time and consideration.

Yours faithfully,
[Your Name]
[Residential Address]
[Contact Number]

---
This letter was drafted with CommunityGuardian (demonstration). Please review and personalise it before sending.`;
}

export function buildLetterForReport(report: CommunityReport): string {
  return buildComplaintLetter(report);
}
