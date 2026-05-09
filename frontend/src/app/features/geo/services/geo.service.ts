import { Injectable } from '@angular/core';
import { GeoFacadeService } from '../facades/geo-facade.service';

// Re-export types for existing imports across the app.
export type { GeocodeResult, NominatimReverseResult, NominatimSearchResult } from '../geo-types';

/**
 * Backwards-compatible entrypoint.
 *
 * Keep existing imports working: `import { GeoService } from '.../core/services/geo.service'`.
 * Internally this delegates to the split provider/search/facade architecture.
 */
@Injectable({ providedIn: 'root' })
export class GeoService {
  constructor(private readonly facade: GeoFacadeService) {}

  reverse(lat: number, lon: number) {
    return this.facade.reverse(lat, lon);
  }

  searchAddress(query: string, city?: string) {
    return this.facade.searchAddress(query, city);
  }

  searchCityLabels(query: string) {
    return this.facade.searchCityLabels(query);
  }

  // Legacy API used by existing components
  getAddress(lat: number, lon: number) {
    return this.facade.getAddress(lat, lon);
  }

  searchStreet(street: string, city: string) {
    return this.facade.searchStreet(street, city);
  }

  searchCity(query: string) {
    return this.facade.searchCity(query);
  }
}