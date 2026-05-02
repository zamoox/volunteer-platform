 // features/map/components/request-list/request-list.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VolunteerRequestService } from '../../../../core/services/volunter-request.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-list.component.html'
})
export class RequestListComponent {
  private requestService = inject(VolunteerRequestService);
  
  // Отримуємо потік запитів прямо з GraphQL
  requests$: Observable<any[]> = this.requestService.getRequests();

  // Метод для центрування карти (реалізуємо через сервіс подій пізніше)
  onSelectRequest(req: any) {
    console.log('Обрано запит:', req);
  }
  
}