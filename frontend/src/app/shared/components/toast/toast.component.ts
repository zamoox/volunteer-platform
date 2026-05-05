import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast, ToastType } from '../../../core/services/toast.service'; // Імпортуємо типи з сервісу

@Component({
  selector: 'app-toast',
  standalone: true, // Рекомендую явно вказувати для сучасного Angular
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent {
  private service = inject(ToastService);
  toasts$ = this.service.toastState$;

  remove(id: number) { 
    this.service.remove(id); 
  }

  // Оптимізація для *ngFor
  trackById(index: number, toast: Toast): number {
    return toast.id;
  }

  // Використовуємо Record замість any для суворої типізації
  getStyles(type: ToastType): string {
    const base = 'border-white/20 ';
    const types: Record<ToastType, string> = {
      success: base + 'bg-emerald-500/90 text-white shadow-emerald-500/20',
      error: base + 'bg-rose-500/90 text-white shadow-rose-500/20',
      info: base + 'bg-blue-600/90 text-white shadow-blue-500/20',
      warning: base + 'bg-amber-500/90 text-white shadow-amber-500/20'
    };
    // Якщо тип невідомий (хоча з типізацією це малоймовірно), fallback на info
    return types[type] || types.info;
  }

  getIcon(type: ToastType): string {
    const icons: Record<ToastType, string> = { 
      success: '✨', 
      error: '🚨', 
      info: 'ℹ️', 
      warning: '⚠️' 
    };
    return icons[type] || '🔔';
  }
}