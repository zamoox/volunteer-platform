import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-request-popup',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './request-popup.component.html',
  styleUrl: './request-popup.component.css',
  encapsulation: ViewEncapsulation.None
})
export class RequestPopupComponent {
  @Input({ required: true }) request: any;
  @Input() category: any;
  
  // Додаємо емітер для деталей
  @Output() showDetails = new EventEmitter<any>();

  get accentColor(): string {
    return this.category?.color || '#3b82f6';
  }

  onDetailsClick(event: MouseEvent) {
    event.stopPropagation(); // Щоб Leaflet не перехопив клік
    this.showDetails.emit(this.request);
  }
}