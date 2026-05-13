import { Routes } from '@angular/router';
import { MapComponent } from './features/map/map.component';
import { authGuard } from './core/guards/auth-guard';
import { HomeComponent } from './features/home/home.component';
import { VerifyComponent } from './features/auth/verify/verify.component';
import { VolunteerProfileComponent } from './features/auth/profile/components/volunteer-profile/volunteer-profile.component';
import { OrganizationDashboardComponent } from './features/auth/profile/components/organization-dashboard/organization-dashboard.component';
import { AdminPanelComponent } from './features/auth/profile/components/admin-panel/admin-panel.component';
import { roleGuard } from './core/guards/role.guard';


export const routes: Routes = [
  
  {
    path: '',
    component: HomeComponent,
    title: 'Головна | Volunteer.ua'
  },
  {
    path: 'map',
    component: MapComponent,
    title: 'Карта допомоги | Volunteer.ua',
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Вхід | Volunteer.ua'
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Реєстрація | Volunteer.ua'
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/auth/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    title: 'Мій профіль | Volunteer.ua',
    children: [
      { path: 'volunteer', component: VolunteerProfileComponent },
      { path: 'organization', component: OrganizationDashboardComponent },
    ]
  },
  { path: 'fadmin', component: AdminPanelComponent },
  {
    path: 'admin',
    // Ліниве завантаження модуля адмінки
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'organization/setup',
    loadComponent: () => import('./features/organizations/components/organization-setup/organization-setup.component')
      .then(m => m.OrganizationSetupComponent),
    canActivate: [authGuard, roleGuard(['organization'])],
    title: 'Налаштування організації | Volunteer.ua'
  },
  { path: 'verify', 
    component: VerifyComponent
  },
  // Редірект для будь-яких невідомих шляхів на головну сторінку
  {
    path: '**',
    redirectTo: ''
  }
];
