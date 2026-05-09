import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-request-popup',
  imports: [CommonModule, DatePipe],
  templateUrl: './request-popup.component.html',
  styleUrl: './request-popup.component.css',
  encapsulation: ViewEncapsulation.None
})
export class RequestPopupComponent {
  @Input({ required: true }) request: any;
  @Input() category: any;

  get accentColor(): string {
    return this.category?.color || '#3b82f6';
  }
}
