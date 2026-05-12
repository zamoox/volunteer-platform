import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  VolunteerRequestService,
  type VolunteerRequest,
} from '@features/requests';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-list.component.html'
})
export class RequestListComponent {
  @Output() requestsFiltered = new EventEmitter<VolunteerRequest[]>();
  @Output() requestSelected = new EventEmitter<VolunteerRequest>();
  
  private requestService = inject(VolunteerRequestService);
  
  // Стріми стану
  public selectedCategory$ = new BehaviorSubject<string | null>(null);
  public searchTerm$ = new BehaviorSubject<string>('');
  public sortBy$ = new BehaviorSubject<'date' | 'title'>('date');

  categories = this.requestService.getCategories();
  
  // Основний потік даних
  public filteredRequests$ = combineLatest([
    this.selectedCategory$.pipe(distinctUntilChanged()),
    this.searchTerm$.pipe(distinctUntilChanged()),
    this.sortBy$.pipe(distinctUntilChanged())
  ]).pipe(
    // Завантажуємо дані з сервера при зміні категорії
    switchMap(([category, term, sort]) => 
      this.requestService.getAllRequests(category).pipe(
        map(requests => ({ requests, term, sort }))
      )
    ),
    // Фільтруємо та сортуємо локально для миттєвого відгуку UI
    map(({ requests, term, sort }) => {
      let list = [...requests];

      // Пошук
      if (term) {
        const lowerTerm = term.toLowerCase();
        list = list.filter(
          (r) =>
            (r.title ?? '').toLowerCase().includes(lowerTerm) ||
            (r.description ?? '').toLowerCase().includes(lowerTerm),
        );
      }

      // Сортування
      list.sort((a, b) => {
        if (sort === 'date') {
          return (
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
          );
        }
        return (a.title ?? '').localeCompare(b.title ?? '');
      });

      return list;
    }),
    // Емітимо результат для мапи
    tap(filtered => this.requestsFiltered.emit(filtered))
  );

  getCategoryLabel(id: string): string {
    const category = this.categories.find(c => c.id === id);
    return category ? category.label : '📦 Інше';
  }

  // Методи оновлення стану
  setCategory(id: string | null) {
    this.selectedCategory$.next(id);
  }

  onSearch(term: string) {
    this.searchTerm$.next(term);
  }

  onSort(type: 'date' | 'title') {
    this.sortBy$.next(type);
  }

  selectRequest(req: VolunteerRequest) {
    this.requestSelected.emit(req);
  }
}