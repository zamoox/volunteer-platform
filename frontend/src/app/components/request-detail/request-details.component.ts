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