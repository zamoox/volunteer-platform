import { AfterViewInit, ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { VolunteerRequestService } from '../../core/services/volunter-request.service';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { CommonModule } from '@angular/common';
import { 
  RequestFormComponent, 
  RequestDetailsComponent 
} from '../../shared/components';
import { UiEventsService } from '../../core/services/ui-events.service';
import { RequestListComponent } from './components/request-list/request-list.component';

@Component({
  selector: 'app-map',
  standalone: true, // Переконайтеся, що standalone вказано, якщо це так
  imports: [CommonModule, RequestFormComponent, RequestDetailsComponent, RequestListComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
})
export class MapComponent implements OnInit, AfterViewInit {
  private requestService = inject(VolunteerRequestService);
  private uiEventsService = inject(UiEventsService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  
  private map!: L.Map;
  private temporaryMarker?: L.Marker;
  private markersGroup = L.layerGroup(); // Група для зручного очищення маркерів з бази

  private markersClusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false, // Опціонально: прибирає синій контур при наведенні
    spiderfyOnMaxZoom: true,     // Розгортає маркери "павутинкою" на макс. зумі
    chunkedLoading: true        // Покращує продуктивність при великій кількості точок
  });

  showForm = false;
  selectedLat = 0;
  selectedLng = 0;
  selectedAddress = ''; // Нове поле для адреси
  selectedRequest: any = null;

  ngOnInit() {
    this.uiEventsService.openCreateRequest$.subscribe(() => {
      this.handleHeaderCreateRequest();
    });
  }

  ngAfterViewInit(): void {
    this.initMap();

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);
  }

  private initMap(): void {
    this.map = L.map('map').setView([50.45, 30.52], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markersGroup.addTo(this.map); // Додаємо групу на карту

    // Налаштування іконок за замовчуванням
    const iconDefault = L.icon({
      iconRetinaUrl: '/map-icons/marker-icon-2x.png',
      iconUrl: '/map-icons/marker-icon.png',
      shadowUrl: '/map-icons/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    this.map.addLayer(this.markersClusterGroup);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMapClick(e);
    });
  }

  private onMapClick(e: L.LeafletMouseEvent): void {
    const { lat, lng } = e.latlng;

    // 1. Видаляємо попередній тимчасовий маркер
    if (this.temporaryMarker) {
      this.map.removeLayer(this.temporaryMarker);
    }

    // 2. Ставимо червоний маркер (візуальний фідбек відразу)
    this.temporaryMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }).addTo(this.map);

    // 3. Запитуємо адресу у сервісу
    this.requestService.getAddress(lat, lng).subscribe({
      next: (res) => {
        const address = res.display_name || 'Адреса не знайдена';
        this.openPopupWithAddress(lat, lng, address);
      },
      error: () => {
        this.openPopupWithAddress(lat, lng, 'Не вдалося отримати адресу');
      }
    });
  }

  private openPopupWithAddress(lat: number, lng: number, address: string): void {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="text-align: center; font-family: sans-serif; max-width: 200px;">
        <p style="margin: 0 0 10px 0; font-size: 13px;"><b>Адреса:</b><br>${address}</p>
        <button id="popup-btn" style="
          background: #007bff; 
          color: white; 
          border: none; 
          padding: 8px 12px; 
          border-radius: 4px; 
          cursor: pointer;
          font-weight: bold;
          width: 100%;
        ">Додати запит</button>
      </div>
    `;

    const btn = div.querySelector('#popup-btn');
    btn?.addEventListener('click', () => {
      this.zone.run(() => {
        this.selectedLat = lat;
        this.selectedLng = lng;
        this.selectedAddress = address; // Зберігаємо адресу
        this.showForm = true;
        this.map.closePopup();
        this.cdr.detectChanges();
      });
    });

    this.temporaryMarker?.bindPopup(div).openPopup();
  }

// map.component.ts

updateMarkersOnMap(requests: any[]): void {
  if (!this.map) return;
  
  // Очищуємо кластери
  this.markersClusterGroup.clearLayers();

  const newMarkers: L.Marker[] = [];

  requests.forEach((req: any) => {
    const categoryInfo = this.requestService.getCategories().find(c => c.id === req.category);
    
    const customIcon = L.divIcon({
      className: 'custom-category-marker',
      html: `
        <div style="
          background-color: ${categoryInfo?.color || '#6b7280'};
          width: 34px; height: 34px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        ">
          <span style="transform: rotate(45deg); font-size: 16px;">
            ${categoryInfo?.label.split(' ')[0] || '📍'}
          </span>
        </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34]
    });

    const marker = L.marker([req.location.lat, req.location.lng], { icon: customIcon });
    
    marker.on('click', () => {
      this.zone.run(() => {
        this.selectedRequest = req;
        this.cdr.detectChanges();
      });
    });

    newMarkers.push(marker);
  });

  // Додаємо всі маркери одним махом для кращої продуктивності
  this.markersClusterGroup.addLayers(newMarkers);
}


  onFormSubmitted() {
    this.showForm = false;
    if (this.temporaryMarker) {
      this.map.removeLayer(this.temporaryMarker);
      this.temporaryMarker = undefined;
    }
    //::TODO this.loadMarkers(); // Оновлюємо список з бази

  }

  private handleHeaderCreateRequest(): void {
    const center = this.map.getCenter();
    
    // Емулюємо клік по мапі, передаючи координати центру
    const mockEvent = {
      latlng: center
    } as L.LeafletMouseEvent;

    this.onMapClick(mockEvent);
    
    // Опціонально: плавно підлітаємо до центру, якщо користувач був далеко
    this.map.flyTo(center, this.map.getZoom());
  }

// src/app/features/map/map.component.ts

  onSelectFromList(request: any) {
    // 1. Зберігаємо вибраний запит для відображення деталей (app-request-details)
    this.selectedRequest = request; 
    this.showForm = false; // Закриваємо форму, якщо вона була відкрита

    // Якщо це мобільний пристрій, можна автоматично скролити до карти
    // або закривати мобільне меню/сайдбар
    //::TODO if (window.innerWidth < 768) {
      // Логіка для мобілок (наприклад, перемикання прапорця isSidebarOpen = false)
    // }

    // 2. Фокусуємо карту на координатах запиту
    if (request.location && request.location.lat && request.location.lng) {
      // flyTo забезпечує плавний "політ" до точки
      this.map.flyTo(
        [request.location.lat, request.location.lng], 
        16, // Рівень зуму (чим більше число, тим ближче фокус)
        {
          animate: true,
          duration: 1.5 // Тривалість анімації в секундах
        }
      );

      // 3. (Опціонально) Відкриваємо попап на карті автоматично
      // Це допоможе користувачу відразу зрозуміти, яка саме мітка вибрана
      this.openPopupForRequest(request);
    }
  }

  private openPopupForRequest(request: any) {
    // Шукаємо маркер у групі або просто створюємо тимчасовий попап
    L.popup()
      .setLatLng([request.location.lat, request.location.lng])
      .setContent(`<b>${request.title}</b><br>${request.location.address}`)
      .openOn(this.map);
  }

  // Оголошуємо метод, якого не вистачає:
  onResponseSent(requestId: string) {
    console.log('Користувач відгукнувся на запит з ID:', requestId);
    
    // Закриваємо панель деталей після успішного відгуку
    this.selectedRequest = null;
    
    // Тут у майбутньому можна додати виклик Apollo мутації, 
    // щоб записати відгук у базу даних
  }
  
}