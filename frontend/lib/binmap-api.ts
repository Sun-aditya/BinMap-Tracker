import type { DustbinStatus } from "@/components/map/dustbin-data";
import type { Coordinates } from "@/components/map/map-utils";

export type ApiDustbin = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  status: DustbinStatus;
  imagePath: string | null;
  lastUpdated: string;
  distanceKm: number;
};

export async function fetchNearbyDustbins(origin: Coordinates, radiusMeters = 3000) {
  const params = new URLSearchParams({
    lat: String(origin.lat),
    lng: String(origin.lng),
    radius: String(radiusMeters),
  });
  const response = await fetch(`/api/dustbins?${params.toString()}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Unable to load nearby dustbins.");
  }

  return (await response.json()) as {
    configured: boolean;
    dustbins: ApiDustbin[];
  };
}

export async function submitDustbin(formData: FormData) {
  const response = await fetch("/api/dustbins", {
    method: "POST",
    body: formData,
  });
  const body = (await response.json()) as {
    id?: string;
    status?: "pending";
    error?: string;
    code?: string;
  };

  if (response.status === 503 && body.code === "SUPABASE_NOT_CONFIGURED") {
    return { persisted: false, id: `demo-${Date.now()}`, status: "pending" as const };
  }

  if (!response.ok || !body.id) {
    throw new Error(body.error || "Unable to submit this dustbin.");
  }

  return { persisted: true, id: body.id, status: "pending" as const };
}

export async function submitMissingReport(
  dustbinId: string,
  note: string,
  location: Coordinates,
  backendConfigured: boolean,
) {
  if (!backendConfigured) {
    return { persisted: false, id: `demo-report-${Date.now()}`, status: "pending" as const };
  }

  const response = await fetch(`/api/dustbins/${encodeURIComponent(dustbinId)}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note, lat: location.lat, lng: location.lng }),
  });
  const body = (await response.json()) as {
    id?: string;
    status?: "pending";
    error?: string;
  };

  if (!response.ok || !body.id) {
    throw new Error(body.error || "Unable to submit this report.");
  }

  return { persisted: true, id: body.id, status: "pending" as const };
}
