import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/lib/supabase/authorize-admin";
import { reportIdSchema } from "@/lib/validation";

const actionSchema = z.object({
  action: z.enum(["resolve", "dismiss"]),
  note: z.string().trim().max(500).default(""),
  removeDustbin: z.boolean().default(false),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const reportId = reportIdSchema.safeParse(id);
  const body = actionSchema.safeParse(await request.json().catch(() => null));
  if (!reportId.success || !body.success) {
    return NextResponse.json({ error: "Invalid report action." }, { status: 400 });
  }

  const { data: report } = await auth.supabase
    .from("dustbin_reports")
    .select("dustbin_id")
    .eq("id", reportId.data)
    .eq("status", "pending")
    .maybeSingle();

  if (!report) {
    return NextResponse.json({ error: "Pending report not found." }, { status: 404 });
  }

  const { error } = await auth.supabase
    .from("dustbin_reports")
    .update({
      status: body.data.action === "resolve" ? "resolved" : "dismissed",
      resolution_note: body.data.note || null,
      resolved_by: auth.user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId.data);

  if (error) {
    return NextResponse.json({ error: "Unable to update this report." }, { status: 500 });
  }

  if (body.data.action === "resolve" && body.data.removeDustbin) {
    const { error: removeError } = await auth.supabase
      .from("dustbins")
      .update({
        moderation_status: "removed",
        reviewed_by: auth.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", report.dustbin_id);

    if (removeError) {
      console.error("Reported dustbin removal failed", removeError);
      return NextResponse.json(
        { error: "Report resolved, but the dustbin could not be removed." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    id: reportId.data,
    status: body.data.action === "resolve" ? "resolved" : "dismissed",
  });
}
