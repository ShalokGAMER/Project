import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Mail, ShieldCheck, Info } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      {
        title: "About, Contact & Privacy — CommunityGuardian",
        description:
          "About the CommunityGuardian demonstration project, how to reach the builders, and how your data is handled (it stays in your browser).",
      },
      { property: "og:title", content: "About, Contact & Privacy — CommunityGuardian" },
      {
        property: "og:description",
        content:
          "About this civic-tech demonstration, contact information, and privacy: all demo data stays in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const hash = useRouterState({ select: (s) => s.location.hash });

  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About & Policies</h1>
        <p className="mt-3 text-muted-foreground">
          Everything you should know before using this demonstration.
        </p>
      </div>

      <Card id="about" className="scroll-mt-24">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>About CommunityGuardian</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            CommunityGuardian is an interactive demonstration of how AI could help citizens
            report civic problems — potholes, garbage, broken streetlights, drainage and more —
            and turn those reports into formal complaint letters. It was built for learning and
            exhibition purposes.
          </p>
          <p>
            The "AI analysis" you see is simulated entirely in your browser. It demonstrates the
            flow a real civic-tech platform could follow: capture evidence → triage severity →
            draft a complaint → track resolution. No real model analyses your photo, and no
            report is ever sent to a municipal authority.
          </p>
        </CardContent>
      </Card>

      <Card id="contact" className="scroll-mt-24">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Contact</CardTitle>
          </div>
          <CardDescription>
            This is a demonstration project, so there is no support inbox to write to.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          <p>
            If you are viewing this at a school exhibition or community event, please speak to
            the team presenting the project with your questions and feedback. In a real
            deployment, this page would carry the operator's official contact details.
          </p>
        </CardContent>
      </Card>

      <Card id="privacy" className="scroll-mt-24">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Privacy</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Your data stays on your device.</strong> Reports,
            photos, upvotes and status changes you create are stored only in this browser's
            local storage. They are never uploaded to a server and are not shared with other
            users or devices.
          </p>
          <p>
            Sample reports marked "Demo data" are fictional demonstration content. Clearing your
            browser's site data removes everything you have created in the demo.
          </p>
          <p>
            <strong className="text-foreground">Disclaimer:</strong> submissions are not sent to
            real municipal authorities. CommunityGuardian is a demonstration and does not
            provide any official channel for civic complaints.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
