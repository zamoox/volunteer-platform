import { Component, Input, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { finalize, take } from 'rxjs';
import { User } from '@core/models/user.model';
import { AuthService } from '@core/services';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile-settings.component.html'
})
export class ProfileSettingsComponent {
  @Input({ required: true }) user!: User;
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // Password State
  isChangingPasswordMode = false;
  isSubmittingPassword = false;
  passwordForm: FormGroup;

  // 2FA State
  isStepVerify = false;
  qrCodeUrl: string | null = null;
  twoFaCode = '';

  constructor() {
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(control: AbstractControl) {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordForm() {
    this.isChangingPasswordMode = !this.isChangingPasswordMode;
    if (!this.isChangingPasswordMode) this.passwordForm.reset();
  }

  onSubmitPasswordChange() {
    if (this.passwordForm.invalid) return;
    this.isSubmittingPassword = true;

    const { oldPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword(this.user.id, oldPassword, newPassword)
      .pipe(take(1), finalize(() => {
        this.isSubmittingPassword = false;
        this.cdr.detectChanges();
      }))
      .subscribe(success => {
        if (success) {
          this.passwordForm.reset();
          setTimeout(() => this.togglePasswordForm(), 2000);
        }
      });
  }

  onEnable2FA() {
    this.twoFaCode = '';
    this.authService.generate2FA(this.user.id).pipe(take(1)).subscribe(qrCode => {
      this.qrCodeUrl = qrCode;
      this.isStepVerify = true;
      this.cdr.detectChanges();
    });
  }

  confirm2FA() {
    if (this.twoFaCode.length !== 6) return;
    this.authService.turnOn2FA(this.user.id, this.twoFaCode)
      .pipe(take(1), finalize(() => this.cdr.detectChanges()))
      .subscribe(success => {
        if (success) {
          this.isStepVerify = false;
          this.qrCodeUrl = null;
        }
      });
  }
}