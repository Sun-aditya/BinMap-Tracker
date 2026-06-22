import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import {
  allowedImageTypes,
  dustbinSubmissionSchema,
  maxImageBytes,
  nearbyDustbinsSchema,
} from "@/lib/validation";

type NearbyDustbinRow = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  operational_status: "available" | "full" | "damaged";
  image_path: string | null;
  updated_at: string;
  distance_meters: number;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = nearbyDustbinsSchema.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
    radius: url.searchParams.get("radius") ?? 3000,
  });

  if (!query.success) {
    return NextResponse.json({ error: "Invalid location query." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ configured: false, dustbins: [] });
  }

  const { data, error } = await supabase.rpc("nearby_dustbins", {
    p_latitude: query.data.lat,
    p_longitude: query.data.lng,
    p_radius_meters: query.data.radius,
  });

  if (error) {
    console.error("Nearby dustbin query failed", error);
    return NextResponse.json({ error: "Unable to load nearby dustbins." }, { status: 500 });
  }

  const dustbins = ((data ?? []) as NearbyDustbinRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    lat: row.latitude,
    lng: row.longitude,
    status: row.operational_status,
    imagePath: row.image_path,
    lastUpdated: row.updated_at,
    distanceKm: Number(row.distance_meters) / 1000,
  }));

  return NextResponse.json({ configured: true, dustbins });
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const rateLimit = checkRateLimit(`dustbin-submission:${ip}`, 5, 60 * 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const parsed = dustbinSubmissionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    status: formData.get("status"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the submitted dustbin details." }, { status: 400 });
  }

  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    if (!allowedImageTypes.has(image.type) || image.size > maxImageBytes) {
      return NextResponse.json(
        { error: "Image must be a JPG, PNG, or WEBP file under 5 MB." },
        { status: 400 },
      );
    }
  }

  const dustbinId = crypto.randomUUID();
  let imagePath: string | null = null;

  if (image instanceof File && image.size > 0) {
    const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
    imagePath = `${dustbinId}/${crypto.randomUUID()}.${extension}`;
    const bytes = await image.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("dustbin-images")
      .upload(imagePath, bytes, { contentType: image.type, upsert: false });

    if (uploadError) {
      console.error("Dustbin image upload failed", uploadError);
      return NextResponse.json({ error: "Unable to upload the image." }, { status: 500 });
    }
  }

  const { error } = await supabase.from("dustbins").insert({
    id: dustbinId,
    name: parsed.data.name,
    description: parsed.data.description,
    latitude: parsed.data.lat,
    longitude: parsed.data.lng,
    operational_status: parsed.data.status,
    moderation_status: "pending",
    image_path: imagePath,
  });

  if (error) {
    if (imagePath) {
      await supabase.storage.from("dustbin-images").remove([imagePath]);
    }
    console.error("Dustbin submission failed", error);
    return NextResponse.json({ error: "Unable to submit this dustbin." }, { status: 500 });
  }

  return NextResponse.json({ id: dustbinId, status: "pending" }, { status: 201 });
}
