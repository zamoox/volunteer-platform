import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, inject, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// Сервіси
import { VolunteerRequestService } from '../../core/services/volunter-request.service';
import { GeoService } from '../../core/services/geo.service';
import { UiEventsService } from '../../core/services/ui-events.service';

// Компоненти
import { RequestFormComponent, RequestDetailsComponent } from '../../shared/components';
import { RequestListComponent } from './components/request-list/request-list.component';
import { MapViewComponent } from './components/map-view/map-view.component';
import { Observable } from 'rxjs';
import { CreateRequestData } from '../../core/models/ui-events.model';

@Component({
  selector: 'app-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RequestFormComponent, RequestDetailsComponent, RequestListComponent, MapViewComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
})
export class MapComponent implements OnInit, AfterViewInit {
  private requestService = inject(VolunteerRequestService);
  private geoService = inject(GeoService); // Використовуємо наш новий сервіс
  private uiEventsService = inject(UiEventsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  
  @ViewChild(MapViewComponent) private mapView?: MapViewComponent;
  private shouldAutoOpenCreateFormFromRoute = false;

  requests$!: Observable<any[]>;
  categories = this.requestService.getCategories();
  requestsForMap: any[] = [];

  showForm = false;
  selectedLat = 0;
  selectedLng = 0;
  selectedAddress = '';
  selectedRequest: any = null;

  ngOnInit() {
    this.requests$ = this.requestService.getRequests();

    this.route.queryParamMap.subscribe((params) => {
      if (params.get('action') === 'create') {
        this.shouldAutoOpenCreateFormFromRoute = true;
      }
    });

    this.uiEventsService.openCreateRequest$.subscribe((data?: CreateRequestData) => {
      if (!data) {
        this.handleHeaderCreateRequest();
        return;
      }

      this.zone.run(() => {
        this.selectedRequest = null;
        this.selectedLat = data.lat;
        this.selectedLng = data.lng;
        this.selectedAddress = data.address || '';
        this.showForm = true;
        this.cdr.detectChanges();
      });
    });
  }

  ngAfterViewInit(): void {
    // Auto-open form when navigated to /map?action=create
    if (this.shouldAutoOpenCreateFormFromRoute) {
      this.shouldAutoOpenCreateFormFromRoute = false;
      const center = this.mapView?.getCenter();
      const lat = center?.lat ?? 50.45;
      const lng = center?.lng ?? 30.52;
      this.handleHeaderCreateRequest({
        lat,
        lng,
        address: 'Київ, Україна',
      });

      // Clear the query param to avoid reopening on refresh/back
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { action: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  onMapClickRequested(lat: number, lng: number): void {
    // Leaflet click flow: get address -> show popup with "Add request" in the map component
    this.mapView?.clearTemporaryMarker();
    this.geoService.getAddress(lat, lng).subscribe({
      next: (res) => {
        this.zone.run(() => {
          const address = res.display_name || 'Адреса не знайдена';
          this.mapView?.showCreatePopupAt(lat, lng, address);
        });
      },
      error: () => {
        this.zone.run(() => {
          this.mapView?.showCreatePopupAt(lat, lng, 'Не вдалося отримати адресу');
        });
      },
    });
  }

  onMapCreateConfirmed(payload: { lat: number; lng: number; address: string }): void {
    this.zone.run(() => {
      this.selectedRequest = null;
      this.selectedLat = payload.lat;
      this.selectedLng = payload.lng;
      this.selectedAddress = payload.address;
      this.showForm = true;
      this.cdr.detectChanges();
    });
  }

  onRequestsFiltered(requests: any[]): void {
    this.requestsForMap = requests;
  }

  onRequestSelectedFromMap(request: any): void {
    this.selectedRequest = request;
    this.showForm = false;
    this.cdr.detectChanges();
  }

  onFormSubmitted() {
    this.showForm = false;
    this.mapView?.clearTemporaryMarker();
    // Оскільки дані в ListComponent оновлюються через Apollo refetchQueries, 
    // воно автоматично оновить маркери через (requestsFiltered)
  }

  onSelectFromList(request: any) {
    this.selectedRequest = request;
    this.showForm = false;
    this.mapView?.flyTo(request.location.lat, request.location.lng, 16);
    this.mapView?.openRequestPopup(request);
  }

  onResponseSent(requestId: string) {
    this.selectedRequest = null;
    // Логіка сповіщення
  }

  private handleHeaderCreateRequest(data?: CreateRequestData): void {
    // Пріоритет: 1. Дані з сервісу -> 2. Центр карти
    const center = this.mapView?.getCenter();
    const lat = data?.lat ?? center?.lat ?? 50.45;
    const lng = data?.lng ?? center?.lng ?? 30.52;
    const address = data?.address ?? '';

    this.zone.run(() => {
      this.selectedLat = lat;
      this.selectedLng = lng;
      this.selectedAddress = address;
      this.showForm = true;
      this.cdr.detectChanges();
    });

    // Якщо адреси немає, запитуємо її через GeoService
    if (!address) {
      this.geoService.getAddress(lat, lng).subscribe({
        next: (res) => {
          this.zone.run(() => {
            this.selectedAddress = res.display_name || '';
            this.cdr.detectChanges();
          });
        }
      });
    }
  }
}