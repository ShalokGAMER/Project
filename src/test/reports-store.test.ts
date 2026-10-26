import { beforeEach, describe, expect, it } from "vitest";

import { buildComplaintLetter, estimateSeverity } from "@/lib/ai-sim";
import { addReport, getReports, setStatus, toggleUpvote } from "@/lib/reports";

describe("CommunityGuardian demo store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("seeds clearly-labelled sample reports on first run", () => {
    const reports = getReports();
    expect(reports.length).toBeGreaterThanOrEqual(6);
    expect(reports.every((r) => r.isSample)).toBe(true);
  });

  it("toggles upvotes per report and updates the count immediately", () => {
    const before = getReports()[0];
    toggleUpvote(before.id);
    const afterUp = getReports().find((r) => r.id === before.id);
    expect(afterUp?.upvotes).toBe(before.upvotes + 1);
    expect(afterUp?.upvotedByMe).toBe(true);
    toggleUpvote(before.id);
    const afterDown = getReports().find((r) => r.id === before.id);
    expect(afterDown?.upvotes).toBe(before.upvotes);
    expect(afterDown?.upvotedByMe).toBe(false);
  });

  it("moves a report along Reported → AI Verified → In Progress → Resolved", () => {
    const report = addReport({
      title: "Test pothole",
      category: "Pothole",
      description: "A test pothole",
      location: "Test Street",
    });
    expect(report.status).toBe("Pending");
    setStatus(report.id, "Resolved");
    const updated = getReports().find((r) => r.id === report.id);
    expect(updated?.status).toBe("Resolved");
    expect(updated?.timeline.map((t) => t.label)).toEqual([
      "Reported",
      "AI Verified",
      "In Progress",
      "Resolved",
    ]);
  });

  it("estimates severity from the user's description keywords", () => {
    expect(estimateSeverity("Pothole", "deep pothole near a school, child could be hurt, traffic danger")).toBe(
      "Critical",
    );
    expect(estimateSeverity("Other", "faded paint on a bench")).toBe("Low");
  });

  it("drafts a formal complaint letter without inventing real officials", () => {
    const letter = buildComplaintLetter({
      category: "Pothole",
      description: "A deep pothole collecting rainwater",
      location: "Palm Avenue Road",
      severity: "Critical",
    });
    expect(letter).toContain("Subject: Complaint Regarding a pothole at Palm Avenue Road");
    expect(letter).toContain("Palm Avenue Road");
    expect(letter).toContain("[Your Name]");
    expect(letter).toContain("Urgent inspection");
  });
});
