import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-admin-requests-table',
  imports: [CommonModule],
  templateUrl: './admin-requests-table.component.html',
  styleUrl: './admin-requests-table.component.css',
})
export class AdminRequestsTableComponent {
  @Input() requests: any[] | null = [];
  @Output() delete = new EventEmitter<string>(); // Емітимо подію вгору
  
  expandedElementId: string | null = null;
  toggleRow(id: string) {
    this.expandedElementId = this.expandedElementId === id ? null : id;
  }
}




