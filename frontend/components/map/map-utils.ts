import type { DustbinStatus } from "./dustbin-data";

export type Coordinates = {
  lat: number;
  lng: number;
};

export function distanceInKm(origin: Coordinates, destination: Coordinates) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(destination.lat - origin.lat);
  const lngDelta = toRadians(destination.lng - origin.lng);
  const originLat = toRadians(origin.lat);
  const destinationLat = toRadians(destination.lat);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(originLat) *
      Math.cos(destinationLat) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getStatusLabel(status: DustbinStatus) {
  const labels: Record<DustbinStatus, string> = {
    available: "Usable",
    full: "Full",
    damaged: "Damaged",
  };

  return labels[status];
}

export function getStatusClass(status: DustbinStatus) {
  const classes: Record<DustbinStatus, string> = {
    available: "text-binmap-success bg-binmap-success/15 border-binmap-success/25",
    full: "text-binmap-warning bg-binmap-warning/15 border-binmap-warning/25",
    damaged: "text-binmap-danger bg-binmap-danger/15 border-binmap-danger/25",
  };

  return classes[status];
}

export function createGoogleMapsDirectionsUrl(origin: Coordinates, destination: Coordinates) {
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode: "walking",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}
