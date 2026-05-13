import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, inject, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// Сервіси
import { VolunteerRequest, VolunteerRequestService } from '@features/requests';
import { GeoService } from '@features/geo/services/geo.service';
import { UiEventsService } from '@core/services/ui-events.service';

// Компоненти
import { RequestFormComponent, RequestDetailsComponent } from '@features/requests';
import { RequestListComponent } from '@features/map/components/request-list/request-list.component';
import { MapViewComponent } from '@features/map/components/map-view/map-view.component';
import { Observable } from 'rxjs';
import { CreateRequestData } from '@core/models';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ModalService } from '@core/services/modal.service';
import { AuthService, ToastService } from '@core/services';
import { CaslService } from '@core/casl/services/casl.service';
import { VolunteerRequestsStore } from '@features/requests/services/volunteer-requests-store.service';

@Component({
  selector: 'app-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private modalService = inject(ModalService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private caslService = inject(CaslService);


  // Додаємо публічну властивість для шаблону
  public user$ = this.authService.currentUser$;

  // Додаємо публічну властивість для шаблону

  public store = inject(VolunteerRequestsStore);
  
  @ViewChild(MapViewComponent) private mapView?: MapViewComponent;
  private shouldAutoOpenCreateFormFromRoute = false;
  /** Після навігації з `?requestId=` — підсвітити запит, коли карта готова. */
  private pendingFlyToRequestId: string | null = null;

  categories = this.requestService.getCategories();
  requestsForMap: any[] = [];

  showForm = false;
  selectedLat = 0;
  selectedLng = 0;
  selectedAddress = '';
  selectedRequest: any = null;

  public isDeleteModalOpen = false;
  private requestIdToDelete: string | null = null;

  selectedRequestToEdit: VolunteerRequest | null = null;


  // Перевірка права на створення (для шаблону)
  get canCreate(): boolean {
    return this.caslService.can('create', 'VolunteerRequest');
  }

  ngOnInit() {
    const initialRequestId = this.route.snapshot.queryParamMap.get('requestId');
    if (initialRequestId) {
      this.store.loadAllAndSelect(initialRequestId);
      this.pendingFlyToRequestId = initialRequestId;
    } else {
      this.store.loadAll();
    }

    this.route.queryParamMap.subscribe((params) => {
      if (params.get('action') === 'create') {
        this.shouldAutoOpenCreateFormFromRoute = true;
      }
    });

    // 2. Слухаємо зовнішні події створення
    this.uiEventsService.openCreateRequest$.subscribe((data?: CreateRequestData) => {
      if (!data) { this.handleHeaderCreateRequest(); return; }
      this.openFormForCreate(data.lat, data.lng, data.address || '');
    });
  }

  private tryFlyToSelectedRequestAndClearQuery(): void {
    const req = this.store.selectedRequest();
    if (req && this.mapView) {
      this.mapView.flyTo(req.location.lat, req.location.lng, 16);
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

  ngAfterViewInit(): void {
    if (this.pendingFlyToRequestId) {
      this.zone.run(() => {
        setTimeout(() => this.tryFlyToSelectedRequestAndClearQuery(), 400);
      });
    }

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


  onRequestSelectedFromMap(request: VolunteerRequest): void {
    this.store.select(request.id);
    this.showForm = false;
    
    // Примусово закриваємо попап, якщо він був відкритий
    this.mapView?.closeAllPopups(); 
    
    this.mapView?.flyTo(request.location.lat, request.location.lng, 16);
    this.cdr.detectChanges();
  }

  onSelectFromList(request: VolunteerRequest) {
    this.store.select(request.id);
    this.showForm = false;
    
    // Закриваємо попап, бо ми перейшли до деталей зі списку
    this.mapView?.closeAllPopups();
    
    this.mapView?.flyTo(request.location.lat, request.location.lng, 16);
    // Ми більше не викликаємо openRequestPopup(request) тут, 
    // щоб не перекривати панель деталей
  }

  // Обробка форми
onFormSubmitted(newRequest: any): void { // Використовуємо any або VolunteerRequest | void
  this.showForm = false;
  this.selectedRequestToEdit = null;
  this.mapView?.clearTemporaryMarker();
  
  // Якщо форма повернула дані (успішне створення або редагування)
  if (newRequest && newRequest.location) {
    this.store.addOrUpdate(newRequest);
    
    // Закриваємо всі відкриті попапи на карті
    this.mapView?.closeAllPopups();

    // Невелика затримка, щоб DOM карти встиг оновитися
    setTimeout(() => {
      // Використовуємо поточний зум карти, щоб не "зумити" примусово (без масштабування)
      const currentZoom = this.mapView?.getCurrentZoom() || 16;
      
      this.mapView?.flyTo(
        newRequest.location.lat, 
        newRequest.location.lng, 
        currentZoom // передаємо поточний зум замість фіксованого 16
      );
      
      // Якщо хочеш просто показати маркер без попапа — на цьому все.
      // Якщо треба підсвітити — можна викликати метод підсвічування без відкриття вікна.
    }, 300);
  }
  
  this.cdr.detectChanges();
}



  onResponseSent(requestId: string) {
    this.selectedRequest = null;
    // Логіка сповіщення
  }

  public handleHeaderCreateRequest(data?: CreateRequestData): void {
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

  onEditRequest(request: VolunteerRequest) {
    this.zone.run(() => {
      this.mapView?.closeAllPopups(); // 🟢 Попап зникає при редагуванні
      this.selectedRequest = null;
      this.selectedRequestToEdit = request;
      this.selectedLat = request.location.lat;
      this.selectedLng = request.location.lng;
      this.selectedAddress = request.location.address;
      this.showForm = true;
      this.cdr.detectChanges();
    });
  }

  private openFormForCreate(lat: number, lng: number, address: string) {
    this.store.select(null); // Закриваємо деталі, якщо були відкриті
    this.selectedLat = lat;
    this.selectedLng = lng;
    this.selectedAddress = address;
    this.showForm = true;
    this.cdr.detectChanges();
  }

  // 2. ПІДГОТОВКА ДО ВИДАЛЕННЯ
  onDeleteRequest(id: string) {
    this.requestIdToDelete = id;
    this.isDeleteModalOpen = true;
    this.cdr.detectChanges();
  }

  // 3. ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ
  confirmDelete() {
      if (!this.requestIdToDelete) return;
      const id = this.requestIdToDelete;

      this.requestService.deleteRequest(id).subscribe({
        next: () => {
          this.store.remove(id); // Видаляємо зі стору — мапа і список оновляться самі
          this.toastService.show('Видалено', 'Запит успішно видалено', 'success');
          this.isDeleteModalOpen = false;
          this.requestIdToDelete = null;
        }
      });
    }
}