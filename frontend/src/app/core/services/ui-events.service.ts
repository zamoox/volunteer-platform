import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UiEventsService {
  private openCreateRequestSource = new Subject<void>();

  // Потік події (публічний, для підписки)
  openCreateRequest$ = this.openCreateRequestSource.asObservable();

  // Метод для виклику події
  emitOpenCreateRequest() {
    this.openCreateRequestSource.next();
  }
}
