import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-request-details',
  imports: [CommonModule],
  templateUrl: './request-details.component.html',
  styleUrl: './request-details.component.css',
})
export class RequestDetailsComponent {
  // Дані запиту, які ми отримуємо при кліку на маркер
  @Input() request: any;
  
  // Позиція: 'left' або 'right'
  @Input() position: 'left' | 'right' = 'right';

  // Подія для закриття панелі
  @Output() closed = new EventEmitter<void>();

  // Подія для кнопки "Відгукнутися"
  @Output() responded = new EventEmitter<string>();

  onClose() {
    this.closed.emit();
  }

  onRespond() {
    // Передаємо ID запиту, щоб бекенд знав, на що ми відгукнулися
    if (this.request?.id) {
      this.responded.emit(this.request.id);
      
      // Для диплома можна додати лог або змінити статус локально
      console.log(`Волонтер відгукнувся на запит: ${this.request.id}`);
      alert('Дякуємо! Ви відгукнулися на цей запит. Координатор зв’яжеться з вами.');
    }
  }
}
