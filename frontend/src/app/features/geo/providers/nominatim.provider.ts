import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GeoProvider, NominatimReverseResult, NominatimSearchResult } from '../geo-types';

@Injectable({ providedIn: 'root' })
export class NominatimProvider implements GeoProvider {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';

  constructor(private readonly http: HttpClient) {}

  search(params: HttpParams): Observable<readonly NominatimSearchResult[]> {
    // `jsonv2` + `addressdetails=1` should be set by the caller
    return this.http.get<readonly NominatimSearchResult[]>(`${this.baseUrl}/search`, { params });
  }

  reverse(params: HttpParams): Observable<NominatimReverseResult> {
    return this.http.get<NominatimReverseResult>(`${this.baseUrl}/reverse`, { params });
  }
}

