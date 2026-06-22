import "server-only";

import { createSupabaseAdminClient } from "./admin";

export async function authorizeAdmin(request: Request) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { authorized: false as const, status: 503, error: "Supabase is not configured." };
  }

  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return { authorized: false as const, status: 401, error: "Authentication required." };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { authorized: false as const, status: 401, error: "Invalid session." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { authorized: false as const, status: 403, error: "Administrator access required." };
  }

  return { authorized: true as const, supabase, user: data.user };
}
