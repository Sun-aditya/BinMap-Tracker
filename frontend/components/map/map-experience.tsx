"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Circle, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { MapContainer } from "react-leaflet/MapContainer";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Flag,
  LocateFixed,
  MapPin,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  CHANDIGARH_CENTER,
  SEARCH_RADIUS_KM,
  demoDustbins,
  type Dustbin,
  type DustbinStatus,
} from "./dustbin-data";
import {
  createGoogleMapsDirectionsUrl,
  distanceInKm,
  getStatusClass,
  getStatusLabel,
  type Coordinates,
} from "./map-utils";
import { fetchNearbyDustbins, submitMissingReport } from "@/lib/binmap-api";

type LocationState = "locating" | "granted" | "fallback" | "unsupported";
type DataState = "loading" | "ready" | "fallback";

type NearbyDustbin = Dustbin & {
  distanceKm: number;
  imagePath?: string | null;
};

const statusMarkerClasses: Record<DustbinStatus, string> = {
  available: "binmap-marker binmap-marker-available",
  full: "binmap-marker binmap-marker-full",
  damaged: "binmap-marker binmap-marker-damaged",
};

const userIcon = L.divIcon({
  className: "binmap-user-marker",
  html: "<span></span>",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function createDustbinIcon(status: DustbinStatus) {
  return L.divIcon({
    className: statusMarkerClasses[status],
    html: "<span></span>",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

function getDemoNearby(origin: Coordinates): NearbyDustbin[] {
  return demoDustbins
    .map((dustbin) => ({ ...dustbin, distanceKm: distanceInKm(origin, dustbin) }))
    .filter((dustbin) => dustbin.distanceKm <= SEARCH_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

function RecenterMap({ center }: { center: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], 15, { animate: true });
  }, [center, map]);

  return null;
}

function Header() {
  return (
    <header className="absolute left-4 right-4 top-4 z-[500] flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-binmap-bg p-3 text-binmap-text shadow-soft md:left-6 md:right-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-binmap-muted transition hover:text-binmap-text"
          aria-label="Back to landing page"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden h-10 w-10 items-center justify-center rounded-xl bg-binmap-primary text-white sm:flex">
            <Trash2 size={20} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold leading-tight">BinMap</p>
            <p className="text-xs text-binmap-muted">Nearby public dustbins</p>
          </div>
        </div>
      </div>
      <Link
        href="/add-dustbin"
        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-binmap-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">Add a Dustbin</span>
        <span className="sm:hidden">Add</span>
      </Link>
    </header>
  );
}

function StatusBadge({ status }: { status: DustbinStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function InfoPanel({
  locationState,
  dataState,
  nearbyDustbins,
  selectedDustbin,
  origin,
  reportedDustbinIds,
  onSelect,
  onLocateAgain,
  onSubmitReport,
}: {
  locationState: LocationState;
  dataState: DataState;
  nearbyDustbins: NearbyDustbin[];
  selectedDustbin: NearbyDustbin | null;
  origin: Coordinates;
  reportedDustbinIds: Set<string>;
  onSelect: (dustbin: NearbyDustbin) => void;
  onLocateAgain: () => void;
  onSubmitReport: (dustbin: NearbyDustbin, note: string) => Promise<void>;
}) {
  const [reportingDustbinId, setReportingDustbinId] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [reportError, setReportError] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const directionsHref = selectedDustbin
    ? createGoogleMapsDirectionsUrl(origin, selectedDustbin)
    : null;
  const selectedIsReported = selectedDustbin
    ? reportedDustbinIds.has(selectedDustbin.id)
    : false;
  const selectedIsReporting = selectedDustbin?.id === reportingDustbinId;

  const cancelReport = () => {
    setReportingDustbinId(null);
    setReportNote("");
    setReportError("");
  };

  const submitReport = async () => {
    if (!selectedDustbin) return;
    setSubmittingReport(true);
    setReportError("");

    try {
      await onSubmitReport(selectedDustbin, reportNote);
      cancelReport();
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Unable to submit this report.");
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <aside className="absolute bottom-4 left-4 right-4 z-[500] max-h-[48vh] overflow-hidden rounded-2xl border border-white/10 bg-binmap-bg text-binmap-text shadow-soft md:bottom-6 md:left-6 md:right-auto md:top-24 md:flex md:max-h-[calc(100vh-8rem)] md:w-[380px] md:flex-col">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl font-semibold">Dustbins within 3 km</p>
            <p className="mt-1 text-sm text-binmap-muted">
              {getLocationMessage(locationState, dataState)}
            </p>
          </div>
          <button
            type="button"
            onClick={onLocateAgain}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-binmap-muted transition hover:text-binmap-text"
            aria-label="Locate again"
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto p-4">
        {selectedDustbin ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-binmap-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold text-binmap-text">{selectedDustbin.name}</p>
                <p className="mt-1 text-sm text-binmap-muted">{selectedDustbin.description}</p>
              </div>
              <StatusBadge status={selectedDustbin.status} />
            </div>
            <div className="mt-4 flex items-center gap-3 text-sm text-binmap-muted">
              <MapPin size={16} className="text-binmap-primary" />
              {selectedDustbin.distanceKm.toFixed(1)} km away
            </div>
            <a
              href={directionsHref ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-binmap-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500"
            >
              Get Directions
              <ExternalLink size={16} />
            </a>

            {selectedIsReported ? (
              <div className="mt-3 rounded-xl border border-binmap-danger/25 bg-binmap-danger/10 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-binmap-danger">
                  <CheckCircle2 size={16} />
                  Reported missing
                </div>
                <p className="mt-1 text-xs leading-5 text-binmap-muted">
                  Thanks. This location will be reviewed.
                </p>
              </div>
            ) : selectedIsReporting ? (
              <div className="mt-3 rounded-xl border border-binmap-danger/25 bg-binmap-danger/10 p-3">
                <p className="font-display text-base font-semibold">No dustbin here?</p>
                <p className="mt-1 text-xs leading-5 text-binmap-muted">
                  Submit this if the dustbin is not present at the marked location.
                </p>
                <textarea
                  value={reportNote}
                  onChange={(event) => setReportNote(event.target.value)}
                  placeholder="Add a short note"
                  rows={3}
                  maxLength={500}
                  className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm leading-6 text-binmap-text outline-none placeholder:text-binmap-muted focus:border-binmap-danger"
                />
                {reportError ? <p className="mt-2 text-xs text-binmap-danger">{reportError}</p> : null}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={cancelReport}
                    disabled={submittingReport}
                    className="min-h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitReport}
                    disabled={submittingReport}
                    className="min-h-10 rounded-xl border border-binmap-danger/25 bg-binmap-danger/15 px-3 text-sm font-semibold text-binmap-danger disabled:opacity-50"
                  >
                    {submittingReport ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setReportingDustbinId(selectedDustbin.id);
                  setReportError("");
                }}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-binmap-danger/25 px-4 py-2 text-sm font-semibold text-binmap-danger transition hover:bg-binmap-danger/10"
              >
                Report Missing
                <Flag size={16} />
              </button>
            )}
          </div>
        ) : null}

        {nearbyDustbins.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-binmap-surface p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-binmap-warning/15 text-binmap-warning">
              <LocateFixed size={22} />
            </div>
            <p className="mt-4 font-display text-xl font-semibold">No dustbins found</p>
            <p className="mt-2 text-sm leading-6 text-binmap-muted">
              No public dustbins are listed within 3 km of this location yet.
            </p>
            <Link
              href="/add-dustbin"
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-binmap-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500"
            >
              Add a Dustbin
              <Plus size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {nearbyDustbins.map((dustbin) => (
              <button
                key={dustbin.id}
                type="button"
                onClick={() => onSelect(dustbin)}
                className="w-full rounded-2xl border border-white/10 bg-binmap-surface p-4 text-left transition hover:border-white/20 hover:bg-neutral-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-binmap-text">{dustbin.name}</p>
                      {reportedDustbinIds.has(dustbin.id) ? (
                        <span className="rounded-full border border-binmap-danger/25 bg-binmap-danger/10 px-2 py-0.5 text-xs font-semibold text-binmap-danger">
                          Reported missing
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-binmap-muted">{dustbin.distanceKm.toFixed(1)} km away</p>
                  </div>
                  <StatusBadge status={dustbin.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default function MapExperience() {
  const [userLocation, setUserLocation] = useState<Coordinates>(CHANDIGARH_CENTER);
  const [locationState, setLocationState] = useState<LocationState>("locating");
  const [dataState, setDataState] = useState<DataState>("loading");
  const [nearbyDustbins, setNearbyDustbins] = useState<NearbyDustbin[]>(() =>
    getDemoNearby(CHANDIGARH_CENTER),
  );
  const [backendConfigured, setBackendConfigured] = useState(false);
  const [selectedDustbinId, setSelectedDustbinId] = useState<string | null>(null);
  const [reportedDustbinIds, setReportedDustbinIds] = useState<Set<string>>(() => new Set());

  const locateUser = () => {
    setLocationState("locating");

    if (!navigator.geolocation) {
      setUserLocation(CHANDIGARH_CENTER);
      setLocationState("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationState("granted");
      },
      () => {
        setUserLocation(CHANDIGARH_CENTER);
        setLocationState("fallback");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  useEffect(() => {
    locateUser();
  }, []);

  useEffect(() => {
    let active = true;
    setDataState("loading");

    fetchNearbyDustbins(userLocation, SEARCH_RADIUS_KM * 1000)
      .then((result) => {
        if (!active) return;
        setBackendConfigured(result.configured);
        setNearbyDustbins(result.configured ? result.dustbins : getDemoNearby(userLocation));
        setDataState(result.configured ? "ready" : "fallback");
      })
      .catch(() => {
        if (!active) return;
        setBackendConfigured(false);
        setNearbyDustbins(getDemoNearby(userLocation));
        setDataState("fallback");
      });

    return () => {
      active = false;
    };
  }, [userLocation]);

  const selectedDustbin =
    nearbyDustbins.find((dustbin) => dustbin.id === selectedDustbinId) ?? nearbyDustbins[0] ?? null;

  const handleSubmitReport = async (dustbin: NearbyDustbin, note: string) => {
    await submitMissingReport(dustbin.id, note.trim(), userLocation, backendConfigured);
    setReportedDustbinIds((current) => new Set(current).add(dustbin.id));
  };

  return (
    <main className="relative h-screen overflow-hidden bg-binmap-bg text-binmap-text">
      <Header />
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={15}
        scrollWheelZoom
        className="h-full w-full"
        zoomControl={false}
      >
        <RecenterMap center={userLocation} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={SEARCH_RADIUS_KM * 1000}
          pathOptions={{ color: "#5F6368", fillColor: "#5F6368", fillOpacity: 0.08, weight: 1 }}
        />
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>Your current search location</Popup>
        </Marker>
        {nearbyDustbins.map((dustbin) => (
          <Marker
            key={dustbin.id}
            position={[dustbin.lat, dustbin.lng]}
            icon={createDustbinIcon(dustbin.status)}
            eventHandlers={{ click: () => setSelectedDustbinId(dustbin.id) }}
          >
            <Popup>
              <strong>{dustbin.name}</strong>
              <br />
              {getStatusLabel(dustbin.status)} - {dustbin.distanceKm.toFixed(1)} km away
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <InfoPanel
        locationState={locationState}
        dataState={dataState}
        nearbyDustbins={nearbyDustbins}
        selectedDustbin={selectedDustbin}
        origin={userLocation}
        reportedDustbinIds={reportedDustbinIds}
        onSelect={(dustbin) => setSelectedDustbinId(dustbin.id)}
        onLocateAgain={locateUser}
        onSubmitReport={handleSubmitReport}
      />
    </main>
  );
}

function getLocationMessage(locationState: LocationState, dataState: DataState) {
  if (locationState === "locating") return "Locating you. Chandigarh is used while we wait.";
  if (locationState === "fallback") return "Location permission was not available, so Chandigarh is shown.";
  if (locationState === "unsupported") return "Your browser does not support location, so Chandigarh is shown.";
  if (dataState === "loading") return "Loading approved dustbins near your location.";
  if (dataState === "fallback") return "Showing demo dustbins until Supabase is connected.";
  return "Showing approved dustbins near your current location.";
}
