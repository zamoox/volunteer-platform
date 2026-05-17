import {
  Component, OnInit, OnDestroy, ViewChild, inject,
  ChangeDetectionStrategy, ChangeDetectorRef, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

// Компоненти
import { MapViewComponent } from './components/map-view/map-view.component';
import { RequestListComponent } from './components/request-list/request-list.component';
import { RequestDetailsComponent } from '@features/requests/components/request-detail/request-details.component';
import { RequestFormComponent } from '@features/requests/components/request-form/request-form.component';
import { ModalComponent } from '@shared/components/modal/modal.component'; // 🛡️ ДОДАНО ІМПОРТ МОДАЛКИ

// Сервіси та Моделі
import { VolunteerRequestsStore } from '@features/requests/services/volunteer-requests-store.service';
import { VolunteerRequest } from '@features/requests/models/volunteer-request.model';
import { NearbyVolunteer } from '@features/volunteers/models/volunteer.model';
import { VolunteerLocationService, GeoPosition } from '@features/volunteers/services/volunteer-location.service';
import { AuthService } from '@core/services/auth.service';
import { VolunteerRequestService } from '@features/requests';
import { GeoService } from '@features/geo/services/geo.service';
import { ToastService } from '@core/services/toast.service';
import { UiEventsService } from '@core/services/ui-events.service';

@Component({
  selector: 'app-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MapViewComponent,
    RequestListComponent,
    RequestDetailsComponent,
    RequestFormComponent,
    ModalComponent // 🛡️ ДОДАНО В IMPORTS (щоб не було помилки NG8001)
  ],
  templateUrl: './map.component.html',
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild(MapViewComponent) mapView!: MapViewComponent;

  // 🛡️ СТОР МАЄ БУТИ PUBLIC, щоб HTML мав до нього доступ
  public store           = inject(VolunteerRequestsStore);
  private authService      = inject(AuthService);
  private requestService   = inject(VolunteerRequestService);
  private geoService       = inject(GeoService);
  private toastService     = inject(ToastService);
  private uiEvents         = inject(UiEventsService);
  private locationService  = inject(VolunteerLocationService);
  private cdr              = inject(ChangeDetectorRef);
  private subs             = new Subscription();

  // ── Стан HTML (Форми та Модалки) ─────────────────────────────────────────
  showForm = false;
  selectedLat = 0;
  selectedLng = 0;
  selectedAddress = '';
  selectedRequestToEdit: VolunteerRequest | null = null;
  
  isDeleteModalOpen = false;
  private requestIdToDelete: string | null = null;

nearbyVolunteers = signal<NearbyVolunteer[]>([
  {
    id: 'vol-1',
    userId: '1',
    firstName: 'Дмитро',
    lastName: 'Коваленко',
    averageRating: 4.9,
    completedRequestsCount: 24,
    coords: { lat: 50.4750, lng: 30.4420 }
  },
  {
    id: 'vol-2',
    userId: '2',
    firstName: 'Анна',
    lastName: 'Петренко',
    averageRating: 4.7,
    completedRequestsCount: 12,
    coords: { lat: 50.4695, lng: 30.4280 }
  }
] as NearbyVolunteer[]);
  

  // ── НОВЕ: геолокаційний стан ──────────────────────────────────────────────
  userPosition = signal<{ lat: number; lng: number } | null>({ lat: 50.4735, lng: 30.4340 });
  // nearbyVolunteers = signal<NearbyVolunteer[]>(this.nearVolunteers);
  isNearbyMode = signal(false);
  nearbyRequests = signal<VolunteerRequest[]>([]);

  get currentUser() { return this.authService.getUserFromStorage(); }
  get isVolunteer(): boolean { return this.currentUser?.role === 'volunteer'; }

  ngOnInit(): void {
    this.store.loadAll();
    this.initGeolocation();

    this.subs.add(
      this.uiEvents.openCreateRequest$.subscribe(data => {
        if (data) {
          this.selectedLat = data.lat;
          this.selectedLng = data.lng;
          this.selectedAddress = data.address ?? '';
        }
        this.showForm = true;
        this.cdr.markForCheck();
      }),
    );
  }

  // ── Геолокація ────────────────────────────────────────
  private initGeolocation(): void {
    this.subs.add(
      this.locationService.getCurrentPosition().subscribe({
        next: (pos: GeoPosition) => {
          this.userPosition.set({ lat: pos.lat, lng: pos.lng });
          this.cdr.markForCheck();

          if (this.isVolunteer) {
            this.enableNearbyMode(pos.lat, pos.lng);
          }
        },
        error: () => console.warn('Geolocation недоступна'),
      }),
    );

    if (this.isVolunteer) {
      let lastSyncTime = 0;
      this.subs.add(
        this.locationService.watchAndSyncLocation().subscribe(pos => {
          this.userPosition.set({ lat: pos.lat, lng: pos.lng });
          this.cdr.markForCheck();

          const now = Date.now();
          if (now - lastSyncTime > 120_000) { 
            lastSyncTime = now;
            this.locationService.pushLocation(pos.lat, pos.lng).subscribe();
          }
        }),
      );
    }
  }

  private enableNearbyMode(lat: number, lng: number): void {
    this.isNearbyMode.set(true);
    this.locationService.pushLocation(lat, lng).subscribe();

    this.subs.add(
      this.requestService.getNearbyRequests(lat, lng, 5000).subscribe(requests => {
        this.nearbyRequests.set(requests);
        this.cdr.markForCheck();
      })
    );

    this.subs.add(
      this.locationService.getNearbyVolunteers(lat, lng, 10_000).subscribe(volunteers => {
        this.nearbyVolunteers.set(volunteers);
        this.cdr.markForCheck();
      })
    );
  }

  get displayedRequests(): VolunteerRequest[] {
    return this.isNearbyMode() ? this.nearbyRequests() : this.store.requests();
  }

  // ── Обробники подій HTML ───────────────────────────────────────────────────
  
  onSelectFromList(req: VolunteerRequest): void {
    this.store.select(req.id);
    if (req.coords?.lat && req.coords?.lng) {
      this.mapView?.flyTo(req.coords.lat, req.coords.lng, 15);
    }
  }

  onMapRequestSelected(req: VolunteerRequest): void {
    this.store.select(req.id);
    // 🛡️ ВИПРАВЛЕНО: req.location -> req.coords
    if (req.coords?.lat && req.coords?.lng) {
      this.mapView?.flyTo(req.coords.lat, req.coords.lng, 15);
    }
  }

  onCreateRequested(coords: { lat: number; lng: number }): void {
    this.geoService.getAddress(coords.lat, coords.lng).subscribe(result => {
      this.selectedLat = coords.lat;
      this.selectedLng = coords.lng;
      // 🛡️ ВИПРАВЛЕНО: result?.label -> result?.display_name (GeoService повертає display_name)
      this.selectedAddress = result?.display_name ?? '';
      
      this.showForm = true;
      this.cdr.markForCheck();
    });
  }

  onFormSubmitted(newRequest: any): void {
    this.showForm = false;
    this.selectedRequestToEdit = null;
    this.store.loadAll();
    this.cdr.markForCheck();
  }

  onEditRequest(request: VolunteerRequest): void {
    this.selectedRequestToEdit = request;
    this.selectedLat = request.coords.lat;
    this.selectedLng = request.coords.lng;
    this.selectedAddress = request.address;
    this.showForm = true;
    this.cdr.markForCheck();
  }

  onDeleteRequest(id: string): void {
    this.requestIdToDelete = id;
    this.isDeleteModalOpen = true;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (!this.requestIdToDelete) return;
    this.requestService.deleteRequest(this.requestIdToDelete).subscribe(() => {
      this.store.remove(this.requestIdToDelete!);
      this.toastService.show('Видалено', 'Запит успішно видалено', 'success');
      this.isDeleteModalOpen = false;
      this.requestIdToDelete = null;
      this.cdr.markForCheck();
    });
  }

  onResponseSent(requestId: string): void {
    this.toastService.show('Успішно', 'Ви відгукнулися на запит!', 'success');
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}