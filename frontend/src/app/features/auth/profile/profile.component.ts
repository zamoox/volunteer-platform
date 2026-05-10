import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Observable, take } from 'rxjs';

import { AuthService } from '@core/services';
import { User } from '@core/models/user.model';
import { VolunteerRequestService, VolunteerRequest } from '@features/requests';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  private user: User | null = null;

  public requestService = inject(VolunteerRequestService);
  requests$!: Observable<VolunteerRequest[]>;
  
  qrCodeUrl: string | null = null;
  twoFaCode: string = '';
  isStepVerify: boolean = false;
  cooldownSeconds = 0; 
  private timerInterval: any;
  private readonly COOLDOWN_KEY = 'email_resend_cooldown_end';

  isChangingPasswordMode = false;
  isSubmittingPassword = false;
  passwordForm!: FormGroup;
  passwordError: string | null = null;
  passwordSuccess: boolean = false;


  activeTab: 'info' | 'settings' | 'reviews' | 'requests' = 'info';
  isSendingEmail: boolean = false;
  emailSent: boolean = false;

  ngOnInit() {
    this.authService.currentUser$.subscribe(userData => {
      this.user = userData;

      if (userData?.role === 'organization') {
        this.requests$ = this.requestService.getRequests();
      }

      this.cdr.detectChanges(); // Оновлюємо UI, коли прийшли дані
    });

    this.checkExistingCooldown();
    this.initPasswordForm();
  }

  initPasswordForm() {
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Кастомний валідатор: перевіряє, чи збігаються паролі
  passwordMatchValidator(control: AbstractControl) {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordForm() {
    this.isChangingPasswordMode = !this.isChangingPasswordMode;
    if (!this.isChangingPasswordMode) {
      // Очищаємо форму при закритті
      this.passwordForm.reset();
      this.passwordError = null;
      this.passwordSuccess = false;
    }
  }

  onSubmitPasswordChange() {
    if (this.passwordForm.invalid) return;

    if (!this.user || !this.user.id) {
      this.passwordError = 'Помилка авторизації: дані користувача не знайдено.';
      return;
    }

    this.isSubmittingPassword = true;
    this.passwordError = null;
    this.passwordSuccess = false;

    const { oldPassword, newPassword } = this.passwordForm.value;

    const userId = this.user.id;

    this.authService.changePassword(userId, oldPassword, newPassword).pipe(
      take(1),
      finalize(() => {
        this.isSubmittingPassword = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (success) => {
        if (success) {
          this.passwordSuccess = true;
          this.passwordForm.reset();
          // Закриваємо форму через 3 секунди після успіху
          setTimeout(() => {
            this.togglePasswordForm();
            this.cdr.detectChanges();
          }, 3000);
        }
      },
      error: (err) => {
        // GraphQL повертає повідомлення про помилку в err.message
        this.passwordError = err.message || 'Не вдалося змінити пароль. Перевірте дані.';
      }
    });
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

  private startTimerInterval() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.timerInterval = setInterval(() => {
      if (this.cooldownSeconds > 0) {
        this.cooldownSeconds--;
        this.cdr.detectChanges();
      } else {
        clearInterval(this.timerInterval);
        localStorage.removeItem(this.COOLDOWN_KEY);
        this.cdr.detectChanges();
      }
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
    this.activeTab = tab as 'info' | 'settings' | 'reviews' | 'requests';
  }

  onEnable2FA(userId: string) {
    // Очищаємо попередні дані, якщо вони були
    this.twoFaCode = '';
    
    this.authService.generate2FA(userId).pipe(
      take(1)
    ).subscribe({
      next: (qrCode) => {
        this.qrCodeUrl = qrCode;
        this.isStepVerify = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Помилка генерації QR:', err);
        // Можна додати toast повідомлення тут
      }
    });
  }

  confirm2FA(userId: string) {
    // Валідація на довжину коду (тільки цифри)
    if (this.twoFaCode.length !== 6 || !/^\d+$/.test(this.twoFaCode)) {
      alert('Будь ласка, введіть коректний 6-значний код');
      return;
    }

    this.authService.turnOn2FA(userId, this.twoFaCode).pipe(
      take(1),
      finalize(() => {
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (success) => {
        if (success) {
          // Оновлення успішне. AuthService.turnOn2FA вже оновив currentUser$
          this.qrCodeUrl = null;
          this.isStepVerify = false;
          this.twoFaCode = '';
          // Тут можна замінити alert на красивий Toast
          alert('2FA успішно активовано!');
        }
      },
      error: (err) => {
        // Якщо код невірний, бекенд викине помилку
        alert(err.message || 'Невірний код. Спробуйте ще раз.');
        this.twoFaCode = ''; // Очищаємо поле для повторної спроби
      }
    });
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