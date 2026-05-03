import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  activeTab: 'info' | 'settings' | 'reviews' | 'requests' = 'info';

  // Допоміжний метод для гарного відображення ролі
  getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      volunteer: 'Волонтер',
      organization: 'Організація',
      admin: 'Адміністратор'
    };
    return roles[role] || 'Користувач';
  }

  setTab(tab: 'info' | 'settings' | 'reviews' | 'requests') {
    this.activeTab = tab;
  }

  onLogout() {
    this.authService.logout();
    // Навігація вже є всередині authService.logout(), 
    // але дублювання тут не завадить для наочності
  }
}