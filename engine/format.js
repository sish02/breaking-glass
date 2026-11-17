// Pure display formatting. All distances are integer metres internally (research R4).

/** 3060 → "3.060 km" */
export function km(m) {
  return `${(m / 1000).toFixed(3)} km`;
}

/** 40 → "40 m" */
export function metres(m) {
  return `${Math.round(m)} m`;
}

/** Short distances in metres, longer ones in km: 40 → "40 m", 2400 → "2.400 km". */
export function dist(m) {
  return Math.abs(m) < 1000 ? metres(m) : km(m);
}

/** Escape text for safe insertion into HTML/SVG markup. */
export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
