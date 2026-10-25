import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  Pencil,
  ScanSearch,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IssueIcon, SeverityBadge } from "@/components/report-bits";
import {
  addReport,
  finaliseReport,
  ISSUE_TYPES,
  type IssueType,
} from "@/lib/reports";
import {
  analyzeReport,
  buildComplaintLetter,
  runScan,
  SCAN_STEPS,
  type AiAnalysis,
} from "@/lib/ai-sim";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      {
        title: "Report an Issue — CommunityGuardian",
        description:
          "Upload a photo, describe the civic issue, and run the simulated AI analysis that drafts a formal complaint letter. Demo only — nothing is sent to real authorities.",
      },
      { property: "og:title", content: "Report an Issue — CommunityGuardian" },
      {
        property: "og:description",
        content:
          "Report potholes, garbage, broken streetlights and more with simulated AI analysis and an auto-drafted complaint letter.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

type Phase = "form" | "scanning" | "result";

interface FormState {
  category: IssueType | "";
  location: string;
  latitude: string;
  longitude: string;
  description: string;
}

const EMPTY_FORM: FormState = { category: "", location: "", latitude: "", longitude: "", description: "" };

/** Read, validate and downscale an uploaded photo so it fits localStorage. */
async function fileToDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file. Please try another image."));
    reader.readAsDataURL(file);
  });

  const img = document.createElement("img");
  img.src = dataUrl;
  await img.decode();

  const maxDim = 1280;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1 && dataUrl.length < 900_000) return dataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function ReportPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photo, setPhoto] = useState<string | undefined>();
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "photo", string>>>({});
  const [phase, setPhase] = useState<Phase>("form");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [letter, setLetter] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  async function acceptFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((e) => ({ ...e, photo: "That file is not an image. Please upload a JPG, PNG or WebP photo." }));
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setErrors((e) => ({ ...e, photo: "That photo is larger than 6 MB. Please choose a smaller image." }));
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setPhoto(dataUrl);
      setErrors((e) => ({ ...e, photo: undefined }));
    } catch (err) {
      setErrors((e) => ({ ...e, photo: err instanceof Error ? err.message : "Could not read that file." }));
    }
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.category) next.category = "Please choose the issue type.";
    if (!form.location.trim()) next.location = "Please enter the location of the issue.";
    if (!form.description.trim()) next.description = "Please describe the problem.";
    if (form.latitude.trim() || form.longitude.trim()) {
      const lat = Number(form.latitude);
      const lng = Number(form.longitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90) next.latitude = "Latitude must be a number between -90 and 90.";
      if (Number.isNaN(lng) || lng < -180 || lng > 180) next.longitude = "Longitude must be a number between -180 and 180.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields before submitting.");
      return;
    }
    setPhase("scanning");
    setProgress(0);
    setStep(0);

    const report = addReport({
      title: `${form.category} reported at ${form.location.trim()}`,
      category: form.category as IssueType,
      description: form.description.trim(),
      location: form.location.trim(),
      latitude: form.latitude.trim() ? Number(form.latitude) : undefined,
      longitude: form.longitude.trim() ? Number(form.longitude) : undefined,
      photo,
    });
    setReportId(report.id);

    await runScan((pct, stepIdx) => {
      setProgress(pct);
      setStep(stepIdx);
    });

    const result = analyzeReport(
      form.category as IssueType,
      form.description.trim(),
      form.location.trim(),
    );
    finaliseReport(report.id, result);
    setAnalysis(result);
    setLetter(
      buildComplaintLetter({
        category: form.category as IssueType,
        description: form.description.trim(),
        location: form.location.trim(),
        severity: result.severity,
      }),
    );
    setPhase("result");
    toast.success("Report created with simulated AI analysis.");
  }

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
    a.download = "communityguardian-complaint.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Letter downloaded as a text file.");
  }

  if (phase === "scanning") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Card className="animate-fade-up">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <ScanSearch className="h-7 w-7 text-primary" aria-hidden="true" />
            </div>
            <CardTitle className="mt-2 text-xl">Simulated AI Analysis Running</CardTitle>
            <CardDescription>
              Watch how an AI assistant could triage your civic report. This is a
              demonstration — no real model is analysing your photo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {photo && (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img src={photo} alt="Uploaded report photo being scanned" className="w-full" />
                <div className="absolute inset-0 bg-primary/5" aria-hidden="true" />
                <div
                  className="animate-scanline absolute left-0 h-0.5 w-full bg-leaf shadow-[0_0_12px_var(--color-leaf)]"
                  aria-hidden="true"
                />
              </div>
            )}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{SCAN_STEPS[step]}</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} aria-label="Simulated analysis progress" />
            </div>
            <ul className="space-y-2" aria-live="polite">
              {SCAN_STEPS.map((label, i) => (
                <li key={label} className="flex items-center gap-2 text-sm">
                  {i < step ? (
                    <CheckCircle2 className="h-4 w-4 text-leaf" aria-hidden="true" />
                  ) : i === step ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border-2 border-border" aria-hidden="true" />
                  )}
                  <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "result" && analysis) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
        {/* AI analysis result */}
        <Card className="animate-fade-up">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ScanSearch className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>AI Analysis Result</CardTitle>
              <Badge variant="outline" className="border-info/30 text-info">
                Simulated
              </Badge>
            </div>
            <CardDescription>
              Generated from your selected category and description to demonstrate how AI could
              assist civic reporting. No real image analysis was performed.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-secondary/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Detected category
              </p>
              <div className="mt-2 flex items-center gap-2 font-semibold text-foreground">
                {form.category && <IssueIcon category={form.category} className="h-4 w-4 text-primary" />}
                {form.category}
              </div>
            </div>
            <div className="rounded-xl bg-secondary/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Suggested severity
              </p>
              <div className="mt-2 flex items-center gap-2">
                <SeverityBadge severity={analysis.severity} />
                <span className="text-sm text-muted-foreground">
                  Confidence {analysis.confidence}% (simulated)
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-border/70 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What the analysis found
              </p>
              <p className="mt-2 text-sm text-foreground">{analysis.aiSummary}</p>
            </div>
            <div className="rounded-xl border border-border/70 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Suggested action
              </p>
              <p className="mt-2 text-sm text-foreground">{analysis.suggestedAction}</p>
            </div>
          </CardContent>
        </Card>

        {/* Auto-generated complaint letter */}
        <Card className="animate-fade-up">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>Auto-Generated Complaint Letter</CardTitle>
            </div>
            <CardDescription>
              A formal draft based on your report. Edit it freely below — placeholders like
              [Your Name] are for you to fill in before sending.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              aria-label="Editable complaint letter"
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              rows={18}
              className="font-mono text-[13px] leading-relaxed"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyLetter}>
                <Copy aria-hidden="true" /> Copy Letter
              </Button>
              <Button variant="outline" onClick={downloadLetter}>
                <Download aria-hidden="true" /> Download as TXT
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPhase("form");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <Pencil aria-hidden="true" /> Edit Report
              </Button>
              {reportId && (
                <Button asChild variant="ghost" className="text-primary">
                  <Link to="/reports/$id" params={{ id: reportId }}>
                    <ClipboardCheck aria-hidden="true" /> View Report Details
                  </Link>
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Reminder: this is a demonstration. Nothing is submitted to a municipal authority —
              you would copy or download the letter and send it yourself.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // phase === "form"
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Report an Issue</h1>
        <p className="mt-3 text-muted-foreground">
          Upload a photo, describe the problem, and let the simulated AI prepare your report and
          complaint letter.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Photo evidence</CardTitle>
            <CardDescription>Optional, but a photo makes your report far stronger.</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
            {photo ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img src={photo} alt="Selected report photo preview" className="w-full" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-3 top-3"
                  aria-label="Remove photo"
                  onClick={() => setPhoto(undefined)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  void acceptFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                  dragOver
                    ? "border-primary bg-secondary/70"
                    : "border-border bg-secondary/40 hover:border-primary/50 hover:bg-secondary/60"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm">
                  <ImagePlus className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <span className="font-medium">Drag & drop a photo here, or click to browse</span>
                <span className="text-xs text-muted-foreground">JPG, PNG or WebP up to 6 MB</span>
                <Camera className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </button>
            )}
            {errors.photo && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {errors.photo}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Issue details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="issue-type">Issue type</Label>
              <Select
                value={form.category}
                onValueChange={(value) => update({ category: value as IssueType })}
              >
                <SelectTrigger id="issue-type" aria-invalid={!!errors.category} className="w-full">
                  <SelectValue placeholder="Select the type of civic issue" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center gap-2">
                        <IssueIcon category={type} className="h-4 w-4 text-primary" />
                        {type}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.category}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => update({ location: e.target.value })}
                  placeholder="Street, landmark or area — e.g. Palm Avenue Road, near Bus Stop 12"
                  className="pl-9"
                  aria-invalid={!!errors.location}
                />
              </div>
              {errors.location && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.location}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (optional)</Label>
                <Input
                  id="latitude"
                  inputMode="decimal"
                  value={form.latitude}
                  onChange={(e) => update({ latitude: e.target.value })}
                  placeholder="e.g. 12.9716"
                  aria-invalid={!!errors.latitude}
                />
                {errors.latitude && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.latitude}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (optional)</Label>
                <Input
                  id="longitude"
                  inputMode="decimal"
                  value={form.longitude}
                  onChange={(e) => update({ longitude: e.target.value })}
                  placeholder="e.g. 77.5946"
                  aria-invalid={!!errors.longitude}
                />
                {errors.longitude && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.longitude}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={5}
                placeholder="Describe what you see, since when, and who it affects — e.g. 'A deep pothole near the bus stop fills with water every time it rains and two-wheelers are swerving dangerously.'"
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" className="rounded-full px-8">
            <ScanSearch aria-hidden="true" /> Submit for AI Analysis
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => {
              setForm(EMPTY_FORM);
              setPhoto(undefined);
              setErrors({});
              fileInputRef.current?.form?.reset();
            }}
          >
            <X aria-hidden="true" /> Clear form
          </Button>
          <p className="text-xs text-muted-foreground">
            Demo notice: submissions are stored in your browser only.
          </p>
        </div>
      </form>
    </div>
  );
}
