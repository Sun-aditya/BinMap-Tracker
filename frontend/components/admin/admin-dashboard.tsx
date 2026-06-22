"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  LogOut,
  MapPin,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type PendingDustbin = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  operational_status: string;
  image_path: string | null;
  created_at: string;
};

type PendingReport = {
  id: string;
  dustbin_id: string;
  type: string;
  note: string;
  reported_latitude: number;
  reported_longitude: number;
  created_at: string;
  dustbins: { name: string } | Array<{ name: string }> | null;
};

function getReportedDustbinName(report: PendingReport) {
  if (Array.isArray(report.dustbins)) return report.dustbins[0]?.name ?? "Unknown dustbin";
  return report.dustbins?.name ?? "Unknown dustbin";
}

export default function AdminDashboard() {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dustbins, setDustbins] = useState<PendingDustbin[]>([]);
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadQueues = useCallback(async (activeSession: Session) => {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/moderation", {
      headers: { Authorization: `Bearer ${activeSession.access_token}` },
      cache: "no-store",
    });
    const body = await response.json();

    if (!response.ok) {
      setError(body.error || "Unable to load moderation queues.");
      setLoading(false);
      return;
    }

    setDustbins(body.dustbins ?? []);
    setReports(body.reports ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadQueues(data.session);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadQueues, supabase]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.session) {
      setError(signInError?.message || "Unable to sign in.");
      setLoading(false);
      return;
    }

    setSession(data.session);
    await loadQueues(data.session);
  };

  const moderateDustbin = async (id: string, action: "approve" | "reject") => {
    if (!session) return;
    setWorkingId(id);
    setError("");
    const response = await fetch(`/api/admin/dustbins/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, reason: "" }),
    });
    const body = await response.json();
    if (!response.ok) setError(body.error || "Unable to moderate this dustbin.");
    else setDustbins((current) => current.filter((dustbin) => dustbin.id !== id));
    setWorkingId(null);
  };

  const moderateReport = async (id: string, action: "resolve" | "dismiss") => {
    if (!session) return;
    setWorkingId(id);
    setError("");
    const response = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, note: "", removeDustbin: action === "resolve" }),
    });
    const body = await response.json();
    if (!response.ok) setError(body.error || "Unable to moderate this report.");
    else setReports((current) => current.filter((report) => report.id !== id));
    setWorkingId(null);
  };

  if (!supabase) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-binmap-bg px-5 text-binmap-text">
        <section className="max-w-lg rounded-2xl border border-white/10 bg-binmap-surface p-6 text-center">
          <CircleAlert className="mx-auto text-binmap-warning" size={30} />
          <h1 className="mt-4 font-display text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-2 text-sm leading-6 text-binmap-muted">
            Add the Supabase environment values before using administrator login.
          </p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-binmap-bg px-5 text-binmap-text">
        <form onSubmit={signIn} className="w-full max-w-md rounded-2xl border border-white/10 bg-binmap-surface p-6 shadow-soft">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-binmap-muted hover:text-binmap-text">
            <ArrowLeft size={16} /> Back to BinMap
          </Link>
          <h1 className="mt-6 font-display text-3xl font-semibold">Administrator login</h1>
          <p className="mt-2 text-sm text-binmap-muted">Review community submissions and reports.</p>
          <label className="mt-6 block text-sm font-semibold">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/50 px-4 outline-none focus:border-binmap-primary"
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/50 px-4 outline-none focus:border-binmap-primary"
            />
          </label>
          {error ? <p className="mt-3 text-sm text-binmap-danger">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 min-h-12 w-full rounded-xl bg-binmap-primary px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-binmap-bg px-5 py-6 text-binmap-text sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-binmap-primary text-white"><Trash2 size={20} /></span>
            <div>
              <h1 className="font-display text-2xl font-semibold">Moderation</h1>
              <p className="text-sm text-binmap-muted">Pending community activity</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadQueues(session)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
              aria-label="Refresh queues"
            ><RefreshCw size={17} /></button>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold"
            ><LogOut size={16} /> Sign out</button>
          </div>
        </header>

        {error ? <p className="mt-5 rounded-xl border border-binmap-danger/25 bg-binmap-danger/10 p-3 text-sm text-binmap-danger">{error}</p> : null}
        {loading ? <p className="mt-8 text-binmap-muted">Loading moderation queues...</p> : null}

        <section className="py-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Dustbin submissions</h2>
            <span className="text-sm text-binmap-muted">{dustbins.length} pending</span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {dustbins.map((dustbin) => (
              <article key={dustbin.id} className="rounded-2xl border border-white/10 bg-binmap-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-semibold">{dustbin.name}</h3><p className="mt-1 text-sm text-binmap-muted">{dustbin.description}</p></div>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-binmap-muted">{dustbin.operational_status}</span>
                </div>
                <p className="mt-4 flex items-center gap-2 text-sm text-binmap-muted"><MapPin size={15} />{dustbin.latitude.toFixed(5)}, {dustbin.longitude.toFixed(5)}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" disabled={workingId === dustbin.id} onClick={() => moderateDustbin(dustbin.id, "reject")} className="min-h-10 rounded-xl border border-binmap-danger/25 text-sm font-semibold text-binmap-danger"><X size={16} className="mr-2 inline" />Reject</button>
                  <button type="button" disabled={workingId === dustbin.id} onClick={() => moderateDustbin(dustbin.id, "approve")} className="min-h-10 rounded-xl bg-binmap-success/15 text-sm font-semibold text-binmap-success"><Check size={16} className="mr-2 inline" />Approve</button>
                </div>
              </article>
            ))}
          </div>
          {!loading && dustbins.length === 0 ? <p className="mt-4 text-sm text-binmap-muted">No pending submissions.</p> : null}
        </section>

        <section className="border-t border-white/10 py-8">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Missing dustbin reports</h2><span className="text-sm text-binmap-muted">{reports.length} pending</span></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {reports.map((report) => (
              <article key={report.id} className="rounded-2xl border border-white/10 bg-binmap-surface p-5">
                <h3 className="font-semibold">{getReportedDustbinName(report)}</h3>
                <p className="mt-2 text-sm text-binmap-muted">{report.note || "No additional note provided."}</p>
                <p className="mt-4 flex items-center gap-2 text-sm text-binmap-muted"><MapPin size={15} />{report.reported_latitude.toFixed(5)}, {report.reported_longitude.toFixed(5)}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" disabled={workingId === report.id} onClick={() => moderateReport(report.id, "dismiss")} className="min-h-10 rounded-xl border border-white/10 text-sm font-semibold"><X size={16} className="mr-2 inline" />Dismiss</button>
                  <button type="button" disabled={workingId === report.id} onClick={() => moderateReport(report.id, "resolve")} className="min-h-10 rounded-xl bg-binmap-danger/15 text-sm font-semibold text-binmap-danger"><Check size={16} className="mr-2 inline" />Confirm missing</button>
                </div>
              </article>
            ))}
          </div>
          {!loading && reports.length === 0 ? <p className="mt-4 text-sm text-binmap-muted">No pending reports.</p> : null}
        </section>
      </div>
    </main>
  );
}
