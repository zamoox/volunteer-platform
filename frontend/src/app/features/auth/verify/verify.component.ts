import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html'
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