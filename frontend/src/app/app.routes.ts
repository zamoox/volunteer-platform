import { Routes } from '@angular/router';
import { MapComponent } from './features/map/map.component';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: MapComponent,
    title: 'Карта допомоги | Volunteer.ua'
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
    // canActivate: [authGuard],
    title: 'Мій профіль | Volunteer.ua'
  },
  // Редірект для будь-яких невідомих шляхів на головну сторінку
  {
    path: '**',
    redirectTo: ''
  }
];
