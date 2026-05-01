import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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

  // Геттер для зручного доступу до типу користувача
  get currentUserType() {
    return this.registerForm.get('userType')?.value;
  }

  // Перевірка валідності поля
  isInvalid(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.authService.register(this.registerForm.value).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => {
          this.isLoading = false;
          alert('Помилка реєстрації. Спробуйте інший Email.');
          console.error(err);
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}