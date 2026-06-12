"use client";

import dynamic from "next/dynamic";

const AddDustbinExperience = dynamic(() => import("./add-dustbin-experience"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-screen items-center justify-center bg-binmap-bg px-5 text-binmap-text">
      <div className="rounded-2xl border border-white/10 bg-binmap-surface p-6 text-center shadow-soft">
        <p className="font-display text-2xl font-semibold">Opening contribution form</p>
        <p className="mt-2 text-sm text-binmap-muted">Preparing the location picker.</p>
      </div>
    </main>
  ),
});

export default function AddDustbinPageShell() {
  return <AddDustbinExperience />;
}
