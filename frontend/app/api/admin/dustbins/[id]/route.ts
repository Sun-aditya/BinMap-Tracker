import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/lib/supabase/authorize-admin";
import { dustbinIdSchema } from "@/lib/validation";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "remove"]),
  reason: z.string().trim().max(500).default(""),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const dustbinId = dustbinIdSchema.safeParse(id);
  const body = actionSchema.safeParse(await request.json().catch(() => null));
  if (!dustbinId.success || !body.success) {
    return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 });
  }

  const moderationStatus = {
    approve: "approved",
    reject: "rejected",
    remove: "removed",
  }[body.data.action];

  const { error } = await auth.supabase
    .from("dustbins")
    .update({
      moderation_status: moderationStatus,
      rejection_reason: body.data.reason || null,
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", dustbinId.data);

  if (error) {
    console.error("Dustbin moderation failed", error);
    return NextResponse.json({ error: "Unable to update this dustbin." }, { status: 500 });
  }

  return NextResponse.json({ id: dustbinId.data, status: moderationStatus });
}
