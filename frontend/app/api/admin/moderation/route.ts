import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/supabase/authorize-admin";

export async function GET(request: Request) {
  const auth = await authorizeAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [dustbinsResult, reportsResult] = await Promise.all([
    auth.supabase
      .from("dustbins")
      .select("id, name, description, latitude, longitude, operational_status, image_path, created_at")
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: true }),
    auth.supabase
      .from("dustbin_reports")
      .select("id, dustbin_id, type, note, reported_latitude, reported_longitude, created_at, dustbins(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  if (dustbinsResult.error || reportsResult.error) {
    console.error("Moderation queue failed", dustbinsResult.error || reportsResult.error);
    return NextResponse.json({ error: "Unable to load moderation queues." }, { status: 500 });
  }

  return NextResponse.json({
    dustbins: dustbinsResult.data ?? [],
    reports: reportsResult.data ?? [],
  });
}
