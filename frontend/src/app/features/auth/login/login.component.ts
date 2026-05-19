import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { LoadingService } from '@core/services/loading.service';
import { SpinnerComponent } from '@shared/components';
import { filter, take } from 'rxjs';
import { ToastService } from '@core/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  public loadingService = inject(LoadingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  showPassword = false;
  loginError = false;
  is2FAStep = false;
  userIdFor2FA = '';
  twoFaCode = '';

  isForgotPasswordStep = false;
  isResetEmailSent = false;
  forgotPasswordEmail = new FormControl('', [Validators.required, Validators.email]);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  isLoading = false;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      this.processGoogleLogin(token);
    }
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = false;
      
      const { email, password } = this.loginForm.value;

      if (!email || !password) {
        this.isLoading = false;
        return;
      }
      
      this.authService.login(email, password).subscribe({
            next: (data) => {
              this.isLoading = false;
              // Якщо бекенд просить 2FA
              if (data.require2FA) {
                this.is2FAStep = true; // Перемикаємо UI на форму введення коду
                this.userIdFor2FA = data.userId; // Зберігаємо ID для наступного запиту
              } 
              // Якщо звичайний логін (2FA вимкнено)
              else if (data.access_token && data?.user) {
                if (data?.access_token && data?.user) {
                  this.navigateToDashboard(data.user.role);
                }
              }
            },
            error: (err) => {
              this.isLoading = false;
              
              // 🛡️ ГІС-ФІКС ДЛЯ GRAPHQL GRAPHQL_ERROR_PARSING
              // Перевіряємо внутрішній код помилки Apollo (UNAUTHENTICATED) або HTTP статус
              const isUnauthenticated = 
                err.status === 401 || 
                err.message?.includes('Unauthorized') ||
                (err.graphQLErrors as any[])?.some(gErr => gErr.extensions?.['code'] === 'UNAUTHENTICATED') ||
                err.message?.includes('Невірний email або пароль');

              if (isUnauthenticated) {
                this.loginError = true; // Активуємо локальну shake-анімацію на формі
              } else {
                // Якщо сервер дійсно ліг (Network Error / 500)
                this.toastService.show(
                  'Помилка підключення', 
                  'Сервер координації не відповідає або відсутній зв’язок із базою даних.', 
                  'error'
                );
              }
              console.error('Помилка логіну:', err);
            }
          });
    }
  }

  private processGoogleLogin(token: string) {
    // 1. Запускаємо процес гідрації профілю
    this.authService.handleAuthentication(token, null);
    
    // 2. "Підстерігаємо" момент, коли сервіс отримає дані профілю
    this.authService.currentUser$.pipe(
      // Чекаємо, поки в Subject прийде об'єкт юзера (не null)
      filter(user => !!user), 
      // Беремо лише перше значення і автоматично відписуємось
      take(1) 
    ).subscribe({
      next: (user) => {
        // 3. Тепер ми точно знаємо роль і редиректимо
        this.navigateToDashboard(user.role);
      },
      error: () => {
        this.toastService.show('Помилка авторизації Google', 'Не вдалося імпортувати профіль.', 'error');
        this.router.navigate(['/login']);
      }
    });
  }

  loginWithGoogle() {
    this.loadingService.show();
    
    setTimeout(() => {
      window.location.href = 'http://localhost:3000/auth/google';
    }, 0);
  }

  verify2FA() {
    if (this.twoFaCode.length !== 6) return;
    
    this.loginError = false;

    // Просто робимо підписку, сервіс сам знає, коли показати/приховати спіннер
    this.authService.loginWith2FA(this.userIdFor2FA, this.twoFaCode).subscribe({
      next: (data) => {
        if (data?.access_token && data?.user) {
        this.navigateToDashboard(data.user.role);
      }
      },
      error: (err) => {
        this.loginError = true;
        this.twoFaCode = '';
        this.toastService.show('Помилка перевірки', 'Введено некоректний або застарілий код 2FA.', 'warning');
      }
    });
  }

  private navigateToDashboard(role: string) {
    if (role === 'admin') {
    this.router.navigate(['/admin'], { replaceUrl: true });
    } else {
      this.router.navigate(['/profile'], { replaceUrl: true });
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  } 

  toggleForgotPassword() {
    this.isForgotPasswordStep = !this.isForgotPasswordStep;
    this.is2FAStep = false;
    this.loginError = false;
    this.isResetEmailSent = false;
    this.forgotPasswordEmail.reset();
  }

  sendPasswordResetLink() {
    if (this.forgotPasswordEmail.invalid) {
      this.forgotPasswordEmail.markAsTouched();
      return;
    }

    this.isLoading = true;
    const email = this.forgotPasswordEmail.value!;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.isResetEmailSent = true;
        this.toastService.show('Готово', 'Інструкції з відновлення надіслано на вашу пошту.', 'success');
      },
      error: (err) => {
        this.isLoading = false;
        // З міркувань безпеки ми не кажемо, чи існує такий email, просто показуємо успіх або загальну помилку
        this.toastService.show('Готово', 'Якщо email існує в базі, ви отримаєте лист.', 'info');
        this.isResetEmailSent = true; 
      }
    });
  }


}