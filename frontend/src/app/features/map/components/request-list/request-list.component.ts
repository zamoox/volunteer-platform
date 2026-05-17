import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { type VolunteerRequest } from '@features/requests';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

import { 
  REQUEST_CATEGORIES, 
  REQUEST_SUBCATEGORIES_LABELS, 
  SUBCATEGORY_TO_CATEGORY_MAP,
  CATEGORIES_LIST,
  getPriorityGradation
} from '@features/requests/constants/request-categories.constant';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-list.component.html'
})
export class RequestListComponent implements OnChanges {
  // 🛡️ Отримуємо динамічний масив (усі або радіусні з відстанями) від батьківського MapComponent
  @Input() requests: VolunteerRequest[] = [];
  
  @Output() requestsFiltered = new EventEmitter<VolunteerRequest[]>();
  @Output() requestSelected = new EventEmitter<VolunteerRequest>();
  
  // Вхідний потік самого масиву перетворюємо в реактивний BehaviorSubject
  private requests$ = new BehaviorSubject<VolunteerRequest[]>([]);

  // Стріми фільтрації
  public selectedCategory$ = new BehaviorSubject<string | null>(null);
  public searchTerm$ = new BehaviorSubject<string>('');
  public sortBy$ = new BehaviorSubject<'priority' | 'date' | 'title' | 'distance'>('priority');

  categories = CATEGORIES_LIST;

  // Хелпер для перевірки, чи є хоч один запит із прорахованою відстанню (для UI кнопок)
  get hasDistanceData(): boolean {
    return this.requests.some(r => r.distance_m !== null && r.distance_m !== undefined);
  }
  
  // Головний обчислений потік, який ідеально реагує на введення та кліки користувача
  public filteredRequests$ = combineLatest([
    this.requests$,
    this.selectedCategory$,
    this.searchTerm$,
    this.sortBy$
  ]).pipe(
    map(([requests, category, term, sort]) => {
      let list = [...requests];

      // 1. Фільтрація за великими гуманітарними кластерами ООН
      if (category) {
        list = list.filter(r => {
          const mainCatId = SUBCATEGORY_TO_CATEGORY_MAP[r.subcategory] || 'OTHER';
          return mainCatId === category;
        });
      }

      // 2. Повнотекстовий пошук (назва, опис, підкатегорія)
      if (term) {
        const lowerTerm = term.toLowerCase();
        list = list.filter((r) => {
          const subcatLabel = REQUEST_SUBCATEGORIES_LABELS[r.subcategory] || '';
          return (
            (r.title ?? '').toLowerCase().includes(lowerTerm) ||
            (r.description ?? '').toLowerCase().includes(lowerTerm) ||
            subcatLabel.toLowerCase().includes(lowerTerm)
          );
        });
      }

      // 3. Комбіноване інтелектуальне сортування
      list.sort((a, b) => {
        if (sort === 'priority') {
          return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
        }
        if (sort === 'distance') {
          // 🛡️ НОВЕ: Сортування за метрами PostGIS (від найближчого)
          return (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity);
        }
        if (sort === 'date') {
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        }
        return (a.title ?? '').localeCompare(b.title ?? '');
      });

      // 4. Runtime-мапінг статичних стилів під UI-картки
      return list.map(req => {
        const mainCatId = SUBCATEGORY_TO_CATEGORY_MAP[req.subcategory] || 'OTHER';
        const priorityInfo = getPriorityGradation(req.priorityScore);
        return {
          ...req,
          uiLabel: REQUEST_SUBCATEGORIES_LABELS[req.subcategory] || 'Волонтерський запит',
          uiHex: REQUEST_CATEGORIES[mainCatId]?.hex || '#64748b',
          priorityLabel: priorityInfo.label,
          priorityBadgeClass: priorityInfo.badgeClass,
          priorityBg: priorityInfo.bgClass
        };
      });
    })
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requests']) {
      this.requests$.next(this.requests);
      
      // Автоматичний фолбек: якщо увімкнули ГІС-режим, але сортування стояло на "title", 
      // ми можемо залишити його, але якщо дані про відстань пропали — скидаємо на пріоритет
      if (!this.hasDistanceData && this.sortBy$.value === 'distance') {
        this.sortBy$.next('priority');
      }
    }
  }

  setCategory(id: string | null) {
    this.selectedCategory$.next(id);
  }

  onSearch(term: string) {
    this.searchTerm$.next(term);
  }

  onSort(type: 'priority' | 'date' | 'title' | 'distance') {
    this.sortBy$.next(type);
  }

  selectRequest(req: VolunteerRequest) {
    this.requestSelected.emit(req);
  }
}