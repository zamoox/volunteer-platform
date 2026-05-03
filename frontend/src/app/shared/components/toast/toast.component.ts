import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent {
  private service = inject(ToastService);
  toasts$ = this.service.toastState$;

  remove(id: number) { this.service.remove(id); }

  getStyles(type: string) {
    const base = 'border-white/20 ';
    const types: any = {
      success: base + 'bg-emerald-500/90 text-white shadow-emerald-500/20',
      error: base + 'bg-rose-500/90 text-white shadow-rose-500/20',
      info: base + 'bg-blue-600/90 text-white shadow-blue-500/20',
      warning: base + 'bg-amber-500/90 text-white shadow-amber-500/20'
    };
    return types[type] || types.info;
  }

  getIcon(type: string) {
    const icons: any = { success: '✨', error: '🚨', info: 'ℹ️', warning: '⚠️' };
    return icons[type] || '🔔';
  }
}
