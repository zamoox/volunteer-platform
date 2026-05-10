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
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastService.warning('Увага', "Заповніть всі обов'язкові поля");
      return;
    }

    this.isLoading = true;

    this.authService.register(this.registerForm.value).subscribe({
      next: (data) => {

        console.log('=== REGISTER NEXT ===', data);
        console.log('role:', data?.user?.role);
        this.toastService.success('Успіх!', 'Реєстрація пройшла успішно!');
        
        const role = (data?.user?.role ?? '');
        
        const routes: Record<string, string> = {
          volunteer:    '/map',
          organization: '/organization/setup',
          admin:        '/admin',
        };

        console.log(routes[role]);

        this.router.navigate([routes[role] ?? '/']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.graphQLErrors?.[0]?.message ?? err.message ?? '';
        if (msg.includes('вже існує') || msg.includes('already exists')) {
          this.toastService.error('Помилка', 'Користувач з таким Email вже існує');
        } else {
          this.toastService.error('Помилка', 'Перевірте дані та спробуйте ще раз');
        }
      }
    });
  } 
}