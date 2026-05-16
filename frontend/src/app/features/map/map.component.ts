import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, inject, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, debounceTime, distinctUntilChanged } from 'rxjs';

// Сервіси
import { VolunteerRequest, VolunteerRequestService } from '@features/requests';
import { GeoService } from '@features/geo/services/geo.service';
import { UiEventsService } from '@core/services/ui-events.service';
import { ModalService } from '@core/services/modal.service';
import { AuthService, ToastService } from '@core/services';
import { CaslService } from '@core/casl/services/casl.service';
import { VolunteerRequestsStore } from '@features/requests/services/volunteer-requests-store.service';

// Компоненти
import { RequestFormComponent, RequestDetailsComponent } from '@features/requests';
import { RequestListComponent } from '@features/map/components/request-list/request-list.component';
import { MapViewComponent } from '@features/map/components/map-view/map-view.component';
import { CreateRequestData } from '@core/models';
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, RequestFormComponent, RequestDetailsComponent, RequestListComponent, MapViewComponent, ModalComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
})
export class MapComponent implements OnInit, AfterViewInit {
  private requestService = inject(VolunteerRequestService);
  private geoService = inject(GeoService); 
  private uiEventsService = inject(UiEventsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private caslService = inject(CaslService);

  public user$ = this.authService.currentUser$;
  public store = inject(VolunteerRequestsStore);
  
  @ViewChild(MapViewComponent) private mapView?: MapViewComponent;
  
  private shouldAutoOpenCreateFormFromRoute = false;
  private pendingFlyToRequestId: string | null = null;
  
  // Потік для динамічної PostGIS фільтрації при русі карти
  private boundsChange$ = new Subject<{ lat: number; lng: number; radius: number }>();

  categories = this.requestService.getCategories();
  
  showForm = false;
  selectedLat = 0;
  selectedLng = 0;
  selectedAddress = '';
  selectedRequest: any = null;

  public isDeleteModalOpen = false;
  private requestIdToDelete: string | null = null;
  selectedRequestToEdit: VolunteerRequest | null = null;

  get canCreate(): boolean {
    return this.caslService.can('create', 'VolunteerRequest');
  }

  ngOnInit() {
    const initialRequestId = this.route.snapshot.queryParamMap.get('requestId');
    if (initialRequestId) {
      this.store.loadAllAndSelect(initialRequestId);
      this.pendingFlyToRequestId = initialRequestId;
    }

    this.route.queryParamMap.subscribe((params) => {
      if (params.get('action') === 'create') {
        this.shouldAutoOpenCreateFormFromRoute = true;
      }
    });

    // Ініціалізуємо реактивний PostGIS пошук з дебаунсом (захист від спаму запитами)
    this.boundsChange$.pipe(
      debounceTime(400),
      // distinctUntilChanged((prev, curr) => 
      //   Math.abs(prev.lat - curr.lat) < 0.001 && Math.abs(prev.lng - curr.lng) < 0.001 && prev.radius === curr.radius
      // )
    ).subscribe(({ lat, lng, radius }) => {

      console.log(`${lat} ${lng} ${radius}`)
      this.store.loadNearby({ lat, lng, radius }); 
    });

    this.uiEventsService.openCreateRequest$.subscribe((data?: CreateRequestData) => {
      if (!data) { this.handleHeaderCreateRequest(); return; }
      this.openFormForCreate(data.lat, data.lng, data.address || '');
    });
  }

  ngAfterViewInit(): void {
    if (this.pendingFlyToRequestId) {
      this.zone.run(() => {
        setTimeout(() => this.tryFlyToSelectedRequestAndClearQuery(), 400);
      });
    }

    if (this.shouldAutoOpenCreateFormFromRoute) {
      this.shouldAutoOpenCreateFormFromRoute = false;
      const center = this.mapView?.getCenter();
      this.handleHeaderCreateRequest({
        lat: center?.lat ?? 50.45,
        lng: center?.lng ?? 30.52,
        address: 'Київ, Україна',
      });

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { action: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  onMapBoundsChanged(event: { lat: number; lng: number; radius: number }) {
    console.log('📥 [MapComponent] Івент успішно прийнято з HTML:', event);
    this.boundsChange$.next(event);
  }

  private tryFlyToSelectedRequestAndClearQuery(): void {
    const req = this.store.selectedRequest();
    if (req && this.mapView) {
      this.mapView.flyTo(req.coords.lat, req.coords.lng, 16);
    }
    if (this.route.snapshot.queryParamMap.get('requestId')) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { requestId: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    this.pendingFlyToRequestId = null;
    this.cdr.markForCheck();
  }

  onMapClickRequested(lat: number, lng: number): void {
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

  onRequestSelectedFromMap(request: VolunteerRequest): void {
    this.store.select(request.id);
    this.showForm = false;
    this.mapView?.closeAllPopups(); 
    this.mapView?.flyTo(request.coords.lat, request.coords.lng, 16);
    this.cdr.detectChanges();
  }

  onSelectFromList(request: VolunteerRequest) {
    this.store.select(request.id);
    this.showForm = false;
    this.mapView?.closeAllPopups();
    this.mapView?.flyTo(request.coords.lat, request.coords.lng, 16);
  }

  onFormSubmitted(newRequest: any): void {
    this.showForm = false;
    this.selectedRequestToEdit = null;
    this.mapView?.clearTemporaryMarker();
    
    if (newRequest && newRequest.coords) {
      this.store.addOrUpdate(newRequest);
      this.mapView?.closeAllPopups();

      setTimeout(() => {
        const currentZoom = this.mapView?.getCurrentZoom() || 16;
        this.mapView?.flyTo(newRequest.coords.lat, newRequest.coords.lng, currentZoom);
        
        // Мануально тригеримо оновлення локальної гео-зони навколо нової точки
        this.updateSearchArea(newRequest.coords.lat, newRequest.coords.lng, currentZoom);
      }, 300);
    }
    
    this.cdr.detectChanges();
  }

  public handleHeaderCreateRequest(data?: CreateRequestData): void {
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

  onEditRequest(request: VolunteerRequest) {
    this.zone.run(() => {
      this.mapView?.closeAllPopups(); 
      this.selectedRequest = null;
      this.selectedRequestToEdit = request;
      this.selectedLat = request.coords.lat;
      this.selectedLng = request.coords.lng;
      this.selectedAddress = request.address;
      this.showForm = true;
      this.cdr.detectChanges();
    });
  }

  private openFormForCreate(lat: number, lng: number, address: string) {
    this.store.select(null); 
    this.selectedLat = lat;
    this.selectedLng = lng;
    this.selectedAddress = address;
    this.showForm = true;
    this.cdr.detectChanges();
  }

  onResponseSent(requestId: string): void {
    this.selectedRequest = null;
    
    // Виводимо гарний Toast про успішний відгук
    this.toastService.show(
      'Успішно', 
      'Ви успішно відгукнулися на запит! Організація зв\'яжеться з вами.', 
      'success'
    );

    // Оновлюємо дані в сторі, щоб статус запиту миттєво змінився на IN_PROGRESS
    // (Бекенд повертає оновлений запит, тому стор автоматично перерендерить карту)
    this.store.loadNearby({
      lat: this.selectedLat || 50.45,
      lng: this.selectedLng || 30.52,
      radius: this.mapView?.getCurrentZoom() ? Math.max(500, (20000000 / Math.pow(2, this.mapView.getCurrentZoom()))) : 5000
    });

    this.cdr.detectChanges();
  }

  onDeleteRequest(id: string) {
    this.requestIdToDelete = id;
    this.isDeleteModalOpen = true;
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (!this.requestIdToDelete) return;
    const id = this.requestIdToDelete;

    this.requestService.deleteRequest(id).subscribe({
      next: () => {
        this.store.remove(id); 
        this.toastService.show('Видалено', 'Запит успішно видалено', 'success');
        this.isDeleteModalOpen = false;
        this.requestIdToDelete = null;
      }
    });
  }

  private updateSearchArea(lat: number, lng: number, zoom: number) {
    // Конвертуємо зум карти в приблизний радіус пошуку в метрах для PostGIS
    const radius = Math.max(500, (20000000 / Math.pow(2, zoom)));
      this.boundsChange$.next({ lat, lng, radius });
  }
}