import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Clock, FileText, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, ReportCard } from "@/components/report-bits";
import { ISSUE_TYPES, STATUSES, useReports, type IssueType, type ReportStatus, type Severity } from "@/lib/reports";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      {
        title: "Community Dashboard — CommunityGuardian",
        description:
          "Browse community-reported civic issues with live filters, search, severity and status badges, and per-report upvotes. Stored locally in your browser.",
      },
      { property: "og:title", content: "Community Dashboard — CommunityGuardian" },
      {
        property: "og:description",
        content:
          "Track community civic reports: total reports, pending issues, AI-verified and resolved — with filters, search and upvotes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const selectClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm sm:w-auto";

function DashboardPage() {
  const reports = useReports();
  const [category, setCategory] = useState<"All" | IssueType>("All");
  const [severity, setSeverity] = useState<"All" | Severity>("All");
  const [status, setStatus] = useState<"All" | ReportStatus>("All");
  const [query, setQuery] = useState("");

  const filtered = reports
    .filter((r) => (category === "All" ? true : r.category === category))
    .filter((r) => (severity === "All" ? true : r.severity === severity))
    .filter((r) => (status === "All" ? true : r.status === status))
    .filter((r) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = reports.length;
  const pending = reports.filter((r) => r.status !== "Resolved").length;
  const aiVerified = reports.filter((r) => r.status === "AI Verified").length;
  const resolved = reports.filter((r) => r.status === "Resolved").length;

  const stats = [
    { icon: FileText, label: "Total Reports", value: total },
    { icon: Clock, label: "Pending Issues", value: pending },
    { icon: ShieldCheck, label: "AI Verified", value: aiVerified },
    { icon: CheckCircle2, label: "Resolved Issues", value: resolved },
  ];

  const hasFilters = category !== "All" || severity !== "All" || status !== "All" || query.trim() !== "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Community Dashboard</h1>
        <p className="mt-3 text-muted-foreground">
          Every report from the neighborhood board. Sample entries are marked "Demo data" —
          all data lives in your browser only and is not shared between users.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/70">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <stat.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-extrabold leading-none text-foreground">{stat.value}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 lg:flex-row lg:items-center">
        <div className="relative lg:w-64 lg:shrink-0">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports…"
            aria-label="Search reports"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:items-center lg:gap-3">
          <select
            aria-label="Filter by category"
            className={selectClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as "All" | IssueType)}
          >
            <option value="All">All categories</option>
            {ISSUE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by severity"
            className={selectClass}
            value={severity}
            onChange={(e) => setSeverity(e.target.value as "All" | Severity)}
          >
            <option value="All">All severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="Critical">Critical</option>
          </select>
          <select
            aria-label="Filter by status"
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as "All" | ReportStatus)}
          >
            <option value="All">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            className="lg:ml-auto"
            onClick={() => {
              setCategory("All");
              setSeverity("All");
              setStatus("All");
              setQuery("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        Showing {filtered.length} of {total} reports
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title={hasFilters ? "No reports match your filters" : "No reports yet"}
            hint={
              hasFilters
                ? "Try clearing the filters or searching for a different keyword."
                : "Be the first to report a civic issue in your neighborhood."
            }
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCategory("All");
                    setSeverity("All");
                    setStatus("All");
                    setQuery("");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
