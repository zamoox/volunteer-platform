import { AfterViewInit, ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { VolunteerRequestService } from '../../core/services/volunter-request.service';
import * as L from 'leaflet';
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
    this.loadMarkers();    

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

  private loadMarkers(): void {
    this.requestService.getRequests().subscribe({
      next: (res: any) => {
        const requests = res.data?.getAllRequests || res;
        this.markersGroup.clearLayers();
        
        requests.forEach((req: any) => {
          const marker = L.marker([req.location.lat, req.location.lng]);
          
          // ЗАМІСТЬ .bindPopup робимо клік
          marker.on('click', () => {
            this.zone.run(() => {
              this.selectedRequest = req; // Передаємо дані в сайдбар
              this.cdr.detectChanges();
            });
          });

          marker.addTo(this.markersGroup);
        });
      }
    });
  }

  onFormSubmitted() {
    this.showForm = false;
    if (this.temporaryMarker) {
      this.map.removeLayer(this.temporaryMarker);
      this.temporaryMarker = undefined;
    }
    this.loadMarkers(); // Оновлюємо список з бази
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

  onSelectFromList(request: any) {
    this.selectedRequest = request; // Відкриваємо деталі
    this.showForm = false; // Закриваємо форму, якщо була відкрита
    
    // Плавно переміщуємо карту до вибраного запиту
    if (request.location) {
      this.map.flyTo([request.location.lat, request.location.lng], 16, {
        animate: true,
        duration: 1.5
      });
    }
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