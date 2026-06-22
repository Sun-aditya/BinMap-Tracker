"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { MapContainer } from "react-leaflet/MapContainer";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  LocateFixed,
  MapPin,
  RotateCcw,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { CHANDIGARH_CENTER, type DustbinStatus } from "@/components/map/dustbin-data";
import { getStatusClass, getStatusLabel, type Coordinates } from "@/components/map/map-utils";
import { submitDustbin } from "@/lib/binmap-api";

type SubmissionState = {
  id: string;
  name: string;
  description: string;
  status: DustbinStatus;
  lat: number;
  lng: number;
  submittedAt: string;
  approvalStatus: "pending";
  persisted: boolean;
};

type LocationState = "idle" | "locating" | "granted" | "fallback" | "unsupported";

const selectedLocationIcon = L.divIcon({
  className: "binmap-selected-marker",
  html: "<span></span>",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

const statusOptions: Array<{ value: DustbinStatus; helper: string }> = [
  { value: "available", helper: "Ready to use" },
  { value: "full", helper: "Needs emptying" },
  { value: "damaged", helper: "Needs repair" },
];

function RecenterMap({ center }: { center: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], 16, { animate: true });
  }, [center, map]);

  return null;
}

function LocationPicker({
  selectedLocation,
  mapCenter,
  onSelect,
}: {
  selectedLocation: Coordinates | null;
  mapCenter: Coordinates;
  onSelect: (location: Coordinates) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return (
    <>
      <RecenterMap center={selectedLocation ?? mapCenter} />
      {selectedLocation ? (
        <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={selectedLocationIcon}>
          <Popup>Selected dustbin location</Popup>
        </Marker>
      ) : null}
    </>
  );
}

export default function AddDustbinExperience() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<DustbinStatus>("available");
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [mapCenter, setMapCenter] = useState<Coordinates>(CHANDIGARH_CENTER);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submittedDustbin, setSubmittedDustbin] = useState<SubmissionState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const canSubmit = name.trim().length > 2 && description.trim().length > 5 && Boolean(selectedLocation);

  const locationText = useMemo(() => {
    if (locationState === "locating") {
      return "Finding your current location...";
    }

    if (locationState === "granted") {
      return "Current location selected. You can adjust it on the map.";
    }

    if (locationState === "fallback") {
      return "Location permission was not available. Chandigarh is shown.";
    }

    if (locationState === "unsupported") {
      return "Your browser does not support location. Chandigarh is shown.";
    }

    return "Tap the map or use your current location.";
  }, [locationState]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const useCurrentLocation = () => {
    setLocationState("locating");

    if (!navigator.geolocation) {
      setMapCenter(CHANDIGARH_CENTER);
      setLocationState("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setMapCenter(location);
        setSelectedLocation(location);
        setLocationState("granted");
      },
      () => {
        setMapCenter(CHANDIGARH_CENTER);
        setLocationState("fallback");
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      },
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || !selectedLocation) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("description", description.trim());
    formData.set("status", status);
    formData.set("lat", String(selectedLocation.lat));
    formData.set("lng", String(selectedLocation.lng));
    if (imageFile) formData.set("image", imageFile);

    try {
      const result = await submitDustbin(formData);
      setSubmittedDustbin({
        id: result.id,
        name: name.trim(),
        description: description.trim(),
        status,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        submittedAt: new Date().toISOString(),
        approvalStatus: result.status,
        persisted: result.persisted,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit this dustbin.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus("available");
    setSelectedLocation(null);
    setImageFile(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(null);
    setSubmittedDustbin(null);
    setLocationState("idle");
    setSubmitError("");
  };

  if (submittedDustbin) {
    return (
      <main className="min-h-screen bg-binmap-bg px-5 py-6 text-binmap-text sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
          <section className="w-full rounded-2xl border border-white/10 bg-binmap-surface p-6 text-center shadow-soft sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-binmap-success/15 text-binmap-success">
              <CheckCircle2 size={28} />
            </div>
            <p className="mt-6 font-display text-3xl font-semibold">Submitted for review</p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-binmap-muted">
              {submittedDustbin.persisted
                ? "Thanks for helping grow BinMap. An administrator will review this location before it appears publicly."
                : "Supabase is not configured yet, so this was completed in demo mode and was not saved permanently."}
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold">{submittedDustbin.name}</p>
                  <p className="mt-1 text-sm text-binmap-muted">{submittedDustbin.description}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(submittedDustbin.status)}`}>
                  {getStatusLabel(submittedDustbin.status)}
                </span>
              </div>
              <p className="mt-4 text-sm text-binmap-muted">
                Location: {submittedDustbin.lat.toFixed(5)}, {submittedDustbin.lng.toFixed(5)}
              </p>
              <p className="mt-2 text-sm text-binmap-muted">Approval status: {submittedDustbin.approvalStatus}</p>
              <p className="mt-2 text-xs text-binmap-muted">Reference: {submittedDustbin.id}</p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/map"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-binmap-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-500"
              >
                Back to Map
                <MapPin size={17} />
              </Link>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-binmap-text transition hover:bg-white/[0.08]"
              >
                Submit Another
                <RotateCcw size={17} />
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-binmap-bg px-5 py-6 text-binmap-text sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/map"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-binmap-muted transition hover:text-binmap-text"
              aria-label="Back to map"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-binmap-primary text-white">
                <Trash2 size={20} />
              </span>
              <div>
                <p className="font-display text-xl font-semibold">Add a Dustbin</p>
                <p className="text-sm text-binmap-muted">Submit a public location for review</p>
              </div>
            </div>
          </div>
          <Link
            href="/map"
            className="hidden min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-binmap-text transition hover:bg-white/[0.08] sm:inline-flex"
          >
            Back to Map
          </Link>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-2xl border border-white/10 bg-binmap-surface p-5 shadow-soft sm:p-6">
            <div>
              <p className="font-display text-2xl font-semibold">Dustbin details</p>
              <p className="mt-2 text-sm leading-6 text-binmap-muted">
                Add enough context so reviewers and nearby users can recognize the spot.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold">Landmark or name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Example: Sector 17 Plaza entrance"
                  className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/50 px-4 text-sm text-binmap-text outline-none transition placeholder:text-binmap-muted focus:border-binmap-primary"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Mention nearby gate, footpath, shop, or public landmark."
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm leading-6 text-binmap-text outline-none transition placeholder:text-binmap-muted focus:border-binmap-primary"
                />
              </label>

              <div>
                <p className="text-sm font-semibold">Current status</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className={`rounded-xl border p-4 text-left transition ${
                        status === option.value
                          ? getStatusClass(option.value)
                          : "border-white/10 bg-white/[0.035] text-binmap-muted hover:bg-white/[0.06]"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{getStatusLabel(option.value)}</span>
                      <span className="mt-1 block text-xs">{option.helper}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Dustbin image</p>
                <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/45 p-5 text-center transition hover:border-binmap-primary/70">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Selected dustbin preview"
                      width={720}
                      height={420}
                      className="max-h-56 w-full rounded-xl object-cover"
                      unoptimized
                    />
                  ) : (
                    <>
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-binmap-primary/15 text-binmap-primary">
                        <Upload size={22} />
                      </span>
                      <span className="mt-3 text-sm font-semibold">Upload a photo</span>
                      <span className="mt-1 text-xs text-binmap-muted">PNG, JPG, or WEBP preview only for now</span>
                    </>
                  )}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="sr-only" />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-binmap-surface p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-2xl font-semibold">Pick location</p>
                <p className="mt-2 text-sm leading-6 text-binmap-muted">{locationText}</p>
              </div>
              <button
                type="button"
                onClick={useCurrentLocation}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-binmap-text transition hover:bg-white/[0.08]"
              >
                <LocateFixed size={17} />
                Use my location
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
              <MapContainer
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={16}
                scrollWheelZoom
                className="h-[360px] w-full sm:h-[470px]"
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker selectedLocation={selectedLocation} mapCenter={mapCenter} onSelect={setSelectedLocation} />
              </MapContainer>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-binmap-primary/15 text-binmap-primary">
                  <Camera size={18} />
                </span>
                <div>
                  <p className="font-semibold">Selected coordinates</p>
                  <p className="mt-1 text-sm text-binmap-muted">
                    {selectedLocation
                      ? `${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`
                      : "No location selected yet."}
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-4 mt-5 rounded-2xl border border-white/10 bg-binmap-bg/95 p-3 backdrop-blur">
              {submitError ? <p className="mb-3 text-sm text-binmap-danger">{submitError}</p> : null}
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-binmap-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-binmap-muted"
              >
                {submitting ? "Submitting..." : "Submit for Review"}
                <Send size={17} />
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}
