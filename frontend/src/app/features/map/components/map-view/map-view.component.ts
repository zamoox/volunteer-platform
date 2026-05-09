import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';

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

  @ViewChild('mapEl', { static: true }) private mapEl!: ElementRef<HTMLDivElement>;

  @Input({ required: true }) requests: any[] = [];
  @Input() categories: any[] = [];
  @Output() requestSelected = new EventEmitter<any>();
  @Output() createRequestRequested = new EventEmitter<{ lat: number; lng: number }>();
  @Output() createRequestConfirmed = new EventEmitter<MapCreateRequestPayload>();

  private map?: L.Map;
  private temporaryMarker?: L.Marker;
  private markersClusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    chunkedLoading: true,
  });

  ngAfterViewInit(): void {
    this.initMap();
    setTimeout(() => this.map?.invalidateSize(), 200);
    this.renderMarkers(this.requests);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requests']) {
      this.renderMarkers(this.requests);
    }
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

  openRequestPopup(request: any): void {
    if (!this.map) return;
    L.popup()
      .setLatLng([request.location.lat, request.location.lng])
      .setContent(`<b>${request.title}</b><br>${request.location.address}`)
      .openOn(this.map);
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

  private initMap(): void {
    this.map = L.map(this.mapEl.nativeElement, { zoomControl: false }).setView([50.45, 30.52], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    this.map.addLayer(this.markersClusterGroup);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      this.zone.run(() => {
        this.createRequestRequested.emit({ lat, lng });
      });
    });
  }

  private renderMarkers(requests: any[]): void {
    if (!this.map) return;

    this.markersClusterGroup.clearLayers();
    if (!requests?.length) return;

    const newMarkers = requests.map((req) => {
      const category = this.categories?.find((c) => c.id === req.category);

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color:${category?.color || '#6b7280'}; width:30px; height:30px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); display:flex; align-items:center; justify-content:center; border:2px solid white;">
                <span style="transform:rotate(45deg); font-size:14px;">${category?.label.split(' ')[0] || '📍'}</span>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      const marker = L.marker([req.location.lat, req.location.lng], { icon: customIcon });
      marker.on('click', () =>
        this.zone.run(() => {
          this.requestSelected.emit(req);
        })
      );
      return marker;
    });

    this.markersClusterGroup.addLayers(newMarkers);
  }
}

