export type DustbinStatus = "available" | "full" | "damaged";

export type Dustbin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: DustbinStatus;
  description: string;
  lastUpdated: string;
};

export const CHANDIGARH_CENTER = {
  lat: 30.7333,
  lng: 76.7794,
};

export const SEARCH_RADIUS_KM = 3;

export const demoDustbins: Dustbin[] = [
  {
    id: "sector-17-plaza",
    name: "Sector 17 Plaza Dustbin",
    lat: 30.7402,
    lng: 76.7821,
    status: "available",
    description: "Near the pedestrian plaza entrance.",
    lastUpdated: "Today",
  },
  {
    id: "rose-garden-gate",
    name: "Rose Garden Gate Bin",
    lat: 30.7461,
    lng: 76.782,
    status: "full",
    description: "Outside the main garden gate.",
    lastUpdated: "2 hours ago",
  },
  {
    id: "sector-22-market",
    name: "Sector 22 Market Bin",
    lat: 30.729,
    lng: 76.7725,
    status: "available",
    description: "Beside the public parking lane.",
    lastUpdated: "Yesterday",
  },
  {
    id: "sukhna-lake-walk",
    name: "Sukhna Lake Walkway Bin",
    lat: 30.7426,
    lng: 76.8188,
    status: "damaged",
    description: "Reported damaged near the walkway.",
    lastUpdated: "3 days ago",
  },
  {
    id: "sector-35-bus-stop",
    name: "Sector 35 Bus Stop Bin",
    lat: 30.7228,
    lng: 76.7613,
    status: "available",
    description: "Near the bus stop and public footpath.",
    lastUpdated: "Today",
  },
];
