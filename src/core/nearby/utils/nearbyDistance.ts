export function formatNearbyDistance(meters: number): string {
  if (!meters) return "No território";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

export function formatNearbyTerritoryDistance(meters: number): string {
  const distance = formatNearbyDistance(meters);
  return distance === "No território"
    ? distance
    : `${distance} do centro do território`;
}
