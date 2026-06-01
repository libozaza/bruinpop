/**
 * Deep links to external map apps for turn-by-turn / navigation.
 */

/**
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} [label]
 */
export function googleMapsDirectionsUrl(latitude, longitude, label) {
  const destination = `${latitude},${longitude}`;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", destination);
  return url.toString();
}

/**
 * Apple Maps web URL (opens Apple Maps on iOS/macOS when available).
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} [label]
 */
export function appleMapsDirectionsUrl(latitude, longitude, label) {
  const url = new URL("https://maps.apple.com/");
  url.searchParams.set("daddr", `${latitude},${longitude}`);
  if (label) url.searchParams.set("q", label);
  return url.toString();
}
