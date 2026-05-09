/**
 * Raw Nominatim response shape (subset).
 * Keep this DTO minimal and map into GeocodeResult for app usage.
 */
export interface NominatimSearchResult {
  readonly place_id?: number;
  readonly class?: string;
  readonly type?: string;
  readonly display_name?: string;
  readonly lat?: string;
  readonly lon?: string;
  readonly importance?: number;
  readonly address?: {
    readonly country_code?: string;
    readonly country?: string;
    readonly state?: string;
    readonly county?: string;
    readonly city?: string;
    readonly town?: string;
    readonly village?: string;
    readonly suburb?: string;
    readonly neighbourhood?: string;
    readonly road?: string;
    readonly house_number?: string;
    readonly postcode?: string;
  };
}

export interface NominatimReverseResult {
  readonly display_name?: string;
  readonly lat?: string;
  readonly lon?: string;
  readonly address?: NominatimSearchResult['address'];
}

/**
 * Clean internal model for UI / app logic.
 */
export interface GeocodeResult {
  readonly lat: number;
  readonly lon: number;
  readonly label: string;
  readonly city?: string;
  readonly street?: string;
  readonly houseNumber?: string;
  readonly postcode?: string;
}

/**
 * Provider contract to keep the module extensible for future providers.
 * (Photon/Pelias/Google Places can implement a similar interface later.)
 */
export interface GeoProvider {
  search(params: import('@angular/common/http').HttpParams): import('rxjs').Observable<readonly NominatimSearchResult[]>;
  reverse(params: import('@angular/common/http').HttpParams): import('rxjs').Observable<NominatimReverseResult>;
}

