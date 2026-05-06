import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, take } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  qrCodeUrl: string | null = null;
  twoFaCode: string = '';
  isStepVerify: boolean = false;
  cooldownSeconds = 0; // 👈 Додали лічильник
  private timerInterval: any;

  private readonly COOLDOWN_KEY = 'email_resend_cooldown_end';

  activeTab: 'info' | 'settings' | 'reviews' | 'requests' = 'info';
  isSendingEmail: boolean = false;
  emailSent: boolean = false;

  ngOnInit() {
    this.checkExistingCooldown();
  }

  private checkExistingCooldown() {
    const savedCooldownEnd = localStorage.getItem(this.COOLDOWN_KEY);
    
    if (savedCooldownEnd) {
      const endTime = parseInt(savedCooldownEnd, 10);
      const now = Date.now();

      if (endTime > now) {
        // Якщо час ще не вийшов, вираховуємо залишок у секундах
        this.cooldownSeconds = Math.ceil((endTime - now) / 1000);
        this.emailSent = true;
        this.startTimerInterval();
      } else {
        // Якщо час вже вийшов, поки нас не було — прибираємо сміття
        localStorage.removeItem(this.COOLDOWN_KEY);
      }
    }
  }

  // Винесена логіка таймера, щоб не дублювати код
  private startTimerInterval() {
    // Очищаємо попередній інтервал, якщо він раптом був
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.cooldownSeconds--;
      
      if (this.cooldownSeconds <= 0) {
        clearInterval(this.timerInterval);
        this.emailSent = false;
        this.cooldownSeconds = 0;
        localStorage.removeItem(this.COOLDOWN_KEY); // Очищаємо localStorage, коли час вийшов
      }
      
      this.cdr.detectChanges();
    }, 1000);
  }

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

  onResendEmail(userId: string) {
      if (this.isSendingEmail || this.cooldownSeconds > 0) return;

      this.isSendingEmail = true;
      this.cdr.detectChanges();

      this.authService.resendVerificationEmail(userId).pipe(
        take(1),
        finalize(() => {
          this.isSendingEmail = false;
          this.cdr.detectChanges();
        })
      ).subscribe({
        next: (success) => {
          if (success) {
            this.emailSent = true;
            this.cooldownSeconds = 60;
            
            // Рахуємо, коли таймер має закінчитися (зараз + 60 секунд)
            const endTime = Date.now() + 60000;
            localStorage.setItem(this.COOLDOWN_KEY, endTime.toString());

            this.startTimerInterval(); // Запускаємо відлік
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.emailSent = false;
          this.cooldownSeconds = 0;
          localStorage.removeItem(this.COOLDOWN_KEY);
          this.cdr.detectChanges();
        }
      });
    }

  // Дуже важливо для Angular: очищати таймери, якщо користувач перейшов на іншу сторінку
  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  onLogout() {
    this.authService.logout();
  }
}