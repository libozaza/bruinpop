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

/** Posts that have coordinates the map can render and open in external maps apps. */
export function postsToMapEvents(posts) {
  return posts.filter((post) =>
    hasValidCoordinates(post.latitude, post.longitude),
  );
}
