import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalService } from '@core/services/modal.service';

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

  constructor(private modalService: ModalService) {}

  close() {
    this.modalService.close(); // Сервіс тепер сам знищить компонент
  }
}
