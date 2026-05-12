import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { LoadingService } from '@core/services/loading.service';
import { SpinnerComponent } from '@shared/components';

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

  showPassword = false;
  loginError = false;
  is2FAStep = false;
  userIdFor2FA = '';
  twoFaCode = '';

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
            next: (response) => {
              // Якщо бекенд просить 2FA
              if (response.require2FA) {
                this.is2FAStep = true; // Перемикаємо UI на форму введення коду
                this.userIdFor2FA = response.userId; // Зберігаємо ID для наступного запиту
              } 
              // Якщо звичайний логін (2FA вимкнено)
              else if (response.access_token) {
                this.router.navigate(['/profile']); // Або куди ти там редиректиш
              }
            },
            error: (err) => {
              console.error('Помилка логіну:', err);
            }
          });
    }
  }

  private processGoogleLogin(token: string) {
    // 1. Зберігаємо токен
    this.authService.handleAuthentication(token, null);
    
    // 2. Очищуємо URL від токена (з міркувань безпеки) і редиректимо
    this.router.navigate(['/profile'], { replaceUrl: true });
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
      next: (res) => {
        if (res?.access_token) this.router.navigate(['/profile']);
      },
      error: () => {
        this.loginError = true;
        this.twoFaCode = '';
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  } 


}