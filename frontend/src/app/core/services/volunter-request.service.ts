import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

export const GET_ALL_REQUESTS = gql`
  query ExampleQuery {
    getAllRequests {
      id
      title
      description
      category
      location {
        lat
        lng
        address
      }
    }
  }
`;

const CREATE_REQUEST = gql`
  mutation CreateRequest($input: CreateVolunteerRequestInput!) {
    createRequest(input: $input) {
      id
      title
      category
      location {
        lat
        lng
        address
      }
    }
  }
`;

// ---------- Nominatim (reverse geocoding) ----------
export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country?: string;
  };
}

// ---------- Photon (address autocomplete) ----------
// Photon — безкоштовний geocoder на базі OSM з fuzzy-пошуком.
// https://photon.komoot.io
export interface PhotonFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] }; // [lon, lat]
  properties: {
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    district?: string;
    county?: string;
    postcode?: string;
    country?: string;
    type?: string; // 'street', 'house', 'city' ...
  };
}

export interface PhotonResponse {
  features: PhotonFeature[];
}

// Координати центрів основних міст для location bias
const CITY_CENTERS: Record<string, { lat: number; lon: number }> = {
  'Київ':              { lat: 50.4501, lon: 30.5234 },
  'Харків':            { lat: 49.9935, lon: 36.2304 },
  'Одеса':             { lat: 46.4825, lon: 30.7233 },
  'Дніпро':            { lat: 48.4647, lon: 35.0462 },
  'Запоріжжя':         { lat: 47.8388, lon: 35.1396 },
  'Львів':             { lat: 49.8397, lon: 24.0297 },
  'Вінниця':           { lat: 49.2331, lon: 28.4682 },
  'Полтава':           { lat: 49.5883, lon: 34.5514 },
  'Чернігів':          { lat: 51.4982, lon: 31.2893 },
  'Черкаси':           { lat: 49.4285, lon: 32.0602 },
  'Суми':              { lat: 50.9077, lon: 34.7981 },
  'Житомир':           { lat: 50.2547, lon: 28.6587 },
  'Рівне':             { lat: 50.6199, lon: 26.2516 },
  'Івано-Франківськ':  { lat: 48.9226, lon: 24.7111 },
  'Тернопіль':         { lat: 49.5535, lon: 25.5948 },
  'Луцьк':             { lat: 50.7472, lon: 25.3254 },
  'Ужгород':           { lat: 48.6239, lon: 22.2970 },
  'Хмельницький':      { lat: 49.4229, lon: 26.9870 },
  'Чернівці':          { lat: 48.2921, lon: 25.9358 },
  'Кропивницький':     { lat: 48.5132, lon: 32.2597 },
  'Херсон':            { lat: 46.6354, lon: 32.6169 },
  'Миколаїв':          { lat: 46.9750, lon: 31.9946 },
};

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const PHOTON_BASE    = 'https://photon.komoot.io/api';

@Injectable({ providedIn: 'root' })
export class VolunteerRequestService {

  constructor(
    private apollo: Apollo,
    private http: HttpClient
  ) {}

  getRequests(category: string | null = null) {
    return this.apollo.watchQuery<any>({
      query: GET_ALL_REQUESTS,
      variables: { category } 
    }).valueChanges.pipe(
      map(result => result.data?.getAllRequests ?? [])
    );
  }

  getCategories() {
    return [
      { id: 'FOOD', label: '🍎 Продукти', color: '#ef4444' },
      { id: 'MEDICINE', label: '💊 Ліки', color: '#10b981' },
      { id: 'TRANSPORT', label: '🚗 Транспорт', color: '#3b82f6' },
      { id: 'SHELTER', label: '🏠 Житло', color: '#f59e0b' },
      { id: 'OTHER', label: '📦 Інше', color: '#6b7280' }
    ];
  }

  createRequest(
    title: string,
    description: string,
    lat: number,
    lng: number,
    address: string
  ) {
    return this.apollo.mutate({
      mutation: CREATE_REQUEST,
      variables: {
        input: { title, description, category: 'OTHER', location: { lat, lng, address } }
      },
      refetchQueries: ['ExampleQuery']
    });
  }

  /**
   * Reverse geocoding — отримати адресу за координатами.
   * Nominatim чудово справляється з цим завданням.
   */
  getAddress(lat: number, lng: number) {
    const params = new HttpParams()
      .set('format', 'jsonv2')
      .set('lat', lat.toString())
      .set('lon', lng.toString())
      .set('accept-language', 'uk')
      .set('addressdetails', '1');

    return this.http.get<NominatimResult>(`${NOMINATIM_BASE}/reverse`, { params });
  }

  searchAddress(street: string, city: string) {
    const center = CITY_CENTERS[city];

    let params = new HttpParams()
      .set('q', street)
      .set('limit', '6')
      .set('lang', 'uk')
      .set('layer', 'street')   // тільки вулиці та будинки
      .set('layer', 'house');

    // location bias — Photon пріоритизує результати поруч з цими координатами
    if (center) {
      params = params
        .set('lat', center.lat.toString())
        .set('lon', center.lon.toString())
        .set('zoom', '14'); // чим більше zoom — тим сильніша прив'язка до точки
    }

    return this.http.get<PhotonResponse>(PHOTON_BASE, { params }).pipe(
      map(res => res.features ?? []),
      catchError(() => of([] as PhotonFeature[]))
    );
  }
}