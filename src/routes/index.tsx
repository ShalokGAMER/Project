import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  FileText,
  HeartHandshake,
  MapPinned,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

import heroIllustration from "@/assets/hero-illustration.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReportCard } from "@/components/report-bits";
import { useReports } from "@/lib/reports";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "CommunityGuardian — AI for a Better Life",
        description:
          "Report potholes, garbage, broken streetlights and other civic issues. Simulated AI analysis drafts a formal complaint letter and tracks resolution — a fully working in-browser demo.",
      },
      { property: "og:title", content: "CommunityGuardian — AI for a Better Life" },
      {
        property: "og:description",
        content:
          "Report civic problems, bring communities together, and help make every neighborhood safer with AI-powered assistance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const HOW_IT_WORKS = [
  {
    icon: ClipboardList,
    title: "1. Snap & Report",
    body: "Upload a photo of the problem, pick the issue type, drop the location and describe what you see.",
  },
  {
    icon: ScanSearch,
    title: "2. Simulated AI Analysis",
    body: "The demo scans your report, identifies the category and suggests a severity — clearly labelled as a simulation.",
  },
  {
    icon: FileText,
    title: "3. Auto-Generated Complaint",
    body: "A formal, editable complaint letter is drafted for you, ready to copy or download and send yourself.",
  },
  {
    icon: TrendingUp,
    title: "4. Track Resolution",
    body: "Follow every report from Reported to Resolved on the community dashboard and map.",
  },
];

const WHY_CARDS = [
  {
    icon: Bell,
    title: "Effortless reporting",
    body: "A guided two-minute flow replaces guesswork — no forms to chase, no office visits.",
  },
  {
    icon: Sparkles,
    title: "AI-assisted triage",
    body: "Simulated analysis shows how AI could prioritise the most urgent civic problems first.",
  },
  {
    icon: HeartHandshake,
    title: "Community-driven",
    body: "Upvotes surface the issues neighbours care about most and build a shared record.",
  },
  {
    icon: ShieldCheck,
    title: "Accountability, tracked",
    body: "Every report carries a clear status trail, making follow-ups visible to everyone.",
  },
];

function Index() {
  const reports = useReports();
  const sorted = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const resolved = reports.filter((r) => r.status === "Resolved").length;
  const totalUpvotes = reports.reduce((sum, r) => sum + r.upvotes, 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/70 via-background to-background">
        <div className="bg-civic-dots absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AI for a Better Life · Interactive Demo
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              Your Neighborhood. Your Voice.{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">A Better Tomorrow.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Report civic problems, bring communities together, and help make every
              neighborhood safer with AI-powered assistance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link to="/report">Report an Issue</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link to="/map">Explore Community</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Demonstration project — reports stay in your browser and are never sent to real
              authorities.
            </p>
          </div>
          <div className="relative animate-fade-up">
            <img
              src={heroIllustration}
              alt="Illustration of citizens reporting neighborhood civic issues with AI assistance"
              width={1600}
              height={1000}
              className="w-full rounded-3xl border border-border/60 shadow-xl"
            />
            <div className="absolute -bottom-4 left-4 flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-xs font-semibold shadow-md">
              <ShieldCheck className="h-4 w-4 text-leaf" aria-hidden="true" />
              AI Verified reporting
            </div>
            <div className="absolute -top-4 right-4 hidden items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-xs font-semibold shadow-md sm:flex">
              <MapPinned className="h-4 w-4 text-primary" aria-hidden="true" />
              Community issue map
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
          <p className="mt-3 text-muted-foreground">
            From a photo on your phone to a formal complaint — four simple steps.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step) => (
            <Card key={step.title} className="border-border/70 transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Community impact */}
      <section className="bg-card py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Community Impact</h2>
            <p className="mt-3 text-muted-foreground">
              Live counts from this demo's community board — stored right in your browser.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ClipboardList, label: "Reports on the board", value: String(reports.length) },
              { icon: CheckCircle2, label: "Issues resolved", value: String(resolved) },
              { icon: ThumbsUp, label: "Neighbor upvotes", value: String(totalUpvotes) },
              { icon: MapPinned, label: "Neighborhoods covered", value: "1 (demo)" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border/70 text-center">
                <CardContent className="p-6">
                  <stat.icon className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-3xl font-extrabold text-primary">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
            In a real deployment, this same flow could shorten the distance between a citizen's
            observation and a municipal work order — no paperwork, no lost complaints.
          </p>
        </div>
      </section>

      {/* Recent reports */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight">Recent Community Reports</h2>
            <p className="mt-3 text-muted-foreground">
              The latest issues reported by neighbors. Sample entries are marked "Demo data".
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/dashboard">View all reports</Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.slice(0, 3).map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </section>

      {/* Why CommunityGuardian */}
      <section className="bg-card py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Why CommunityGuardian</h2>
            <p className="mt-3 text-muted-foreground">
              Built to show how a small tool could change how neighborhoods report and resolve
              civic problems.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CARDS.map((card) => (
              <Card key={card.title} className="border-border/70 transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                    <card.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="bg-brand-gradient relative overflow-hidden rounded-3xl px-8 py-14 text-center shadow-xl">
          <div className="bg-civic-dots absolute inset-0 opacity-20" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-on-brand sm:text-4xl">
              See something broken on your street?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
              Report it in two minutes, get a ready-to-send complaint letter, and rally your
              neighbors behind the fix.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="rounded-full px-7">
                <Link to="/report">Report an Issue</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-primary-foreground/40 bg-transparent px-7 text-on-brand hover:bg-primary-foreground/10 hover:text-on-brand"
              >
                <Link to="/dashboard">Open Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
