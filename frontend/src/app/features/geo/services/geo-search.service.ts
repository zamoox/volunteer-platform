import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, defer, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { GeoProvider, GeocodeResult, NominatimSearchResult } from '../geo-types';
import { NominatimProvider } from '../providers/nominatim.provider';
import { buildPrioritizedQuery, buildViewboxParam, normalizeReverse, normalizeSearch } from '../geo-search.logic';

/**
 * GeoSearchService:
 * - builds Nominatim queries
 * - applies Ukraine biasing
 * - normalizes + ranks + dedupes
 * - caches successful responses (TTL)
 * - NEVER keeps failed responses in cache (prevents cached error replay)
 */
@Injectable({ providedIn: 'root' })
export class GeoSearchService {
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly cache = new Map<string, { at: number; value$: Observable<unknown> }>();

  // Provider is abstract-able for future fallbacks, but we keep it lightweight.
  constructor(private readonly provider: NominatimProvider) {}

  reverse(lat: number, lon: number): Observable<GeocodeResult | null> {
    const params = this.baseParams()
      .set('lat', String(lat))
      .set('lon', String(lon))
      .set('zoom', '18');

    return this.cached('reverse', params, () => this.provider.reverse(params)).pipe(
      map((raw) => normalizeReverse(raw)),
      catchError(() => of(null))
    );
  }

  /**
   * Autocomplete-ready address search.
   * Caller should debounce/switchMap this in the component.
   */
  searchAddress(query: string, city?: string): Observable<GeocodeResult[]> {
    const q = buildPrioritizedQuery(query, city);
    if (q.length < 3) return of([]);

    const params = this.baseParams()
      .set('q', q)
      .set('limit', '8')
      .set('bounded', '1')
      .set('polygon_geojson', '0');

    return this.cached('search', params, () => this.provider.search(params)).pipe(
      map((raw) => normalizeSearch(raw, { mode: 'address', query: q })),
      catchError(() => of([]))
    );
  }

  /**
   * Raw address search (for legacy consumers that expect NominatimSearchResult[]).
   */
  searchAddressRaw(query: string, city?: string): Observable<readonly NominatimSearchResult[]> {
    const q = buildPrioritizedQuery(query, city);
    if (q.length < 3) return of([]);

    const params = this.baseParams()
      .set('q', q)
      .set('limit', '8')
      .set('bounded', '1')
      .set('polygon_geojson', '0');

    return this.cached('search', params, () => this.provider.search(params)).pipe(
      catchError(() => of([]))
    );
  }

  searchCityRaw(query: string): Observable<readonly NominatimSearchResult[]> {
    const q = (query ?? '').trim();
    if (q.length < 2) return of([]);

    const params = this.baseParams()
      .set('q', q)
      .set('limit', '8')
      .set('bounded', '1')
      .set('polygon_geojson', '0')
      // Nominatim `featuretype` is not reliable everywhere; keep it as a hint only.
      .set('featuretype', 'city');

    return this.cached('search', params, () => this.provider.search(params)).pipe(
      catchError(() => of([]))
    );
  }

  searchCityLabels(query: string): Observable<string[]> {
    const q = (query ?? '').trim();
    if (q.length < 2) return of([]);

    return this.searchCityRaw(q).pipe(
      map((raw) => {
        const normalized = normalizeSearch(raw, { mode: 'city', query: q });
        const names = normalized.map((r) => r.city || r.label).filter(Boolean);
        return [...new Set(names)];
      }),
      catchError(() => of([]))
    );
  }

  // -----------------------
  // Internal helpers
  // -----------------------

  private baseParams(): HttpParams {
    return new HttpParams()
      .set('format', 'jsonv2')
      .set('accept-language', 'uk')
      .set('addressdetails', '1')
      .set('dedupe', '1')
      .set('countrycodes', 'ua')
      .set('viewbox', buildViewboxParam());
  }

  private cached<T>(
    kind: 'search' | 'reverse',
    params: HttpParams,
    factory: () => Observable<T>
  ): Observable<T> {
    const key = `${kind}?${params.toString()}`;
    const now = Date.now();

    const hit = this.cache.get(key);
    if (hit && now - hit.at < GeoSearchService.CACHE_TTL_MS) {
      return hit.value$ as Observable<T>;
    }

    // Critical: ensure failures don't remain cached.
    // We delete cache entry on error so next call can retry.
    const value$ = defer(factory).pipe(
      tap({
        error: () => this.cache.delete(key),
      }),
      catchError((err) => {
        this.cache.delete(key);
        return throwError(() => err);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.cache.set(key, { at: now, value$ });
    if (this.cache.size > 250) this.prune(now);

    return value$;
  }

  private prune(now = Date.now()): void {
    for (const [k, v] of this.cache.entries()) {
      if (now - v.at >= GeoSearchService.CACHE_TTL_MS) this.cache.delete(k);
    }
  }
}

