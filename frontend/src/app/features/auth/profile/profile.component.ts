import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  public authService = inject(AuthService);
  qrCodeUrl: string | null = null;
  twoFaCode: string = '';
  isStepVerify: boolean = false;

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

  onEnable2FA(userId: string) {
    this.authService.generate2FA(userId).subscribe(qrCode => {
      this.qrCodeUrl = qrCode; // Це отриманий Base64 рядок
      this.isStepVerify = true;
    });
  }

  confirm2FA(userId: string) {
    if (this.twoFaCode.length === 6) {
      this.authService.turnOn2FA(userId, this.twoFaCode).subscribe(success => {
        if (success) {
          alert('2FA успішно активовано!');
          this.qrCodeUrl = null;
          this.isStepVerify = false;
        }
      });
    }
  }

  onLogout() {
    this.authService.logout();
  }
}