import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CreateRequestData } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class UiEventsService {
  private openCreateRequestSource = new Subject<CreateRequestData | undefined>();

  // Потік події (публічний, для підписки)
  openCreateRequest$ = this.openCreateRequestSource.asObservable();

  // Метод для виклику події
  emitOpenCreateRequest(data?: CreateRequestData) {
    this.openCreateRequestSource.next(data);
  }
}
