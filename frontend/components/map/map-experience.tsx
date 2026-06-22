"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Circle, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { MapContainer } from "react-leaflet/MapContainer";
import {
  ArrowLeft,
  ExternalLink,
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

type LocationState = "locating" | "granted" | "fallback" | "unsupported";

type NearbyDustbin = Dustbin & {
  distanceKm: number;
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

function RecenterMap({ center }: { center: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], 15, { animate: true });
  }, [center, map]);

  return null;
}

function Header() {
  return (
    <header className="absolute left-4 right-4 top-4 z-[500] flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-binmap-bg/92 p-3 text-binmap-text shadow-soft backdrop-blur md:left-6 md:right-6">
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
  nearbyDustbins,
  selectedDustbin,
  origin,
  onSelect,
  onLocateAgain,
}: {
  locationState: LocationState;
  nearbyDustbins: NearbyDustbin[];
  selectedDustbin: NearbyDustbin | null;
  origin: Coordinates;
  onSelect: (dustbin: NearbyDustbin) => void;
  onLocateAgain: () => void;
}) {
  const directionsHref = selectedDustbin
    ? createGoogleMapsDirectionsUrl(origin, selectedDustbin)
    : null;

  return (
    <aside className="absolute bottom-4 left-4 right-4 z-[500] max-h-[45vh] overflow-hidden rounded-2xl border border-white/10 bg-binmap-bg text-binmap-text shadow-soft md:bottom-6 md:left-6 md:right-auto md:top-24 md:flex md:max-h-[calc(100vh-8rem)] md:w-[380px] md:flex-col">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl font-semibold">Dustbins within 3 km</p>
            <p className="mt-1 text-sm text-binmap-muted">{getLocationMessage(locationState)}</p>
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
              className="mt-4 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-binmap-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500"
            >
              Get Directions
              <ExternalLink size={16} />
            </a>
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
                    <p className="font-semibold text-binmap-text">{dustbin.name}</p>
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
  const [selectedDustbinId, setSelectedDustbinId] = useState<string | null>(null);

  const locateUser = () => {
    setLocationState("locating");

    if (!navigator.geolocation) {
      setUserLocation(CHANDIGARH_CENTER);
      setLocationState("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationState("granted");
      },
      () => {
        setUserLocation(CHANDIGARH_CENTER);
        setLocationState("fallback");
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      },
    );
  };

  useEffect(() => {
    locateUser();
  }, []);

  const nearbyDustbins = useMemo<NearbyDustbin[]>(() => {
    return demoDustbins
      .map((dustbin) => ({
        ...dustbin,
        distanceKm: distanceInKm(userLocation, dustbin),
      }))
      .filter((dustbin) => dustbin.distanceKm <= SEARCH_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLocation]);

  const selectedDustbin =
    nearbyDustbins.find((dustbin) => dustbin.id === selectedDustbinId) ?? nearbyDustbins[0] ?? null;

  const handleSelectDustbin = (dustbin: NearbyDustbin) => {
    setSelectedDustbinId(dustbin.id);
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
          pathOptions={{
            color: "#5F6368",
            fillColor: "#5F6368",
            fillOpacity: 0.08,
            weight: 1,
          }}
        />
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>Your current search location</Popup>
        </Marker>
        {nearbyDustbins.map((dustbin) => (
          <Marker
            key={dustbin.id}
            position={[dustbin.lat, dustbin.lng]}
            icon={createDustbinIcon(dustbin.status)}
            eventHandlers={{
              click: () => handleSelectDustbin(dustbin),
            }}
          >
            <Popup>
              <strong>{dustbin.name}</strong>
              <br />
              {getStatusLabel(dustbin.status)} · {dustbin.distanceKm.toFixed(1)} km away
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <InfoPanel
        locationState={locationState}
        nearbyDustbins={nearbyDustbins}
        selectedDustbin={selectedDustbin}
        origin={userLocation}
        onSelect={handleSelectDustbin}
        onLocateAgain={locateUser}
      />
    </main>
  );
}

function getLocationMessage(locationState: LocationState) {
  if (locationState === "locating") {
    return "Locating you. Chandigarh is used while we wait.";
  }

  if (locationState === "fallback") {
    return "Location permission was not available, so Chandigarh is shown.";
  }

  if (locationState === "unsupported") {
    return "Your browser does not support location, so Chandigarh is shown.";
  }

  return "Showing public dustbins near your current location.";
}
