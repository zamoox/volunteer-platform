import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VolunteerRequestService, type VolunteerRequest } from '@features/requests';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, switchMap, tap } from 'rxjs';

// 🛡️ ІМПОРТУЄМО НАШУ ДВОВЕКТОРНУ АРХІТЕКТУРУ Й UI-КЛАСИ
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
export class RequestListComponent {
  @Output() requestsFiltered = new EventEmitter<VolunteerRequest[]>();
  @Output() requestSelected = new EventEmitter<VolunteerRequest>();
  
  private requestService = inject(VolunteerRequestService);
  
  // Стріми стану
  public selectedCategory$ = new BehaviorSubject<string | null>(null);
  public searchTerm$ = new BehaviorSubject<string>('');
  
  // 🛡️ ЗМІНЕНО: тепер за замовчуванням сортуємо за нашим математичним Priority Score!
  public sortBy$ = new BehaviorSubject<'priority' | 'date' | 'title'>('priority');

  categories = CATEGORIES_LIST;
  
  // Основний потік даних
public filteredRequests$ = combineLatest([
    this.selectedCategory$.pipe(distinctUntilChanged()),
    this.searchTerm$.pipe(distinctUntilChanged()),
    this.sortBy$.pipe(distinctUntilChanged())
  ]).pipe(
    switchMap(([category, term, sort]) => 
      this.requestService.getAllRequests(category).pipe(
        map(requests => ({ requests, term, sort }))
      )
    ),
    map(({ requests, term, sort }) => {
      let list = [...requests];

      // Пошук
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

      // Сортування
      list.sort((a, b) => {
        if (sort === 'priority') {
          return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
        }
        if (sort === 'date') {
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        }
        return (a.title ?? '').localeCompare(b.title ?? '');
      });

      // 🛡️ ФІКС НЕСКІНЧЕННОГО ЦИКЛУ: Готуємо статичні дані для UI заздалегідь тут!
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
    }),
    tap(filtered => this.requestsFiltered.emit(filtered as any))
  );

  /**
   * 🛡️ Нові хелпери для гарного відображення в HTML-картці
   */
  getSubcategoryLabel(subcat: string): string {
    return REQUEST_SUBCATEGORIES_LABELS[subcat] || 'Волонтерський запит';
  }

  getCategoryColorHex(subcat: string): string {
    const mainCatId = SUBCATEGORY_TO_CATEGORY_MAP[subcat] || 'OTHER';
    return REQUEST_CATEGORIES[mainCatId]?.hex || '#64748b';
  }

  setCategory(id: string | null) {
    this.selectedCategory$.next(id);
  }

  onSearch(term: string) {
    this.searchTerm$.next(term);
  }

  onSort(type: 'priority' | 'date' | 'title') {
    this.sortBy$.next(type);
  }

  selectRequest(req: VolunteerRequest) {
    this.requestSelected.emit(req);
  }
}