import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  // Додаємо Input для заголовка, щоб помилка {{ title }} зникла
  @Input() title: string = '';

  // Додаємо Output для події закриття
  @Output() closed = new EventEmitter<void>();

  // Додаємо метод close(), щоб помилка (click)="close()" зникла
  close() {
    this.closed.emit();
  }
}
