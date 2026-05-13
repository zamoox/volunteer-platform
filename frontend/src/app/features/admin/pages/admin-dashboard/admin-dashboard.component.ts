// src/app/features/admin/admin-dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { GET_ADMIN_STATS, GET_ADMIN_USERS } from '../../graphql/admin.queries';
import { BAN_USER } from '@features/admin/graphql/admin.mutations';
import { AdminService } from '@features/admin/services/admin.service';
import { CommonModule } from '@angular/common';
import { AdminStatsCardComponent } from '@features/admin/components/admin-stats-card/admin-stats-card.component';
import { AdminUsersTableComponent } from '@features/admin/components/admin-users-table/admin-users-table.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    AdminStatsCardComponent, 
    AdminUsersTableComponent
  ],
  templateUrl: './admin-dashboard.component.html', // Переконайся, що цей шлях вірний
  styleUrl: './admin-dashboard.component.css'    // І цей також
})
export class AdminDashboardComponent  {

  private adminService = inject(AdminService);

  stats$ = this.adminService.getDashboardStats();
  users$ = this.adminService.getAllUsers();

  handleBan(event: { id: string; email: string }) {
    const reason = prompt(`Причина бану для ${event.email}:`);
    if (reason) {
      this.adminService.banUser(event.id, reason).subscribe();
    }
  }
}