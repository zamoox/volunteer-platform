import { Routes } from '@angular/router';
import { MapComponent } from './features/map/map.component';

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
  // Редірект для будь-яких невідомих шляхів на головну сторінку
  {
    path: '**',
    redirectTo: ''
  }
];
