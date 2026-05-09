import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';

// Сервіси
import { VolunteerRequestService } from '../../core/services/volunter-request.service';
import { GeoService } from '../../core/services/geo.service';
import { UiEventsService } from '../../core/services/ui-events.service';

// Компоненти
import { RequestFormComponent, RequestDetailsComponent } from '../../shared/components';
import { RequestListComponent } from './components/request-list/request-list.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RequestFormComponent, RequestDetailsComponent, RequestListComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
})
export class MapComponent implements OnInit, AfterViewInit {
  private requestService = inject(VolunteerRequestService);
  private geoService = inject(GeoService); // Використовуємо наш новий сервіс
  private uiEventsService = inject(UiEventsService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  
  private map!: L.Map;
  private temporaryMarker?: L.Marker;
  private markersClusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    chunkedLoading: true
  });

  requests$!: Observable<any[]>;

  showForm = false;
  selectedLat = 0;
  selectedLng = 0;
  selectedAddress = '';
  selectedRequest: any = null;

  ngOnInit() {
    this.requests$ = this.requestService.getRequests();

    this.uiEventsService.openCreateRequest$.subscribe(() => {
      this.handleHeaderCreateRequest();
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    // Виправляємо проблему з розміром карти при ініціалізації
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private initMap(): void {
    this.map = L.map('map', { zoomControl: false }).setView([50.45, 30.52], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.map.addLayer(this.markersClusterGroup);

    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));
  }

  private openPopupWithAddress(lat: number, lng: number, address: string): void {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="text-align: center; min-width: 150px;">
        <p style="margin-bottom: 8px; font-size: 13px;">${address}</p>
        <button id="add-btn" style="background:#2563eb; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; width:100%">Додати запит</button>
      </div>
    `;

    div.querySelector('#add-btn')?.addEventListener('click', () => {
      this.zone.run(() => {
        this.selectedLat = lat;
        this.selectedLng = lng;
        this.selectedAddress = address;
        this.showForm = true;
        this.cdr.detectChanges();
        this.map.closePopup();
      });
    });

    this.temporaryMarker?.bindPopup(div).openPopup();
  }

  private onMapClick(e: L.LeafletMouseEvent): void {
    const { lat, lng } = e.latlng;

    if (this.temporaryMarker) this.map.removeLayer(this.temporaryMarker);

    this.temporaryMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }).addTo(this.map);

    // Використання GeoService для зворотного геокодування
    this.geoService.getAddress(lat, lng).subscribe({
      next: (res) => {
        this.zone.run(() => {
          const address = res.display_name || 'Адреса не знайдена';
          this.openPopupWithAddress(lat, lng, address);
        });
      },
      error: () => {
        this.zone.run(() => {
          this.openPopupWithAddress(lat, lng, 'Не вдалося отримати адресу');
        });
      }
    });
  }

  updateMarkersOnMap(requests: any[]): void {
    if (!this.map) return;
    this.markersClusterGroup.clearLayers();

    const newMarkers = requests.map(req => {
      const category = this.requestService.getCategories().find(c => c.id === req.category);
      
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color:${category?.color || '#6b7280'}; width:30px; height:30px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); display:flex; align-items:center; justify-content:center; border:2px solid white;">
                <span style="transform:rotate(45deg); font-size:14px;">${category?.label.split(' ')[0] || '📍'}</span>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      const marker = L.marker([req.location.lat, req.location.lng], { icon: customIcon });
      marker.on('click', () => this.zone.run(() => {
        this.selectedRequest = req;
        this.cdr.detectChanges();
      }));
      return marker;
    });

    this.markersClusterGroup.addLayers(newMarkers);
  }

  onFormSubmitted() {
    this.showForm = false;
    if (this.temporaryMarker) {
      this.map.removeLayer(this.temporaryMarker);
      this.temporaryMarker = undefined;
    }
    // Оскільки дані в ListComponent оновлюються через Apollo refetchQueries, 
    // воно автоматично оновить маркери через (requestsFiltered)
  }

  onSelectFromList(request: any) {
    this.selectedRequest = request;
    this.showForm = false;
    this.map.flyTo([request.location.lat, request.location.lng], 16);
    this.openPopupForRequest(request);
  }

  private openPopupForRequest(request: any) {
    L.popup()
      .setLatLng([request.location.lat, request.location.lng])
      .setContent(`<b>${request.title}</b><br>${request.location.address}`)
      .openOn(this.map);
  }

  onResponseSent(requestId: string) {
    this.selectedRequest = null;
    // Логіка сповіщення
  }

  private handleHeaderCreateRequest(): void {
    const center = this.map.getCenter();
    this.onMapClick({ latlng: center } as L.LeafletMouseEvent);
    this.map.flyTo(center, this.map.getZoom());
  }
}