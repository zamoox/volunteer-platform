// src/app/core/services/toast.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  title: string;
  message: string;
  type: ToastType;
  id: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  toastState$ = this.toasts$.asObservable();

  // Оригінальний метод (залишаємо як є)
  show(title: string, message: string, type: ToastType = 'success') {
    const id = Date.now();
    const newToast: Toast = { id, title, message, type };
    
    this.toasts$.next([...this.toasts$.value, newToast]);

    setTimeout(() => this.remove(id), 4000);
  }

  // Оригінальний метод (залишаємо як є)
  remove(id: number) {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }

  // --- 🌟 НОВІ ЗРУЧНІ МЕТОДИ-ОБГОРТКИ ---

  success(title: string, message: string) {
    this.show(title, message, 'success');
  }

  error(title: string, message: string) {
    this.show(title, message, 'error');
  }

  info(title: string, message: string) {
    this.show(title, message, 'info');
  }

  warning(title: string, message: string) {
    this.show(title, message, 'warning');
  }
}