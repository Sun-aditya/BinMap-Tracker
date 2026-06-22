import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { dustbinIdSchema, missingReportSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const dustbinId = dustbinIdSchema.safeParse(id);
  if (!dustbinId.success) {
    return NextResponse.json({ error: "Invalid dustbin." }, { status: 400 });
  }

  const ip = getRequestIp(request);
  const rateLimit = checkRateLimit(`dustbin-report:${ip}`, 10, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many reports. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = missingReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report details." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const { data: dustbin } = await supabase
    .from("dustbins")
    .select("id")
    .eq("id", dustbinId.data)
    .eq("moderation_status", "approved")
    .maybeSingle();

  if (!dustbin) {
    return NextResponse.json({ error: "Dustbin not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("dustbin_reports")
    .insert({
      dustbin_id: dustbinId.data,
      type: "missing",
      note: parsed.data.note,
      reported_latitude: parsed.data.lat,
      reported_longitude: parsed.data.lng,
      status: "pending",
    })
    .select("id, status")
    .single();

  if (error) {
    console.error("Dustbin report failed", error);
    return NextResponse.json({ error: "Unable to submit this report." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, status: data.status }, { status: 201 });
}
