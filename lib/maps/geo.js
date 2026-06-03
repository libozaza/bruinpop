/**
 * Bridge between /api/posts payloads and map UI (markers, popups, directions).
 *
 * Posts store coordinates as post.location.lat/lng (see Post schema).
 * Map components expect a flat MapEvent shape with latitude/longitude.
 */

export function hasValidCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Read coordinates from either the current API shape or legacy flat fields.
 * @param {object} post
 * @returns {{ lat: number, lng: number, label: string } | null}
 */
export function extractPostCoordinates(post) {
  if (!post) return null;

  const nested = post.location;
  if (nested?.lat != null && nested?.lng != null) {
    return {
      lat: nested.lat,
      lng: nested.lng,
      label: nested.label ?? "",
    };
  }

  // Legacy feature-branch shape (if any old docs remain in DB)
  if (post.latitude != null && post.longitude != null) {
    return {
      lat: post.latitude,
      lng: post.longitude,
      label: post.locationLabel ?? "",
    };
  }

  return null;
}

/**
 * @typedef {Object} MapEvent
 * @property {string} id
 * @property {string} title
 * @property {string} [content]
 * @property {string} creatorUsername
 * @property {object} [hostHype]
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} [locationLabel]
 * @property {string} [address]
 * @property {string|Date|null} [date]
 * @property {string[]} [categoryLabels]
 */

/**
 * Convert one formatted post into a map-ready event, or null if no valid coords.
 * @param {object} post
 * @returns {MapEvent | null}
 */
export function postToMapEvent(post) {
  const coords = extractPostCoordinates(post);
  if (!coords || !hasValidCoordinates(coords.lat, coords.lng)) {
    return null;
  }

  return {
    id: String(post.id),
    title: post.title,
    content: post.content,
    creatorUsername: post.creatorUsername,
    hostHype: post.hostHype,
    latitude: Number(coords.lat),
    longitude: Number(coords.lng),
    locationLabel: coords.label || post.address || "",
    address: post.address ?? null,
    date: post.date ?? null,
    categoryLabels: post.categoryLabels ?? [],
  };
}

/** @param {object[]} posts */
export function postsToMapEvents(posts) {
  if (!Array.isArray(posts)) return [];
  return posts.map(postToMapEvent).filter(Boolean);
}
