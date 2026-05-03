import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-request-details',
  standalone: true, // Переконайся, що це тут є
  imports: [CommonModule],
  templateUrl: './request-details.component.html',
  styleUrl: './request-details.component.css',
})
export class RequestDetailsComponent {
  @Input() request: any;
  @Input() position: 'left' | 'right' = 'left'; // Змінив за замовчуванням на left, щоб кнопки мапи справа не заважали

  @Output() closed = new EventEmitter<void>();
  @Output() responded = new EventEmitter<string>();

  getCategoryData(id: string) {
    const categories: any = {
      FOOD: { label: 'Продукти', emoji: '🍎', color: 'bg-red-500' },
      MEDICINE: { label: 'Ліки', emoji: '💊', color: 'bg-emerald-500' },
      TRANSPORT: { label: 'Транспорт', emoji: '🚗', color: 'bg-blue-500' },
      SHELTER: { label: 'Житло', emoji: '🏠', color: 'bg-amber-500' },
      OTHER: { label: 'Інше', emoji: '📦', color: 'bg-slate-500' }
    };
    return categories[id] || { label: 'Запит', emoji: '📍', color: 'bg-slate-500' };
  }

  onClose() {
    this.closed.emit();
  }

  onRespond() {
    if (this.request?.id) {
      this.responded.emit(this.request.id);
      alert('Дякуємо! Координатор отримав ваш відгук.');
    }
  }
}