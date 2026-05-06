import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = 0;
  
  // BehaviorSubject зберігає останнє значення і одразу віддає його новим підписникам
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  
  // Експортуємо як Observable, щоб компоненти могли тільки читати, а не змінювати
  public isLoading$ = this.isLoadingSubject.asObservable();

  show() {
    if (this.activeRequests === 0) {
      this.isLoadingSubject.next(true);
    }
    this.activeRequests++;
  }

  hide() {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0; // Захист від від'ємних значень
      this.isLoadingSubject.next(false);
    }
  }
}