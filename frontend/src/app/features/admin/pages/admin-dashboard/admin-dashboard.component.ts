// src/app/features/admin/admin-dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { GET_ADMIN_STATS, GET_ADMIN_USERS } from '../../graphql/admin.queries';
import { BAN_USER } from '@features/admin/graphql/admin.mutations';
import { AdminService } from '@features/admin/services/admin.service';
import { CommonModule } from '@angular/common';
import { AdminStatsCardComponent } from '@features/admin/components/admin-stats-card/admin-stats-card.component';
import { AdminUsersTableComponent } from '@features/admin/components/admin-users-table/admin-users-table.component';
import { AdminOrgsTableComponent } from '@features/admin/components/admin-orgs-table/admin-orgs-table.component';
import { AdminRequestsTableComponent } from '@features/admin/components/admin-requests-table/admin-requests-table.component';
import { toSignal } from '@angular/core/rxjs-interop';

export type AdminTab = 'users' | 'organizations' | 'requests';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    AdminStatsCardComponent, 
    AdminUsersTableComponent,
    AdminOrgsTableComponent,
    AdminRequestsTableComponent
  ],
  templateUrl: './admin-dashboard.component.html', // Переконайся, що цей шлях вірний
  styleUrl: './admin-dashboard.component.css'    // І цей також
})
export class AdminDashboardComponent  {

  private adminService = inject(AdminService);

  stats = toSignal(this.adminService.getDashboardStats());
  users = toSignal(this.adminService.getAllUsers(), { initialValue: [] });
  organizations = toSignal(this.adminService.getAllOrganizations(), { initialValue: [] });
  requests = toSignal(this.adminService.getAllRequests(), { initialValue: [] });

  activeTab: AdminTab = 'users';

  // Метод для перемикання
  setActiveTab(tab: AdminTab) {
    this.activeTab = tab;
  }

  handleBan(event: { id: string; email: string }) {
    const reason = prompt(`Причина бану для ${event.email}:`);
    if (reason) {
      this.adminService.banUser(event.id, reason).subscribe();
    }
  }

  handleVerifyOrg(id: string) {
    if (confirm('Підтвердити верифікацію цієї організації?')) {
      this.adminService.verifyOrganization(id).subscribe();
    }
  }

  handleDeleteRequest(id: string) {
    const reason = prompt('Вкажіть причину видалення запиту:');
    if (reason) {
      this.adminService.deleteRequest(id, reason).subscribe();
    }
  }
}