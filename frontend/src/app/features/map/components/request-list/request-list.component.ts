 // features/map/components/request-list/request-list.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VolunteerRequestService } from '../../../../core/services/volunter-request.service';
import { BehaviorSubject, Observable, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-list.component.html'
})
export class RequestListComponent {
  private requestService = inject(VolunteerRequestService);
  public selectedCategory$ = new BehaviorSubject<string | null>(null);

  categories = this.requestService.getCategories();
  
  // Отримуємо потік запитів прямо з GraphQL
  public requests$ = this.selectedCategory$.pipe(
    switchMap(category => this.requestService.getRequests(category))
  );

  getCategoryLabel(id: string): string {
    // Шукаємо категорію в масиві, який ми отримали з сервісу
    const category = this.categories.find(c => c.id === id);
    
    // Якщо знайшли — повертаємо лейбл, якщо ні — "📦 Інше"
    return category ? category.label : '📦 Інше';
  }

  setCategory(id: string | null) {
    this.selectedCategory$.next(id);
  }

  // Метод для центрування карти (реалізуємо через сервіс подій пізніше)
  onSelectRequest(req: any) {
    console.log('Обрано запит:', req);
  }
  
}