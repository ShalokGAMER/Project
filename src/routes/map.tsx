import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LayoutList, Map as MapIcon } from "lucide-react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge, EmptyState, ReportCard } from "@/components/report-bits";
import { useReports, type CommunityReport, type Severity } from "@/lib/reports";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      {
        title: "Community Map — CommunityGuardian",
        description:
          "Interactive neighborhood map of community-reported civic issues, colored by severity, with a synchronized list view. Demonstration data included.",
      },
      { property: "og:title", content: "Community Map — CommunityGuardian" },
      {
        property: "og:description",
        content:
          "Explore community-reported civic issues on an interactive map — potholes, garbage, streetlights and more, colored by severity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

const MAP_CENTER: [number, number] = [12.9722, 77.594];

const LEGEND: { severity: Severity; label: string }[] = [
  { severity: "Low", label: "Low severity" },
  { severity: "Medium", label: "Medium severity" },
  { severity: "Critical", label: "Critical severity" },
];

function MapPanel({ reports }: { reports: CommunityReport[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);

  // Leaflet is browser-only: import it inside the effect so SSR never touches it.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current).setView(MAP_CENTER, 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void (async () => {
      const L = await import("leaflet");
      const layer = layerRef.current;
      if (!layer) return;
      layer.clearLayers();
      const positioned = reports.filter(
        (r) => typeof r.latitude === "number" && typeof r.longitude === "number",
      );
      for (const report of positioned) {
        const icon = L.divIcon({
          className: "cg-marker-wrap",
          html: `<span class="cg-marker cg-marker--${report.severity.toLowerCase()}"></span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const marker = L.marker([report.latitude as number, report.longitude as number], {
          icon,
          title: report.title,
        });

        // Build the popup via DOM APIs so user text is never injected as HTML.
        const box = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = report.title;
        const meta = document.createElement("div");
        meta.textContent = `${report.category} · Severity: ${report.severity} · Status: ${report.status}`;
        meta.style.cssText = "margin-top:4px;font-size:12px;color:#52525b";
        const location = document.createElement("div");
        location.textContent = report.location;
        location.style.cssText = "margin-top:2px;font-size:12px";
        const link = document.createElement("a");
        link.href = `/reports/${report.id}`;
        link.textContent = "View details →";
        link.style.cssText =
          "display:inline-block;margin-top:6px;font-weight:600;color:var(--color-primary);text-decoration:none";
        box.append(title, meta, location, link);

        marker.bindPopup(box);
        marker.addTo(layer);
      }
    })();
  }, [ready, reports]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70">
      <div ref={containerRef} className="h-[420px] w-full sm:h-[520px]" role="application" aria-label="Community issue map" />
      <div className="pointer-events-none absolute right-3 top-3 z-[500] rounded-xl border border-border/70 bg-card/95 p-3 shadow-md backdrop-blur">
        <p className="text-xs font-semibold">Severity</p>
        <ul className="mt-2 space-y-1.5">
          {LEGEND.map((item) => (
            <li key={item.severity} className="flex items-center gap-2 text-xs">
              <span className={`cg-marker cg-marker--${item.severity.toLowerCase()}`} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MapPage() {
  const reports = useReports();
  const [view, setView] = useState<"map" | "list">("map");
  const positionedCount = reports.filter(
    (r) => typeof r.latitude === "number" && typeof r.longitude === "number",
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Community Map</h1>
          <p className="mt-3 text-muted-foreground">
            Every pinned issue in the demo neighborhood, colored by severity. Click a marker for
            details. Sample reports are marked "Demo data".
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Switch between map and list view">
          <Button
            variant={view === "map" ? "default" : "outline"}
            onClick={() => setView("map")}
            aria-pressed={view === "map"}
          >
            <MapIcon aria-hidden="true" /> Map
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            <LayoutList aria-hidden="true" /> List
          </Button>
        </div>
      </div>

      <div className="mt-8">
        {view === "map" ? (
          positionedCount > 0 ? (
            <MapPanel reports={reports} />
          ) : (
            <EmptyState
              title="No reports have coordinates yet"
              hint="Add latitude and longitude when reporting an issue to see it pinned here."
            />
          )
        ) : (
          <Card>
            <div className="p-4 sm:p-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
              {reports.length === 0 && (
                <EmptyState title="No reports yet" hint="Report an issue to populate the community map." />
              )}
            </div>
          </Card>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <DemoBadge />
        <p className="text-xs text-muted-foreground">
          Demonstration data around a fictional neighborhood — the map is rendered with OpenStreetMap
          tiles. {positionedCount} of {reports.length} reports have coordinates and appear as markers.
        </p>
      </div>
    </div>
  );
}
