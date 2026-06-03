/**
 * UCLA campus pins for the post composer. Coordinates are approximate
 * building centers suitable for map markers and directions links.
 */

export const CAMPUS_LOCATIONS = [
  {
    id: "kerckhoff",
    label: "Kerckhoff Hall",
    latitude: 34.0712,
    longitude: -118.4437,
  },
  {
    id: "royce",
    label: "Royce Hall",
    latitude: 34.0722,
    longitude: -118.442,
  },
  {
    id: "bruin-plaza",
    label: "Bruin Plaza",
    latitude: 34.0719,
    longitude: -118.4455,
  },
  {
    id: "ackerman",
    label: "Ackerman Union",
    latitude: 34.0704,
    longitude: -118.444,
  },
  {
    id: "powell",
    label: "Powell Library",
    latitude: 34.0716,
    longitude: -118.4418,
  },
  {
    id: "dickson-court",
    label: "Dickson Court",
    latitude: 34.0725,
    longitude: -118.4432,
  },
];

/**
 * @param {string} id
 */
export function getCampusLocationById(id) {
  if (!id) return null;
  return CAMPUS_LOCATIONS.find((loc) => loc.id === id) ?? null;
}
