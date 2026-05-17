// features/volunteers/services/volunteer-location.service.ts
import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, interval, switchMap, startWith, distinctUntilChanged,
         filter, map, catchError, of, EMPTY } from 'rxjs';
import { UPDATE_VOLUNTEER_LOCATION } from '../graphql/volunteer.mutations';
import { GET_NEARBY_VOLUNTEERS } from '../graphql/volunteer.queries';
import { NearbyVolunteer } from '../models/volunteer.model';
import { AuthService } from '@core/services/auth.service';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

@Injectable({ providedIn: 'root' })
export class VolunteerLocationService {
  private apollo = inject(Apollo);
  private authService = inject(AuthService);

  // ─── Отримати поточну позицію через Geolocation API ──────────────────────
  getCurrentPosition(): Observable<GeoPosition> {
    return new Observable<GeoPosition>(observer => {
      if (!navigator.geolocation) {
        observer.error(new Error('Geolocation не підтримується браузером'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        pos => {
          observer.next({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          observer.complete();
        },
        err => observer.error(err),
        {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 30_000,
        },
      );
    });
  }

  // ─── Відстежувати позицію та відправляти на сервер кожні 2 хвилини ───────
  watchAndSyncLocation(): Observable<GeoPosition> {
    const user = this.authService.getUserFromStorage();

    // Синкаємо лише якщо роль — volunteer
    if (!user || user.role !== 'volunteer') return EMPTY;

    return new Observable<GeoPosition>(observer => {
      const watchId = navigator.geolocation.watchPosition(
        pos => {
          observer.next({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        err => observer.error(err),
        { enableHighAccuracy: true, maximumAge: 60_000 },
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }).pipe(
      // Дедуплікація — не синкаємо якщо не змістились більше ніж на ~50м
      distinctUntilChanged(
        (a, b) =>
          Math.abs(a.lat - b.lat) < 0.0005 &&
          Math.abs(a.lng - b.lng) < 0.0005,
      ),
    );
  }

  // ─── Відправити локацію на backend ───────────────────────────────────────
  pushLocation(lat: number, lng: number): Observable<boolean> {
    return this.apollo
      .mutate({
        mutation: UPDATE_VOLUNTEER_LOCATION,
        variables: { lat, lng },
      })
      .pipe(
        map(() => true),
        catchError(() => of(false)),
      );
  }

  // ─── Отримати волонтерів поруч ───────────────────────────────────────────
  getNearbyVolunteers(
    lat: number,
    lng: number,
    radius = 10_000,
  ): Observable<NearbyVolunteer[]> {
    return this.apollo
      .watchQuery<{ getNearbyVolunteers: NearbyVolunteer[] }>({
        query: GET_NEARBY_VOLUNTEERS,
        variables: { lat, lng, radius },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map(r => (r.data?.getNearbyVolunteers ?? []) as NearbyVolunteer[]),
        catchError(() => of([])),
      );
  }
}