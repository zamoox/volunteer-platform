import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  public loadingService = inject(LoadingService);
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