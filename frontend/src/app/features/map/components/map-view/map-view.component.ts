// features/map/components/map-view/map-view.component.ts

import {
  Component, Input, Output, EventEmitter,
  AfterViewInit, OnChanges, OnDestroy, SimpleChanges,
  inject, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.heat';
import 'leaflet.markercluster';
import { VolunteerRequest } from '@features/requests/models/volunteer-request.model';
import { NearbyVolunteer } from '@features/volunteers/models/volunteer.model';
import { REQUEST_CATEGORIES, SUBCATEGORY_TO_CATEGORY_MAP } from '@features/requests/constants/request-categories.constant';
import { MapControlsComponent } from '../map-controls/map-controls.component';
import { RISK_ZONES_CONFIG, RiskLevel } from '@features/map/interfaces/risk-zone.interface';

@Component({
  selector: 'app-map-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MapControlsComponent],
  templateUrl: './map-view.component.html', // 🛡️ ФІКС: Перемкнули на зовнішній HTML-файл
  styleUrl: './map-view.component.css'
})
export class MapViewComponent implements AfterViewInit, OnChanges, OnDestroy {

  // ── вхідні дані ──────────────────────────────────────────────────────────
  @Input() requests: VolunteerRequest[] = [];
  @Input() volunteers: NearbyVolunteer[] = [];  
  @Input() userPosition: { lat: number; lng: number } | null = null; 
  
  // ── вихідні події ─────────────────────────────────────────────────────────
  @Output() requestSelected = new EventEmitter<VolunteerRequest>();
  @Output() createRequestRequested = new EventEmitter<{ lat: number; lng: number }>();
  
  private cdr = inject(ChangeDetectorRef);

  private map!: L.Map;
  private requestCluster!: L.MarkerClusterGroup;
  private volunteerLayer!: L.LayerGroup; 
  private userMarker: L.Marker | null = null; 
  private heatLayer: any = null;
  public isHeatmapMode = false;

    // ── Ініціалізація Leaflet ─────────────────────────────────────────────────
  ngAfterViewInit(): void {
    // 🛡️ ФІКС: Ініціалізуємо карту на ізольованому 'mapTarget', щоб Leaflet не затирав контролер!
    this.map = L.map('mapTarget', {
      center: [50.45, 30.52],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.requestCluster = (L as any).markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
    });
    this.map.addLayer(this.requestCluster);

    this.volunteerLayer = L.layerGroup().addTo(this.map);

    this.map.on('dblclick', (e: L.LeafletMouseEvent) => {
      this.createRequestRequested.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    this.initRiskZonesLayer();
    this.renderRequests();
    this.renderVolunteers();
    this.renderHeatmap();
    if (this.userPosition) this.renderUserMarker();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['requests']) {
      this.renderRequests();
      this.renderHeatmap();
    }
    if (changes['volunteers']) this.renderVolunteers();       
    if (changes['userPosition']) this.renderUserMarker();    
  }

  ngOnDestroy(): void {
    if (this.heatLayer && this.map) {
      this.map.removeLayer(this.heatLayer);
    }
    this.map?.remove();
  }

  // ── Leaflet іконки ────────────────────────────────────────────────────────
  private buildRequestIcon(subcategory: string): L.DivIcon {
    // 🛡️ ОНОВЛЕНО: Використовуємо двовекторну архітектуру (мапимо підкатегорію в головний кластер ООН)
    const mainCatId = SUBCATEGORY_TO_CATEGORY_MAP[subcategory] || 'OTHER';
    const cat = REQUEST_CATEGORIES[mainCatId] ?? REQUEST_CATEGORIES['OTHER'];
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



  public onToggleHeatmapModeDirectly(heatMode: boolean): void {
    this.isHeatmapMode = heatMode;
    console.log('ГІС контролер змінив режим теплової карти:', this.isHeatmapMode);

    if (this.isHeatmapMode) {
      if (this.requestCluster && this.map.hasLayer(this.requestCluster)) {
        this.map.removeLayer(this.requestCluster);
      }
      if (this.heatLayer) {
        this.heatLayer.addTo(this.map);
      }
    } else {
      if (this.requestCluster && !this.map.hasLayer(this.requestCluster)) {
        this.map.addLayer(this.requestCluster);
      }
      if (this.heatLayer && this.map.hasLayer(this.heatLayer)) {
        this.map.removeLayer(this.heatLayer);
      }
    }

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        this.map.setZoom(this.map.getZoom());
      }
      this.cdr.detectChanges();
    }, 50);
  }

  // ── РЕНДЕР ТЕПЛОВОЇ КАРТИ (МАТЕМАТИЧНА МОДЕЛЬ ЗВАЖЕНОЇ ЩІЛЬНОСТІ) ──────────
  private renderHeatmap(): void {
    if (!this.map) return;

    if (this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
    }

    const heatPoints = this.requests
      .filter(req => req.coords?.lat && req.coords?.lng)
      .map(req => [
        req.coords.lat,
        req.coords.lng,
        req.priorityScore ?? 0.3 
      ]);

    this.heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 40, // Злегка збільшений радіус для кращої видимості
      blur: 18,
      maxZoom: 16,
      max: 1.0, 
      gradient: {
        0.2: '#3b82f6', 
        0.5: '#10b981', 
        0.75: '#f59e0b', 
        1.0: '#ef4444'  
      }
    });

    if (this.isHeatmapMode) {
      this.heatLayer.addTo(this.map);
    }
  }

  private renderRequests(): void {
    if (!this.requestCluster) return;
    this.requestCluster.clearLayers();

    this.requests.forEach(req => {
      const loc = req.coords;
      if (!loc?.lat || !loc?.lng) return;

      const marker = L.marker([loc.lat, loc.lng], {
        icon: this.buildRequestIcon(req.subcategory), // 🛡️ Передаємо subcategory замість застарілого category
      });

      marker.on('click', () => this.requestSelected.emit(req));
      this.requestCluster.addLayer(marker);
    });
  }

  private renderVolunteers(): void {
    if (!this.volunteerLayer) return;
    this.volunteerLayer.clearLayers();

    this.volunteers.forEach(vol => {
      const c = vol.coords;
      if (!c?.lat || !c?.lng) return;

      const marker = L.marker([c.lat, c.lng], {
        icon: this.buildVolunteerIcon(vol),
        zIndexOffset: 100, 
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

    if (!this._centeredOnUser) {
      this.map.setView([this.userPosition.lat, this.userPosition.lng], 13);
      this._centeredOnUser = true;
    }
  }
  private _centeredOnUser = false;

  flyTo(lat: number, lng: number, zoom = 15): void {
    this.map?.flyTo([lat, lng], zoom, { duration: 0.8 });
  }

  private initRiskZonesLayer(): void {
    RISK_ZONES_CONFIG.forEach(zone => {
      const styles = this.getZoneVisualStyles(zone.level);
      
      // Створюємо просторове коло відповідно до ГІС-радіусу PostGIS
      const riskCircle = L.circle([zone.lat, zone.lng], {
        radius: zone.radiusMeters,
        color: styles.color,
        fillColor: styles.fillColor,
        fillOpacity: styles.fillOpacity,
        weight: 2,
        dashArray: '6, 9' // Елегантний ГІС-пунктир для відображення меж
      });

      // Інтерактивна підказка (Tooltip) при наведенні курсора миші
      riskCircle.bindTooltip(`
        <div class="p-1 font-sans">
          <strong class="text-gray-900 block border-b pb-1 mb-1">${zone.name}</strong>
          <span class="text-sm text-gray-700">Коефіцієнт ризику ООН: <strong>х${zone.weight}</strong></span>
        </div>
      `, { sticky: true });

      riskCircle.addTo(this.map);
    });
  }

  // Обчислення палітри кольорів відповідно до ступеня небезпеки (Наказ № 309)
  private getZoneVisualStyles(level: RiskLevel) {
    switch (level) {
      case RiskLevel.OCCUPIED:
        return { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.24 }; // Суворий червоний (Tailwind red-500)
      case RiskLevel.ACTIVE:
        return { color: '#f97316', fillColor: '#f97316', fillOpacity: 0.20 }; // Помаранчевий (Tailwind orange-500)
      case RiskLevel.POSSIBLE:
        return { color: '#eab308', fillColor: '#eab308', fillOpacity: 0.15 }; // Жовтий (Tailwind yellow-500)
      default:
        return { color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.08 }; // Безпечний тил (Tailwind green-500)
    }
  }
}