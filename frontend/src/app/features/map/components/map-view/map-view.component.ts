import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EnvironmentInjector, EventEmitter, Input, NgZone, OnChanges, Output, SimpleChanges, ViewChild, createComponent, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { RequestPopupComponent } from '../request-popup/request-popup.component';

export type MapCreateRequestPayload = { lat: number; lng: number; address: string };

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapViewComponent implements AfterViewInit, OnChanges {
  private zone = inject(NgZone);
  private injector = inject(EnvironmentInjector);
  private cdr = inject(ChangeDetectorRef);

  @Input() currentUserId?: string;
  @ViewChild('mapEl', { static: true }) private mapEl!: ElementRef<HTMLDivElement>;

  @Input({ required: true }) requests: any[] = [];
  @Input() categories: any[] = [];
  
  @Output() requestSelected = new EventEmitter<any>();
  @Output() createRequestRequested = new EventEmitter<{ lat: number; lng: number }>();
  @Output() createRequestConfirmed = new EventEmitter<MapCreateRequestPayload>();
  
  // 🗺️ Додаємо вихідний емітер для зв'язку з PostGIS
  @Output() boundsChanged = new EventEmitter<{ lat: number; lng: number; radius: number }>();

  private map?: L.Map;
  private temporaryMarker?: L.Marker;
  private markersClusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    chunkedLoading: true,
  });

  ngAfterViewInit(): void {
    this.initMap();
    setTimeout(() => {
      this.map?.invalidateSize();
      // Емітимо стартові межі, щоб завантажити перші маркери під час ініціалізації
      this.emitCurrentBounds();
    }, 200);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Якщо прийшли нові реквести з PostGIS і мапа вже готова — рендеримо
    if (changes['requests'] && this.map) {
      this.renderMarkers(this.requests);
    }
  }

  private renderMarkers(requests: any[]): void {
    if (!this.map) return;
    
    // Очищаємо кластери перед новим рендером
    this.markersClusterGroup.clearLayers();
    if (!requests || requests.length === 0) return;

    const newMarkers: L.Marker[] = [];

    requests.forEach((req) => {
      // 🛡️ Захист від відсутності координат у моделі
      if (!req.coords || typeof req.coords.lat !== 'number' || typeof req.coords.lng !== 'number') {
        return;
      }

      const category = this.categories?.find((c) => c.id === req.category);
      const isMine = !!(this.currentUserId && (
        req.organization?.userId === this.currentUserId || 
        req.volunteerId === this.currentUserId
      ));

      const isInProgress = req.status === 'in_progress';
      let borderColor = '#ffffff'; 
      let animationClass = '';

      if (isInProgress) {
        borderColor = '#2563eb'; 
        animationClass = 'marker-pulse-blue';
      }

      const customIcon = L.divIcon({
        className: 'custom-marker-wrapper',
        html: `
          <div class="${animationClass}" style="
            background-color: ${category?.color || '#6b7280'}; 
            width: 30px; height: 30px; 
            border-radius: 50% 50% 50% 0; 
            transform: rotate(-45deg); 
            display: flex; align-items: center; justify-content: center; 
            border: 3px solid ${borderColor};
            box-shadow: ${isMine ? '0 0 10px rgba(0,0,0,0.3)' : 'none'};
          ">
            <span style="transform: rotate(45deg); font-size: 14px;">
              ${ category?.label ? category.label.split(' ')[0] : '📌' }
            </span>
          </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      const marker = L.marker([req.coords.lat, req.coords.lng], { 
        icon: customIcon,
        zIndexOffset: isInProgress ? 1000 : 0 
      });

      marker.on('click', () => this.zone.run(() => this.openRequestPopup(req)));
      newMarkers.push(marker);
    });

    if (newMarkers.length > 0) {
      this.markersClusterGroup.addLayers(newMarkers);
    }
    this.cdr.markForCheck();
  }

  // Метод обчислення радіуса видимості та відправки івенту в PostGIS
  private emitCurrentBounds(): void {
    if (!this.map) return;
    
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    
    // Округляємо до цілого числа метрів, щоб уникнути дробових значень у GraphQL
    const radiusCalculated = Math.round(Math.max(500, (20000000 / Math.pow(2, zoom))));

    console.log('🗺️ [MapView] Карта змістилася. Емітимо наверх:', { lat: center.lat, lng: center.lng, radius: radiusCalculated });

    this.zone.run(() => {
      this.boundsChanged.emit({
        lat: center.lat,
        lng: center.lng,
        radius: radiusCalculated
      });
    });
  }

  private initMap(): void {
    this.map = L.map(this.mapEl.nativeElement, { zoomControl: false }).setView([50.45, 30.52], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    this.map.addLayer(this.markersClusterGroup);

    // 🔄 Зв'язуємо івенти руху карти з PostGIS сервісом
    this.map.on('moveend', () => this.emitCurrentBounds());
    this.map.on('zoomend', () => this.emitCurrentBounds());

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.zone.run(() => {
        this.createRequestRequested.emit({ lat, lng });
      });
    });
  }

  getCenter(): L.LatLng | null {
    return this.map ? this.map.getCenter() : null;
  }

  flyTo(lat: number, lng: number, zoom = 16): void {
    if (!this.map) return;
    this.map.flyTo([lat, lng], zoom);
  }

  closePopup(): void {
    this.map?.closePopup();
  }

  clearTemporaryMarker(): void {
    if (!this.map) return;
    if (this.temporaryMarker) {
      this.map.removeLayer(this.temporaryMarker);
      this.temporaryMarker = undefined;
    }
  }

  getCurrentZoom(): number {
    return this.map?.getZoom() || 13;
  }

  closeAllPopups(): void {
    this.map?.closePopup();
  }

  openRequestPopup(request: any): void {
    const componentRef = createComponent(RequestPopupComponent, {
      environmentInjector: this.injector
    });

    componentRef.instance.request = request;
    componentRef.instance.category = this.categories?.find(c => c.id === request.category);
    
    componentRef.instance.showDetails.subscribe((req) => {
      this.zone.run(() => {
        this.requestSelected.emit(req);
        this.map?.closePopup();         
      });
    });

    componentRef.changeDetectorRef.detectChanges();
    
    L.popup({ offset: [0, -20], className: 'custom-leaflet-popup' })
      .setLatLng([request.coords.lat, request.coords.lng])
      .setContent(componentRef.location.nativeElement)
      .openOn(this.map!);
  }

  showCreatePopupAt(lat: number, lng: number, address: string): void {
    if (!this.map) return;

    this.clearTemporaryMarker();
    this.temporaryMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    }).addTo(this.map);

    const div = document.createElement('div');
    div.innerHTML = `
      <div style="text-align: center; min-width: 150px;">
        <p style="margin-bottom: 8px; font-size: 13px;">${address}</p>
        <button id="add-btn" style="background:#2563eb; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; width:100%">Додати запит</button>
      </div>
    `;

    div.querySelector('#add-btn')?.addEventListener('click', () => {
      this.zone.run(() => {
        this.createRequestConfirmed.emit({ lat, lng, address });
        this.map?.closePopup();
      });
    });

    this.temporaryMarker?.bindPopup(div).openPopup();
  }
}