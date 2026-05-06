import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify',
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div class="p-8 bg-white rounded-3xl shadow-xl text-center">
        <h2 class="text-2xl font-bold mb-4">Підтвердження пошти...</h2>
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  `
})
export class VerifyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    // 1. Отримуємо токен з URL (?token=...)
    const token = this.route.snapshot.queryParamMap.get('token');

    console.log(token);

    if (token) {
      // 2. Викликаємо метод верифікації з сервісу
      this.authService.verifyEmail(token).subscribe({
        next: (success) => {
          if (success) {
            alert('Пошту успішно підтверджено!');
            this.router.navigate(['/profile']); // Повертаємо в профіль, де статус уже буде зеленим
          } else {
            alert('Помилка верифікації. Можливо, токен застарів.');
          }
        },
        error: () => alert('Щось пішло не так...')
      });
    }
  }
}