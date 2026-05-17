// features/map/components/map-view/map-view.component.ts
// Повна заміна або доповнення існуючого компонента

import {
  Component, Input, Output, EventEmitter,
  AfterViewInit, OnChanges, OnDestroy, SimpleChanges,
  inject, ChangeDetectionStrategy,
} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { VolunteerRequest } from '@features/requests/models/volunteer-request.model';
import { NearbyVolunteer } from '@features/volunteers/models/volunteer.model';
import { REQUEST_CATEGORIES } from '@features/requests/constants/request-categories.constant';

@Component({
  selector: 'app-map-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div id="mapEl" style="width:100%;height:100%;"></div>`,
})
export class MapViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  // ── вхідні дані ──────────────────────────────────────────────────────────
  @Input() requests: VolunteerRequest[] = [];
  @Input() volunteers: NearbyVolunteer[] = [];  
  @Input() userPosition: { lat: number; lng: number } | null = null; 

  // ── вихідні події ─────────────────────────────────────────────────────────
  @Output() requestSelected = new EventEmitter<VolunteerRequest>();
  @Output() createRequestRequested = new EventEmitter<{ lat: number; lng: number }>();

  private map!: L.Map;
  private requestCluster!: L.MarkerClusterGroup;
  private volunteerLayer!: L.LayerGroup; 
  private userMarker: L.Marker | null = null; 

  // ── Leaflet іконки ────────────────────────────────────────────────────────

  private buildRequestIcon(category: string): L.DivIcon {
    const cat = REQUEST_CATEGORIES[category] ?? REQUEST_CATEGORIES['OTHER'];
    return L.divIcon({
      className: '',
      html: `
        <div style="
          background:${cat.hex};
          width:36px;height:36px;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);
        ">
          <span style="transform:rotate(45deg);font-size:16px">${cat.emoji}</span>
        </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -38],
    });
  }

  // ── НОВЕ: іконка для волонтера ────────────────────────────────────────────
  private buildVolunteerIcon(volunteer: NearbyVolunteer): L.DivIcon {
    const initials = [volunteer.firstName, volunteer.lastName]
      .filter(Boolean)
      .map(n => n![0])
      .join('')
      .toUpperCase() || 'V';

    const rating = Math.round(volunteer.averageRating || 0);
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

    return L.divIcon({
      className: '',
      html: `
        <div style="
          background:#1D9E75;
          width:40px;height:40px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);
          font-size:14px;font-weight:600;color:white;
          font-family:sans-serif;
        " title="${volunteer.firstName || ''} ${volunteer.lastName || ''}\n${stars}">
          ${initials}
        </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }

  // ── НОВЕ: іконка для поточного користувача ────────────────────────────────
  private buildUserIcon(): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `
        <div style="
          width:16px;height:16px;border-radius:50%;
          background:#185FA5;border:3px solid white;
          box-shadow:0 0 0 3px rgba(24,95,165,.35);
        "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }

  // ── Ініціалізація Leaflet ─────────────────────────────────────────────────
  ngAfterViewInit(): void {
    this.map = L.map('mapEl', {
      center: [50.45, 30.52],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Кластер для запитів
    this.requestCluster = (L as any).markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
    });
    this.map.addLayer(this.requestCluster);

    // Окремий шар для волонтерів
    this.volunteerLayer = L.layerGroup().addTo(this.map);

    // Подвійний клік — створити запит
    this.map.on('dblclick', (e: L.LeafletMouseEvent) => {
      this.createRequestRequested.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    this.renderRequests();
    this.renderVolunteers();
    if (this.userPosition) this.renderUserMarker();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['requests']) this.renderRequests();
    if (changes['volunteers']) this.renderVolunteers();       // ← НОВЕ
    if (changes['userPosition']) this.renderUserMarker();    // ← НОВЕ
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  // ── Рендер маркерів запитів ───────────────────────────────────────────────
  private renderRequests(): void {
    if (!this.requestCluster) return;
    this.requestCluster.clearLayers();

    this.requests.forEach(req => {
      const loc = req.coords;
      if (!loc?.lat || !loc?.lng) return;

      const marker = L.marker([loc.lat, loc.lng], {
        icon: this.buildRequestIcon(req.category),
      });

      marker.on('click', () => this.requestSelected.emit(req));
      this.requestCluster.addLayer(marker);
    });
  }

  // ── НОВЕ: Рендер маркерів волонтерів ─────────────────────────────────────
  private renderVolunteers(): void {
    if (!this.volunteerLayer) return;
    this.volunteerLayer.clearLayers();

    this.volunteers.forEach(vol => {
      const c = vol.coords;
      if (!c?.lat || !c?.lng) return;

      const marker = L.marker([c.lat, c.lng], {
        icon: this.buildVolunteerIcon(vol),
        zIndexOffset: 100, // Волонтери поверх запитів
      });

      const name = [vol.firstName, vol.lastName].filter(Boolean).join(' ') || 'Волонтер';
      const rating = vol.averageRating?.toFixed(1) ?? '—';

      marker.bindTooltip(
        `<b>${name}</b><br>⭐ ${rating} · ✅ ${vol.completedRequestsCount} виконань`,
        { direction: 'top', offset: [0, -22] },
      );

      this.volunteerLayer.addLayer(marker);
    });
  }

  // ── НОВЕ: Мітка поточного користувача ────────────────────────────────────
  private renderUserMarker(): void {
    if (!this.map || !this.userPosition) return;

    if (this.userMarker) {
      this.userMarker.setLatLng([this.userPosition.lat, this.userPosition.lng]);
    } else {
      this.userMarker = L.marker(
        [this.userPosition.lat, this.userPosition.lng],
        { icon: this.buildUserIcon(), zIndexOffset: 1000 },
      )
        .addTo(this.map)
        .bindTooltip('Ваше місцезнаходження', { permanent: false });
    }

    // Центруємо карту на першу позицію
    if (!this._centeredOnUser) {
      this.map.setView([this.userPosition.lat, this.userPosition.lng], 13);
      this._centeredOnUser = true;
    }
  }
  private _centeredOnUser = false;

  // ── Публічний метод для flyTo ─────────────────────────────────────────────
  flyTo(lat: number, lng: number, zoom = 15): void {
    this.map?.flyTo([lat, lng], zoom, { duration: 0.8 });
  }
}