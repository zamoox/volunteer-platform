import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrganizationService } from '../../services/organization.service';
import { ToastService } from '@core/services/toast.service';
import { PhoneMaskDirective } from '@core/directives/phone-mask.directive';
import { UPLOAD_DOCS_MUTATION } from '@features/organizations/graphql/organizations.mutations';

interface OrgDocuments {
  registration: File | null;
  statute: File | null;
}

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
  currentStep = 1; // 1: Info, 2: Documents

  // Динамічні кроки
  get steps() {
    return [
      { icon: '✉️', label: 'Акаунт створено', done: true, active: false },
      { icon: '🏢', label: 'Дані організації', done: this.currentStep > 1, active: this.currentStep === 1 },
      { icon: '📄', label: 'Завантаження документів', done: false, active: this.currentStep === 2 },
      { icon: '✅', label: 'Верифікація', done: false, active: false },
    ];
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    edrpou: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    description: [''],
    website: [''],
    // Номер телефону прибрано, бо він є в профілі користувача
  });

  // Файли для завантаження
  public docs: OrgDocuments = {
    registration: null as File | null,
    statute: null as File | null
  };

  ngOnInit(): void {
    this.checkExistingProfile();
  }

  private checkExistingProfile() {
    this.isLoading = true;
    this.orgService.getMyOrganization().subscribe({
      next: (profile) => {
        if (profile) this.router.navigate(['/organization']);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  nextStep() {
    if (this.form.valid) this.currentStep = 2;
    else this.form.markAllAsTouched();
  }

  onFileSelected(event: any, type: 'registration' | 'statute') {
    const file = event.target.files[0];
    if (file) this.docs[type] = file;
  }

  submitApplication() {
    if (!this.docs.registration || !this.docs.statute) return;

    this.isLoading = true;

    // 1. Спочатку створюємо профіль організації (твій існуючий метод)
    this.orgService.createProfile(this.form.value as any).subscribe({
      next: () => {
        // 2. Якщо профіль створено успішно, завантажуємо документи
        this.orgService.uploadDocuments(this.docs).subscribe({
          next: () => {
            this.isLoading = false;
            this.toast.success('Успіх', 'Документи надіслано на верифікацію');
            this.router.navigate(['/profile']);
          },
          error: (err) => {
            this.isLoading = false;
            this.toast.error('Помилка', 'Не вдалося завантажити документи');
            console.error(err);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.error('Помилка створення профілю', err.message);
      }
    });
  }


  getError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return "Це поле є обов'язковим";
    if (control.errors['minlength']) return `Мінімум ${control.errors['minlength'].requiredLength} символів`;
    if (control.errors['pattern']) {
      if (field === 'edrpou') return 'Код ЄДРПОУ має складатися рівно з 8 цифр';
      if (field === 'website') return 'Введіть коректну адресу сайту';
    }
    return 'Некоректне значення';
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  removeFile(type: keyof OrgDocuments) {
    this.docs[type] = null;
  }
}