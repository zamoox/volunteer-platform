// src/app/features/organization/setup/organization-setup.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrganizationService } from '../../../../core/services/organization.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-organization-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './organization-setup.component.html',
})
export class OrganizationSetupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private orgService = inject(OrganizationService);
  private router = inject(Router);
  private toast = inject(ToastService);

  isLoading = false;

  readonly steps = [
    { icon: '✉️', label: 'Реєстрація акаунта',       done: true },
    { icon: '🏢', label: 'Дані організації',           done: false },
    { icon: '✅', label: 'Верифікація адміністратором', done: false },
  ];

  form = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(3)]],
    edrpou:      ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8), Validators.pattern(/^\d+$/)]],
    description: [''],
    website:     [''],
    phone:       ['',[Validators.required, Validators.pattern(/^\+380 \d{2} \d{3} \d{2} \d{2}$/)]]
  });

  ngOnInit(): void {
    this.form.statusChanges.subscribe(res => console.log(res));
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  getError(field: string): string {
    const errors = this.form.get(field)?.errors;

    if (!errors) return '';

    if (errors['required']) {
      return "Обов'язкове поле";
    }

    if (errors['minlength']) {
      return `Мінімум ${errors['minlength'].requiredLength} символів`;
    }

    if (errors['maxlength']) {
      return `Максимум ${errors['maxlength'].requiredLength} символів`;
    }

    if (errors['pattern']) {
      if (field === 'phone') {
        return 'Некоректний номер телефону';
      }

      if (field === 'edrpou') {
        return 'ЄДРПОУ повинен містити тільки цифри';
      }
    }

    return 'Помилка';
  }

  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Тільки цифри
    let digits = input.value.replace(/\D/g, '');

    // Прибираємо 380 якщо юзер вставив
    if (digits.startsWith('380')) {
      digits = digits.substring(3);
    }

    // Максимум 9 цифр після +380
    digits = digits.substring(0, 9);

    let formatted = '+380';

    if (digits.length > 0) {
      formatted += ' ' + digits.substring(0, 2);
    }

    if (digits.length >= 3) {
      formatted += ' ' + digits.substring(2, 5);
    }

    if (digits.length >= 6) {
      formatted += ' ' + digits.substring(5, 7);
    }

    if (digits.length >= 8) {
      formatted += ' ' + digits.substring(7, 9);
    }

    this.form.patchValue(
      {
        phone: formatted,
      },
      { emitEvent: false }
    );
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;

    this.orgService.createProfile(this.form.value as any).subscribe({
      next: () => {
        this.toast.success('Профіль створено', 'Тепер ви можете публікувати запити');
        this.router.navigate(['/organization']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.graphQLErrors?.[0]?.message ?? err.message;
        this.toast.error('Помилка', msg);
      },
    });
  }
}