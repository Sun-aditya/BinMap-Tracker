import { z } from "zod";

export const nearbyDustbinsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(1).max(25000).default(3000),
});

export const dustbinSubmissionSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(6).max(500),
  status: z.enum(["available", "full", "damaged"]),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const missingReportSchema = z.object({
  note: z.string().trim().max(500).default(""),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const dustbinIdSchema = z.string().uuid();
export const reportIdSchema = z.string().uuid();

export const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
export const maxImageBytes = 5 * 1024 * 1024;
