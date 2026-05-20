import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-admin-orgs-table',
  imports: [CommonModule],
  templateUrl: './admin-orgs-table.component.html',
  styleUrl: './admin-orgs-table.component.css',
})
export class AdminOrgsTableComponent {
  @Input() organizations: any[] | null = [];
  @Output() verify = new EventEmitter<string>(); // Емітимо подію вгору
  
  expandedElementId: string | null = null;
  toggleRow(id: string) {
    this.expandedElementId = this.expandedElementId === id ? null : id;
  }

  getFileName(path: string): string {
    // Навіть якщо в базі лежить повний шлях (наприклад: /Users/zamoox/.../uploads/reg_123.png)
    // цей метод візьме тільки останню частину (reg_123.png)
    return path.split(/[\\/]/).pop() || '';
  }

}
