import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Car,
  Construction,
  Droplets,
  HelpCircle,
  Inbox,
  Lightbulb,
  MapPin,
  ThumbsUp,
  Trash2,
  Waves,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  toggleUpvote,
  type CommunityReport,
  type IssueType,
  type ReportStatus,
  type Severity,
  type TimelineEvent,
} from "@/lib/reports";

const ISSUE_ICONS: Record<IssueType, LucideIcon> = {
  Pothole: Construction,
  Garbage: Trash2,
  "Broken Streetlight": Lightbulb,
  Drainage: Waves,
  "Water Leakage": Droplets,
  "Road Damage": Car,
  Other: HelpCircle,
};

export function IssueIcon({ category, className }: { category: IssueType; className?: string }) {
  const Icon = ISSUE_ICONS[category] ?? HelpCircle;
  return <Icon className={className} aria-hidden="true" />;
}

const SEVERITY_CLASS: Record<Severity, string> = {
  Low: "bg-info/10 text-info border-info/25",
  Medium: "bg-warning/15 text-warning border-warning/30",
  Critical: "bg-danger/10 text-danger border-danger/25",
};

const STATUS_CLASS: Record<ReportStatus, string> = {
  Pending: "bg-warning/15 text-warning border-warning/30",
  "AI Verified": "bg-leaf/10 text-leaf border-leaf/25",
  "In Progress": "bg-info/10 text-info border-info/25",
  Resolved: "bg-primary/10 text-primary border-primary/25",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge className={`border ${SEVERITY_CLASS[severity]}`} aria-label={`Severity: ${severity}`}>
      {severity}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge className={`border ${STATUS_CLASS[status]}`} aria-label={`Status: ${status}`}>
      {status}
    </Badge>
  );
}

export function DemoBadge() {
  return <Badge className="border border-info/30 bg-card/90 text-info">Demo data</Badge>;
}

export function ReportCard({ report }: { report: CommunityReport }) {
  return (
    <Card className="group overflow-hidden pt-0 transition-shadow hover:shadow-lg">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
        {report.photo ? (
          <img
            src={report.photo}
            alt={report.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-primary/40"
            aria-label="No photo uploaded"
          >
            <IssueIcon category={report.category} className="h-14 w-14" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <SeverityBadge severity={report.severity} />
        </div>
        {report.isSample && (
          <div className="absolute right-3 top-3">
            <DemoBadge />
          </div>
        )}
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <IssueIcon category={report.category} className="h-4 w-4 text-primary" />
          {report.category}
        </div>
        <Link
          to="/reports/$id"
          params={{ id: report.id }}
          className="line-clamp-2 block font-semibold leading-snug hover:text-primary"
        >
          {report.title}
        </Link>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{report.location}</span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <StatusBadge status={report.status} />
          <span className="text-xs text-muted-foreground">
            {format(new Date(report.createdAt), "d MMM yyyy")}
          </span>
          <Button
            variant={report.upvotedByMe ? "secondary" : "outline"}
            size="sm"
            className="rounded-full"
            aria-pressed={report.upvotedByMe}
            aria-label={`Upvote report: ${report.title}`}
            onClick={() => toggleUpvote(report.id)}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            {report.upvotes}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const TRACK_STEPS: TimelineEvent["label"][] = [
  "Reported",
  "AI Verified",
  "In Progress",
  "Resolved",
];

export function ReportTimeline({ report }: { report: CommunityReport }) {
  const reached = new Set(report.timeline.map((t) => t.label));
  const timeFor = (label: TimelineEvent["label"]) =>
    report.timeline.find((t) => t.label === label)?.at;

  return (
    <ol className="space-y-1" aria-label="Report progress timeline">
      {TRACK_STEPS.map((step, i) => {
        const done = reached.has(step);
        const isLast = i === TRACK_STEPS.length - 1;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 flex h-4 w-4 items-center justify-center rounded-full ${
                  done ? "bg-primary" : "border-2 border-border bg-card"
                }`}
                aria-hidden="true"
              />
              {!isLast && (
                <span
                  className={`w-0.5 flex-1 ${done ? "bg-primary/40" : "bg-border"}`}
                  style={{ minHeight: "28px" }}
                />
              )}
            </div>
            <div className={`pb-5 ${done ? "" : "opacity-60"}`}>
              <p className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>
                {step}
              </p>
              {done && timeFor(step) && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(timeFor(step) as string), "d MMM yyyy, h:mm a")}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
      <p className="mt-4 font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
