import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminUser } from '@features/admin/models/admin-user.model';

@Component({
  selector: 'app-admin-users-table',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './admin-users-table.component.html',
  styleUrl: './admin-users-table.component.css',
})
export class AdminUsersTableComponent {
  @Input() users: AdminUser[] | null = [];
  @Output() ban = new EventEmitter<{ id: string; email: string }>();
  
  expandedElementId: string | null = null;

  toggleRow(id: string) {
    this.expandedElementId = this.expandedElementId === id ? null : id;
  }

  getRoleClass(role: string): string {
    const roles: any = {
      admin: 'bg-red-100 text-red-600 border-red-200',
      organization: 'bg-amber-100 text-amber-600 border-amber-200',
      volunteer: 'bg-blue-100 text-blue-600 border-blue-200'
    };
    return roles[role] || 'bg-slate-100 text-slate-600';
  }
}
