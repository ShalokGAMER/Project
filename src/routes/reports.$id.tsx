import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Download,
  FileText,
  MapPin,
  ScanSearch,
  ThumbsUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DemoBadge,
  EmptyState,
  IssueIcon,
  ReportTimeline,
  SeverityBadge,
  StatusBadge,
} from "@/components/report-bits";
import { STATUSES, setStatus, toggleUpvote, useReports } from "@/lib/reports";
import { buildLetterForReport } from "@/lib/ai-sim";

export const Route = createFileRoute("/reports/$id")({
  head: () => ({
    meta: [
      {
        title: "Report Details — CommunityGuardian",
        description:
          "Full details of a community civic report: photo, simulated AI analysis, complaint letter, status timeline and upvotes.",
      },
      { property: "og:title", content: "Report Details — CommunityGuardian" },
      {
        property: "og:description",
        content: "Track a community civic report from Reported to Resolved with its complaint letter and timeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportDetailPage,
});

function ReportDetailPage() {
  const { id } = Route.useParams();
  const reports = useReports();
  const report = reports.find((r) => r.id === id);

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Report not found"
          hint="It may have been created in another browser, or the link is incorrect. All demo data is stored per-browser."
          action={
            <Button asChild variant="outline">
              <Link to="/dashboard">
                <ArrowLeft aria-hidden="true" /> Back to Dashboard
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const letter = buildLetterForReport(report);

  function copyLetter() {
    navigator.clipboard
      .writeText(letter)
      .then(() => toast.success("Complaint letter copied to clipboard."))
      .catch(() => toast.error("Copying failed. Select the text and copy manually."));
  }

  function downloadLetter() {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `communityguardian-complaint-${report?.id.slice(0, 8) ?? "report"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Letter downloaded as a text file.");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Button asChild variant="ghost" className="mb-6 -ml-2 text-primary">
        <Link to="/dashboard">
          <ArrowLeft aria-hidden="true" /> Back to Dashboard
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Photo + title */}
          <Card className="overflow-hidden pt-0">
            <div className="relative aspect-[16/9] w-full bg-secondary">
              {report.photo ? (
                <img src={report.photo} alt={report.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-primary/40">
                  <IssueIcon category={report.category} className="h-16 w-16" />
                </div>
              )}
              {report.isSample && (
                <div className="absolute right-3 top-3">
                  <DemoBadge />
                </div>
              )}
            </div>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1.5">
                  <IssueIcon category={report.category} className="h-3.5 w-3.5 text-primary" />
                  {report.category}
                </Badge>
                <SeverityBadge severity={report.severity} />
                <StatusBadge status={report.status} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{report.title}</h1>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {report.location}
                  {typeof report.latitude === "number" && typeof report.longitude === "number" && (
                    <span className="block text-xs">
                      Coordinates: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                    </span>
                  )}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{report.description}</p>
              <Button
                variant={report.upvotedByMe ? "secondary" : "outline"}
                onClick={() => toggleUpvote(report.id)}
                aria-pressed={report.upvotedByMe}
              >
                <ThumbsUp aria-hidden="true" />
                {report.upvotedByMe ? "Upvoted" : "Upvote"} · {report.upvotes}
              </Button>
            </CardContent>
          </Card>

          {/* Simulated AI analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ScanSearch className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-lg">AI Analysis</CardTitle>
                <Badge variant="outline" className="border-info/30 text-info">
                  Simulated
                </Badge>
              </div>
              <CardDescription>
                Demonstration analysis generated in the browser — no real image analysis occurred.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  What the analysis found
                </p>
                <p className="mt-1.5 text-sm">{report.aiSummary}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Suggested action
                </p>
                <p className="mt-1.5 text-sm">{report.suggestedAction}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Confidence: {report.confidence}% (simulated)
              </p>
            </CardContent>
          </Card>

          {/* Complaint letter */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-lg">Complaint Letter</CardTitle>
              </div>
              <CardDescription>
                Auto-drafted formal complaint based on this report. Copy or download and send it
                yourself — nothing is sent automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-border/70 bg-secondary/40 p-4 font-mono text-[13px] leading-relaxed">
                {letter}
              </pre>
              <div className="flex flex-wrap gap-2">
                <Button onClick={copyLetter}>
                  <Copy aria-hidden="true" /> Copy Letter
                </Button>
                <Button variant="outline" onClick={downloadLetter}>
                  <Download aria-hidden="true" /> Download as TXT
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline + demo status control */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tracking Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportTimeline report={report} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Status</CardTitle>
              <CardDescription>
                Demo mode: municipal departments do not actually receive or act on reports — you
                can simulate their progression here.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {STATUSES.map((status) => (
                <Button
                  key={status}
                  variant={report.status === status ? "default" : "outline"}
                  size="sm"
                  aria-pressed={report.status === status}
                  onClick={() => {
                    setStatus(report.id, status);
                    toast.success(`Status updated to ${status}.`);
                  }}
                >
                  {status}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
