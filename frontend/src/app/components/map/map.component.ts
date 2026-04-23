import { AfterViewInit, ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { VolunteerRequestService } from '../../services/volunter-request.service';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { RequestFormComponent } from '../request-form/request-form.component';


@Component({
  selector: 'app-map',
  imports: [CommonModule, RequestFormComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
})
export class MapComponent implements OnInit, AfterViewInit {
  private requestService = inject(VolunteerRequestService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef); // 2. Впроваджуємо його
  private map!: L.Map;
  private temporaryMarker?: L.Marker;

  showForm = false;
  selectedLat = 0;
  selectedLng = 0;
  
  ngOnInit() {}

  ngAfterViewInit(): void {
    this.initMap();
    this.loadMarkers();    

    setTimeout(() => {
    if (this.map) {
      this.map.invalidateSize();
      }
    }, 200); // 200мс достатньо, щоб DOM "заспокоївся"
  }

  private initMap(): void {
    // Центруємо на Києві
    this.map = L.map('map').setView([50.45, 30.52], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Виправляємо баг з іконками Leaflet (вони часто губляться при збірці)
    const iconRetinaUrl = '/map-icons/marker-icon-2x.png';
    const iconUrl = '/map-icons/marker-icon.png';
    const shadowUrl = '/map-icons/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = iconDefault;

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMapClick(e);
    });
  }

  private onMapClick(e: L.LeafletMouseEvent): void {
    const { lat, lng } = e.latlng;

    // Видаляємо старий маркер
    if (this.temporaryMarker) {
      this.map.removeLayer(this.temporaryMarker);
    }

    // Створюємо новий
    this.temporaryMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(this.map);

    // Створюємо контейнер для попапа
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="text-align: center; font-family: sans-serif;">
        <p style="margin: 0 0 10px 0;">Координати: <br><b>${lat.toFixed(4)}, ${lng.toFixed(4)}</b></p>
        <button id="popup-btn" style="
          background: #007bff; 
          color: white; 
          border: none; 
          padding: 8px 12px; 
          border-radius: 4px; 
          cursor: pointer;
          font-weight: bold;
        ">Додати запит сюди</button>
      </div>
    `;

    // ВАЖЛИВО: Вішаємо подію ТУТ
    const btn = div.querySelector('#popup-btn');
    btn?.addEventListener('click', () => {
      console.log('Клік по кнопці в попапі зафіксовано!');
      this.zone.run(() => {
        this.selectedLat = lat;
        this.selectedLng = lng;
        this.showForm = true;
        console.log('showForm тепер:', this.showForm);
        this.map.closePopup();

        this.cdr.detectChanges();
      });
    });

    this.temporaryMarker.bindPopup(div).openPopup();
    }

    private loadMarkers(): void {
    this.requestService.getRequests().subscribe({
      next: (requests) => {
        requests.forEach((req: any) => {
          L.marker([req.location.lat, req.location.lng])
            .addTo(this.map)
            .bindPopup(`<b>${req.title}</b><br>${req.description}`);
        });
      },
      error: (err) => console.error('Помилка завантаження маркерів:', err)
    });
  }

  private openRequestForm(lat: number, lng: number): void {
    this.selectedLat = lat;
    this.selectedLng = lng;
    this.showForm = true;
  }

  onFormSubmitted() {
    this.showForm = false;
    // Очисти тимчасовий маркер, якщо потрібно
    if (this.temporaryMarker) this.map.removeLayer(this.temporaryMarker);
  }
}
