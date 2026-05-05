import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  registerForm = new FormGroup({
    userType: new FormControl('individual', [Validators.required]),
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    region: new FormControl('', [Validators.required]),
    city: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  isLoading = false;

  regions = [
    'Київська', 'Львівська', 'Харківська', 'Одеська', 'Дніпропетровська', 
    'Вінницька', 'Волинська', 'Житомирська', 'Закарпатська', 'Запорізька',
    'Івано-Франківська', 'Кіровоградська', 'Луганська', 'Миколаївська',
    'Полтавська', 'Рівненська', 'Сумська', 'Тернопільська', 'Херсонська',
    'Хмельницька', 'Черкаська', 'Чернівецька', 'Чернігівська'
  ];

  get currentUserType() {
    return this.registerForm.get('userType')?.value;
  }

  isInvalid(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Новий метод для генерації тексту помилки
  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return "Обов'язкове поле";
    if (control.errors['minlength']) return `Мінімум ${control.errors['minlength'].requiredLength} символів`;
    if (control.errors['email']) return "Введіть коректний email";
    
    return "Помилка валідації";
  }

onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          // 👈 Додано тост про успіх
          this.toastService.success(
            'Успіх!', 
            'Реєстрація пройшла успішно. Ласкаво просимо!'
          );
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.isLoading = false;
          // 👈 Додано обробку помилок через ToastService
          if (err.message?.includes('вже існує')) {
             this.toastService.error(
               'Помилка реєстрації', 
               'Користувач з таким Email вже існує. Спробуйте увійти.'
             );
          } else {
             this.toastService.error(
               'Щось пішло не так', 
               'Перевірте введені дані та спробуйте ще раз.'
             );
          }
          console.error(err);
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
      // Опціонально: можна додати тост і для невалідної форми
      this.toastService.warning(
        'Увага', 
        'Будь ласка, заповніть всі обов\'язкові поля коректно.'
      );
    }
  }
}