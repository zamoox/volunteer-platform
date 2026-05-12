// src/app/features/requests/services/volunteer-requests-store.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { VolunteerRequest, VolunteerRequestService } from '@features/requests';

@Injectable({ providedIn: 'root' })
export class VolunteerRequestsStore {
  private api = inject(VolunteerRequestService);

  // Стан
  private _requests = signal<VolunteerRequest[]>([]);
  private _selectedRequestId = signal<string | null>(null);

  // Публічні дані
  public readonly requests = this._requests.asReadonly();
  
  public readonly selectedRequest = computed(() => 
    this._requests().find(r => r.id === this._selectedRequestId()) || null
  );

  // Методи
  loadAll() {
    this.api.getAllRequests().subscribe(data => this._requests.set(data));
  }

  /** Завантажити список і одразу виділити запит (наприклад, з query `requestId` у URL). */
  loadAllAndSelect(requestId: string | null): void {
    this.api.getAllRequests().subscribe((data) => {
      this._requests.set(data);
      if (requestId && data.some((r) => r.id === requestId)) {
        this._selectedRequestId.set(requestId);
      }
    });
  }

  select(id: string | null) {
    this._selectedRequestId.set(id);
  }

  addOrUpdate(request: VolunteerRequest) {
    this._requests.update(items => {
      const index = items.findIndex(i => i.id === request.id);
      if (index > -1) {
        const newItems = [...items];
        newItems[index] = request;
        return newItems;
      }
      return [...items, request];
    });
  }

  remove(id: string) {
    this._requests.update(items => items.filter(i => i.id !== id));
    if (this._selectedRequestId() === id) this._selectedRequestId.set(null);
  }
}