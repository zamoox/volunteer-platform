import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '', 
    loadComponent: () => 
      import('./pages/admin-dashboard/admin-dashboard.component')
        .then(m => m.AdminDashboardComponent)
  }
  // Тут в майбутньому можуть бути:
  // { path: 'settings', loadComponent: ... }
  // { path: 'user/:id', loadComponent: ... }
];