import { GeocodeResult, NominatimReverseResult, NominatimSearchResult } from './geo-types';

export const UA_BBOX = Object.freeze({
  west: 22.1371589,
  south: 44.386463,
  east: 40.2275801,
  north: 52.3791473,
});

export function buildViewboxParam(): string {
  // Nominatim `viewbox` format: left,top,right,bottom
  return `${UA_BBOX.west},${UA_BBOX.north},${UA_BBOX.east},${UA_BBOX.south}`;
}

export function buildPrioritizedQuery(query: string, city?: string): string {
  const q = (query ?? '').trim();
  const c = (city ?? '').trim();
  if (!q) return '';

  // If user already typed comma-separated parts, respect it.
  if (q.includes(',')) return q;

  // Bias Nominatim by adding "Україна" (some public instances ignore countrycodes).
  if (c) return `${q}, ${c}, Україна`;
  return `${q}, Україна`;
}

export function normalizeReverse(raw: NominatimReverseResult): GeocodeResult | null {
  const lat = Number(raw.lat);
  const lon = Number(raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const addr = raw.address;
  const city = addr?.city || addr?.town || addr?.village;
  const street = addr?.road;
  const houseNumber = addr?.house_number;
  const postcode = addr?.postcode;

  const label = buildLabel({ city, street, houseNumber, fallback: raw.display_name });
  return { lat, lon, label, city, street, houseNumber, postcode };
}

export function normalizeSearch(
  raw: readonly NominatimSearchResult[] | null | undefined,
  opts: { mode: 'address' | 'city'; query: string }
): GeocodeResult[] {
  const list = Array.isArray(raw) ? raw : [];
  const q = (opts.query ?? '').trim().toLowerCase();

  const normalized: GeocodeResult[] = [];
  for (const r of list) {
    const lat = Number(r.lat);
    const lon = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const addr = r.address;
    if (addr?.country_code && addr.country_code.toLowerCase() !== 'ua') continue;

    const city = addr?.city || addr?.town || addr?.village;
    const street = addr?.road;
    const houseNumber = addr?.house_number;
    const postcode = addr?.postcode;

    const klass = (r.class || '').toLowerCase();
    if (opts.mode === 'address' && (klass === 'boundary' || klass === 'route')) continue;

    const label = buildLabel({
      city,
      street,
      houseNumber,
      fallback: r.display_name,
      mode: opts.mode,
    });
    if (!label) continue;

    normalized.push({ lat, lon, label, city, street, houseNumber, postcode });
  }

  const deduped = dedupe(normalized);
  return rank(deduped, { mode: opts.mode, query: q });
}

export function dedupe(results: readonly GeocodeResult[]): GeocodeResult[] {
  const seen = new Set<string>();
  const out: GeocodeResult[] = [];

  for (const r of results) {
    const key = `${r.label}|${r.lat.toFixed(5)}|${r.lon.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }

  return out;
}

export function rank(
  results: readonly GeocodeResult[],
  opts: { mode: 'address' | 'city'; query: string }
): GeocodeResult[] {
  const scored = results.map((r) => ({ r, score: scoreResult(r, opts) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((x) => x.r);
}

export function scoreResult(
  r: GeocodeResult,
  opts: { mode: 'address' | 'city'; query: string }
): number {
  const q = opts.query;
  if (!q) return 0;

  const label = r.label.toLowerCase();
  const city = (r.city ?? '').toLowerCase();
  const street = (r.street ?? '').toLowerCase();

  let score = 0;

  // Strong prefix matches first (Google Maps-like)
  if (label.startsWith(q)) score += 100;
  else if (street.startsWith(q)) score += 80;
  else if (city.startsWith(q)) score += 30;
  else if (label.includes(q)) score += 10;

  // Address search: prefer street + house number, penalize “region-only” matches
  if (opts.mode === 'address') {
    if (r.street) score += 40;
    if (r.houseNumber) score += 30;
    if (r.city) score += 10;
    if (!r.street && r.city) score -= 10; // city-only lower for address autocomplete
  } else {
    // City search: reward having a city field
    if (r.city) score += 60;
    if (!r.city && r.label) score += 10;
  }

  return score;
}

export function buildLabel(opts: {
  city?: string;
  street?: string;
  houseNumber?: string;
  fallback?: string;
  mode?: 'address' | 'city';
}): string {
  const city = (opts.city ?? '').trim();
  const street = (opts.street ?? '').trim();
  const house = (opts.houseNumber ?? '').trim();

  if (opts.mode === 'city') {
    return city || (opts.fallback ?? '').split(',')[0]?.trim() || '';
  }

  const parts: string[] = [];
  if (street) parts.push(street);
  if (house) parts.push(house);
  if (city) parts.push(city);
  if (parts.length) return parts.join(', ');

  return (opts.fallback ?? '').trim();
}

