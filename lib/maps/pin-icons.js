import L from "leaflet";
import { getCategoryMapPinColor } from "@/lib/posts/categories.js";
import {
  categoryPinHtml,
  PIN_ICON_ANCHOR,
  PIN_ICON_SIZE,
} from "./pin-markup.js";

/** @type {Map<string, L.DivIcon>} */
const iconCache = new Map();

/**
 * Leaflet icon for a post category (cached per categoryId).
 * @param {string} categoryId
 */
export function getCategoryMarkerIcon(categoryId) {
  const key = categoryId || "other";
  const cached = iconCache.get(key);
  if (cached) return cached;

  const color = getCategoryMapPinColor(key);
  const [width, height] = PIN_ICON_SIZE;
  const icon = L.divIcon({
    className: "category-map-pin",
    html: categoryPinHtml(color),
    iconSize: [width, height],
    iconAnchor: PIN_ICON_ANCHOR,
    popupAnchor: [0, -height + 4],
  });

  iconCache.set(key, icon);
  return icon;
}

let composerDraftIcon;

/** orange draft pin for composer / preview markers */
export function getComposerDraftPinIcon() {
  if (!composerDraftIcon) {
    const [width, height] = PIN_ICON_SIZE;
    composerDraftIcon = L.divIcon({
      className: "category-map-pin",
      html: categoryPinHtml("#ea580c"),
      iconSize: [width, height],
      iconAnchor: PIN_ICON_ANCHOR,
    });
  }
  return composerDraftIcon;
}
