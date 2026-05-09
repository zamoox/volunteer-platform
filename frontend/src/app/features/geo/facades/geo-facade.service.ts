import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GeoSearchService } from '../services/geo-search.service';
import { GeocodeResult, NominatimSearchResult } from '../geo-types';

/**
 * GeoFacade:
 * UI-oriented API surface (keeps backwards compatibility with existing app code).
 * This is intentionally thin: orchestration only.
 */
@Injectable({ providedIn: 'root' })
export class GeoFacadeService {
  constructor(private readonly geo: GeoSearchService) {}

  reverse(lat: number, lon: number): Observable<GeocodeResult | null> {
    return this.geo.reverse(lat, lon);
  }

  searchAddress(query: string, city?: string): Observable<GeocodeResult[]> {
    return this.geo.searchAddress(query, city);
  }

  searchCityLabels(query: string): Observable<string[]> {
    return this.geo.searchCityLabels(query);
  }

  // Backwards compatible methods used in current components
  getAddress(lat: number, lon: number): Observable<{ display_name: string }> {
    return this.geo.reverse(lat, lon).pipe(
      map((r) => ({ display_name: r?.label || '' })),
      catchError(() => of({ display_name: '' }))
    );
  }

  searchStreet(street: string, city: string): Observable<readonly NominatimSearchResult[]> {
    // For request-form dropdown we keep raw results to allow extracting lat/lon.
    // Ranking/normalization is available via `searchAddress`.
    const q = (street ?? '').trim();
    if (q.length < 3) return of([]);
    return this.geo.searchAddressRaw(street, city);
  }

  searchCity(query: string): Observable<readonly NominatimSearchResult[]> {
    return this.geo.searchCityRaw(query);
  }
}

