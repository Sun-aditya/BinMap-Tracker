"use client";

import dynamic from "next/dynamic";

const MapExperience = dynamic(() => import("./map-experience"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-screen items-center justify-center bg-binmap-bg px-5 text-binmap-text">
      <div className="rounded-2xl border border-white/10 bg-binmap-surface p-6 text-center shadow-soft">
        <p className="font-display text-2xl font-semibold">Loading BinMap</p>
        <p className="mt-2 text-sm text-binmap-muted">Preparing the map and nearby dustbins.</p>
      </div>
    </main>
  ),
});

export default function MapPageShell() {
  return <MapExperience />;
}
