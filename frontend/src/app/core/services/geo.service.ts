import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface NominatimResult {
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    road?: string;
    house_number?: string;
  };
}

export interface PhotonFeature {
  geometry: { coordinates: [number, number] }; // [lon, lat]
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    district?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class GeoService {
  private readonly NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
  private readonly PHOTON_BASE = 'https://photon.komoot.io/api';

  private readonly CITY_CENTERS: Record<string, { lat: number; lon: number }> = {
    'Київ': { lat: 50.4501, lon: 30.5234 },
    'Харків': { lat: 49.9935, lon: 36.2304 },
    // ... інші центри міст
  };

  constructor(private http: HttpClient) {}

  // Зворотне геокодування (для кліку на карті)
  getAddress(lat: number, lon: number): Observable<NominatimResult> {
    const params = new HttpParams()
      .set('format', 'jsonv2')
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('accept-language', 'uk')
      .set('addressdetails', '1');

    return this.http.get<NominatimResult>(`${this.NOMINATIM_BASE}/reverse`, { params });
  }

  // Пошук вулиць (Photon)
  searchStreet(street: string, city: string): Observable<PhotonFeature[]> {
    const center = this.CITY_CENTERS[city];
    let params = new HttpParams()
      .set('q', street)
      .set('limit', '6')
      .set('lang', 'uk');

    if (center) {
      params = params.set('lat', center.lat.toString()).set('lon', center.lon.toString());
    }

    return this.http.get<{ features: PhotonFeature[] }>(this.PHOTON_BASE, { params }).pipe(
      map(res => res.features ?? []),
      catchError(() => of([]))
    );
  }

  // Пошук міст (Nominatim)
  searchCity(query: string): Observable<NominatimResult[]> {
    const params = new HttpParams()
      .set('format', 'json')
      .set('q', query)
      .set('countrycodes', 'ua')
      .set('featuretype', 'city')
      .set('limit', '6')
      .set('accept-language', 'uk');

    return this.http.get<NominatimResult[]>(`${this.NOMINATIM_BASE}/search`, { params }).pipe(
      catchError(() => of([]))
    );
  }
}