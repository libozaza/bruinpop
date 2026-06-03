import L from "leaflet";
import { getCategoryMapPinColor } from "@/lib/posts/categories.js";

const PIN_WIDTH = 28;
const PIN_HEIGHT = 40;

/** @type {Map<string, L.DivIcon>} */
const iconCache = new Map();

/**
 * SVG map pin colored by event category.
 * @param {string} color
 */
function categoryPinHtml(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${PIN_WIDTH}" height="${PIN_HEIGHT}" aria-hidden="true">
    <path fill="${color}" stroke="#ffffff" stroke-width="1.25" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z"/>
    <circle cx="12" cy="11" r="4.5" fill="#ffffff" fill-opacity="0.92"/>
  </svg>`;
}

/**
 * Leaflet icon for a post category (cached per categoryId).
 * @param {string} categoryId
 */
export function getCategoryMarkerIcon(categoryId) {
  const key = categoryId || "other";
  const cached = iconCache.get(key);
  if (cached) return cached;

  const color = getCategoryMapPinColor(key);
  const icon = L.divIcon({
    className: "category-map-pin",
    html: categoryPinHtml(color),
    iconSize: [PIN_WIDTH, PIN_HEIGHT],
    iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT],
    popupAnchor: [0, -PIN_HEIGHT + 4],
  });

  iconCache.set(key, icon);
  return icon;
}
