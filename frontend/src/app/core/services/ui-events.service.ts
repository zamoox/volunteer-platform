import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { CreateRequestData } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class UiEventsService {
  private openCreateRequestSource = new Subject<CreateRequestData | undefined>();

  // Потік події (публічний, для підписки)
  openCreateRequest$ = this.openCreateRequestSource.asObservable();

  private isMapModeSource = new BehaviorSubject<boolean>(false);
  isMapMode$ = this.isMapModeSource.asObservable();

  // Метод для виклику події
  emitOpenCreateRequest(data?: CreateRequestData) {
    this.openCreateRequestSource.next(data);
  }

  toggleMapMode(visible: boolean) {
    this.isMapModeSource.next(visible);
  }
}
