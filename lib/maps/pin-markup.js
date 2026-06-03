const PIN_WIDTH = 28;
const PIN_HEIGHT = 40;

/**
 * SVG map pin markup (no Leaflet dependency — safe to import anywhere).
 * @param {string} color
 */
export function categoryPinHtml(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${PIN_WIDTH}" height="${PIN_HEIGHT}" aria-hidden="true">
    <path fill="${color}" stroke="#ffffff" stroke-width="1.25" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z"/>
    <circle cx="12" cy="11" r="4.5" fill="#ffffff" fill-opacity="0.92"/>
  </svg>`;
}

export const PIN_ICON_SIZE = [PIN_WIDTH, PIN_HEIGHT];
export const PIN_ICON_ANCHOR = [PIN_WIDTH / 2, PIN_HEIGHT];
