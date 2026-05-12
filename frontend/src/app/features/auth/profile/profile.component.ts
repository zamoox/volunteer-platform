import { ChangeDetectorRef, Component, inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, finalize, Observable, of, shareReplay, take } from 'rxjs';
import { Apollo } from 'apollo-angular';

import { AuthService } from '@core/services';
import { ToastService } from '@core/services/toast.service';
import { User } from '@core/models/user.model';
import {
  VolunteerRequestService,
  VolunteerRequest,
  RequestFormComponent,
  CompleteReviewModalComponent,
} from '@features/requests';
import { AbilityServiceSignal } from '@casl/angular';
import { subject } from '@casl/ability';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { MY_VOLUNTEER_PROFILE } from '@features/volunteers/graphql/volunteer-profile.queries';
import type { MyVolunteerProfile } from '@features/volunteers/models/my-volunteer-profile.model';
import { OrganizationService } from '@features/organizations/services/organization.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    RequestFormComponent,
    ModalComponent,
    CompleteReviewModalComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  public orgService = inject(OrganizationService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private ability = inject(AbilityServiceSignal);
  private apollo = inject(Apollo);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  private user: User | null = null;
  public organizationProfile$!: Observable<any>;

  /** Дані волонтерського кабінету (activeTasks + reviews) з myVolunteerProfile. */
  volunteerDashboard: MyVolunteerProfile | null = null;
  volunteerDashboardLoading = false;
  volunteerDashboardError = false;

  readonly starIndexes = [1, 2, 3, 4, 5] as const;

  public isEditModalOpen = false;
  public selectedRequest: VolunteerRequest | null = null;

  qrCodeUrl: string | null = null;
  twoFaCode: string = '';
  isStepVerify: boolean = false;
  cooldownSeconds = 0; 
  private timerInterval: any;
  private readonly COOLDOWN_KEY = 'email_resend_cooldown_end';

  isChangingPasswordMode = false;
  isSubmittingPassword = false;
  passwordForm!: FormGroup;
  passwordError: string | null = null;
  passwordSuccess: boolean = false;

  public isDeleteModalOpen = false;
  private requestIdToDelete: string | null = null;

  public isCompleteReviewOpen = false;
  public completeReviewRequestId: string | null = null;


  activeTab: 'info' | 'settings' | 'reviews' | 'requests' = 'info';
  isSendingEmail: boolean = false;
  emailSent: boolean = false;

  
  public requestService = inject(VolunteerRequestService);
  requests$!: Observable<VolunteerRequest[]>;

  canDelete(request: VolunteerRequest): boolean {
    if (!request) return false;
    return this.ability.can('delete', subject('VolunteerRequest', { ...request }));
  }

  canUpdate(request: VolunteerRequest): boolean {
    if (!request) return false;
    return this.ability.can('update', subject('VolunteerRequest', { ...request }));
  }

  onEditRequest(req: VolunteerRequest) {
    this.selectedRequest = req;
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedRequest = null;
  }

  onEditSubmitted() {
    // Оновлюємо список запитів після успішного редагування
    this.requests$ = this.requestService.getMyRequests();
    this.closeEditModal();
    this.cdr.detectChanges();
  }
  


  ngOnInit() {
    this.authService.currentUser$.subscribe(userData => {
      this.user = userData;

      if (userData?.role === 'organization') {
        this.requests$ = this.requestService.getMyRequests();
      }

      if (userData?.role === 'volunteer') {
        this.loadVolunteerDashboard();
      } else {
        this.volunteerDashboard = null;
        this.volunteerDashboardLoading = false;
        this.volunteerDashboardError = false;
      }

      this.cdr.detectChanges(); // Оновлюємо UI, коли прийшли дані
    });

  this.organizationProfile$ = this.orgService.getMyOrganization().pipe(
    // shareReplay(1) гарантує, що запит піде один раз, навіть якщо в HTML кілька підписок
    shareReplay(1), 
    catchError(err => {
      console.error('Помилка профілю організації:', err);
      return of(null);
    })
  );

    this.checkExistingCooldown();
    this.initPasswordForm();
  }

  onDeleteRequest(id: string) {
    this.requestIdToDelete = id;
    this.isDeleteModalOpen = true;
  }

  confirmDelete() {
  if (!this.requestIdToDelete) return;

  this.requestService.deleteRequest(this.requestIdToDelete).subscribe({
    next: () => {
      this.isDeleteModalOpen = false;
      this.requestIdToDelete = null;
      // Оновлюємо список
      this.requests$ = this.requestService.getMyRequests();
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Помилка видалення:', err);
      this.isDeleteModalOpen = false;
    }
  });
}

  onChangeStatus(id: string, newStatus: string) {
    this.requestService.updateStatus(id, newStatus).subscribe({
      next: () => {
        this.requests$ = this.requestService.getMyRequests();
        this.cdr.detectChanges();
      },
    });
  }

  openCompleteReview(req: VolunteerRequest): void {
    this.completeReviewRequestId = req.id;
    this.isCompleteReviewOpen = true;
    this.cdr.detectChanges();
  }

  onCompleteReviewDismiss(): void {
    this.isCompleteReviewOpen = false;
    this.completeReviewRequestId = null;
    this.cdr.detectChanges();
  }

  onCompleteReviewSuccess(_req: VolunteerRequest): void {
    this.requests$ = this.requestService.getMyRequests();
    this.isCompleteReviewOpen = false;
    this.completeReviewRequestId = null;
    if (this.user?.role === 'volunteer') {
      this.loadVolunteerDashboard();
    }
    this.cdr.detectChanges();
  }

  volunteerRequestVolunteerName(req: VolunteerRequest): string {
    const v = req.volunteer;
    if (!v) return '';
    const fn = v.firstName || v.user?.firstName || '';
    const ln = v.lastName || v.user?.lastName || '';
    return `${fn} ${ln}`.trim() || 'Волонтер';
  }

  volunteerRequestVolunteerInitial(req: VolunteerRequest): string {
    const n = this.volunteerRequestVolunteerName(req);
    return n ? n.charAt(0).toUpperCase() : 'V';
  }

  onCancelVolunteerHelp(req: VolunteerRequest): void {
    if (req.status !== 'in_progress') return;
    this.requestService.updateStatus(req.id, 'cancelled').subscribe({
      next: () => {
        this.toastService.show('Оновлено', 'Допомогу скасовано', 'success');
        this.requests$ = this.requestService.getMyRequests();
        this.cdr.detectChanges();
      },
      error: () => this.toastService.show('Помилка', 'Не вдалося скасувати', 'error'),
    });
  }

  initPasswordForm() {
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Кастомний валідатор: перевіряє, чи збігаються паролі
  passwordMatchValidator(control: AbstractControl) {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordForm() {
    this.isChangingPasswordMode = !this.isChangingPasswordMode;
    if (!this.isChangingPasswordMode) {
      // Очищаємо форму при закритті
      this.passwordForm.reset();
      this.passwordError = null;
      this.passwordSuccess = false;
    }
  }

  onSubmitPasswordChange() {
    if (this.passwordForm.invalid) return;

    if (!this.user || !this.user.id) {
      this.passwordError = 'Помилка авторизації: дані користувача не знайдено.';
      return;
    }

    this.isSubmittingPassword = true;
    this.passwordError = null;
    this.passwordSuccess = false;

    const { oldPassword, newPassword } = this.passwordForm.value;

    const userId = this.user.id;

    this.authService.changePassword(userId, oldPassword, newPassword).pipe(
      take(1),
      finalize(() => {
        this.isSubmittingPassword = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (success) => {
        if (success) {
          this.passwordSuccess = true;
          this.passwordForm.reset();
          // Закриваємо форму через 3 секунди після успіху
          setTimeout(() => {
            this.togglePasswordForm();
            this.cdr.detectChanges();
          }, 3000);
        }
      },
      error: (err) => {
        // GraphQL повертає повідомлення про помилку в err.message
        this.passwordError = err.message || 'Не вдалося змінити пароль. Перевірте дані.';
      }
    });
  }

  private checkExistingCooldown() {
    const savedCooldownEnd = localStorage.getItem(this.COOLDOWN_KEY);
    
    if (savedCooldownEnd) {
      const endTime = parseInt(savedCooldownEnd, 10);
      const now = Date.now();

      if (endTime > now) {
        // Якщо час ще не вийшов, вираховуємо залишок у секундах
        this.cooldownSeconds = Math.ceil((endTime - now) / 1000);
        this.emailSent = true;
        this.startTimerInterval();
      } else {
        // Якщо час вже вийшов, поки нас не було — прибираємо сміття
        localStorage.removeItem(this.COOLDOWN_KEY);
      }
    }
  }

  private startTimerInterval() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
  this.ngZone.run(() => {
      this.timerInterval = setInterval(() => {
        if (this.cooldownSeconds > 0) {
          this.cooldownSeconds--;
          // Примусове оновлення дерева компонентів
          this.cdr.detectChanges(); 
        } else {
          this.stopTimer();
        }
      }, 1000);
    });
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.cooldownSeconds = 0;
    localStorage.removeItem(this.COOLDOWN_KEY);
    this.cdr.detectChanges();
  }

  // Допоміжний метод для гарного відображення ролі
  getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      volunteer: 'Волонтер',
      organization: 'Організація',
      admin: 'Адміністратор'
    };
    return roles[role] || 'Користувач';
  }

  setTab(tab: 'info' | 'settings' | 'reviews' | 'requests') {
    this.activeTab = tab as 'info' | 'settings' | 'reviews' | 'requests';
    if (tab === 'requests' && this.user?.role === 'volunteer') {
      this.loadVolunteerDashboard();
    }
    if (tab === 'reviews' && this.user?.role === 'volunteer') {
      this.loadVolunteerDashboard();
    }
  }

  loadVolunteerDashboard(): void {
    this.volunteerDashboardLoading = true;
    this.volunteerDashboardError = false;
    this.apollo
      .query<{ myVolunteerProfile: MyVolunteerProfile | null }>({
        query: MY_VOLUNTEER_PROFILE,
        fetchPolicy: 'network-only',
      })
      .pipe(take(1))
      .subscribe({
        next: (r) => {
          this.volunteerDashboard = r.data?.myVolunteerProfile ?? null;
          this.volunteerDashboardLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.volunteerDashboardLoading = false;
          this.volunteerDashboardError = true;
          this.cdr.markForCheck();
        },
      });
  }

  volunteerActiveTasks(): VolunteerRequest[] {
    return this.volunteerDashboard?.activeTasks ?? [];
  }

  volunteerReviews() {
    return this.volunteerDashboard?.reviews ?? [];
  }

  organizationPhoneForVolunteerTask(req: VolunteerRequest): string | null {
    const org = req.organization;
    if (!org) return null;
    const p = org.phone || org.user?.phone;
    return p && String(p).trim() ? String(p).trim() : null;
  }

  openRequestOnMap(req: VolunteerRequest): void {
    void this.router.navigate(['/map'], { queryParams: { requestId: req.id } });
  }

  secondTabLabel(role: string | undefined): string {
    if (role === 'organization') return 'Мої запити';
    return 'Активні задачі';
  }

  onEnable2FA(userId: string) {
    // Очищаємо попередні дані, якщо вони були
    this.twoFaCode = '';
    
    this.authService.generate2FA(userId).pipe(
      take(1)
    ).subscribe({
      next: (qrCode) => {
        this.qrCodeUrl = qrCode;
        this.isStepVerify = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Помилка генерації QR:', err);
        // Можна додати toast повідомлення тут
      }
    });
  }

  confirm2FA(userId: string) {
    // Валідація на довжину коду (тільки цифри)
    if (this.twoFaCode.length !== 6 || !/^\d+$/.test(this.twoFaCode)) {
      alert('Будь ласка, введіть коректний 6-значний код');
      return;
    }

    this.authService.turnOn2FA(userId, this.twoFaCode).pipe(
      take(1),
      finalize(() => {
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (success) => {
        if (success) {
          // Оновлення успішне. AuthService.turnOn2FA вже оновив currentUser$
          this.qrCodeUrl = null;
          this.isStepVerify = false;
          this.twoFaCode = '';
          // Тут можна замінити alert на красивий Toast
          alert('2FA успішно активовано!');
        }
      },
      error: (err) => {
        // Якщо код невірний, бекенд викине помилку
        alert(err.message || 'Невірний код. Спробуйте ще раз.');
        this.twoFaCode = ''; // Очищаємо поле для повторної спроби
      }
    });
  }

  onResendEmail(userId: string) {
      if (this.isSendingEmail || this.cooldownSeconds > 0) return;

      this.isSendingEmail = true;
      this.cdr.detectChanges();

      this.authService.resendVerificationEmail(userId).pipe(
        take(1),
        finalize(() => {
          this.isSendingEmail = false;
          this.cdr.detectChanges();
        })
      ).subscribe({
        next: (success) => {
          if (success) {
            this.emailSent = true;
            this.cooldownSeconds = 60;
            
            // Рахуємо, коли таймер має закінчитися (зараз + 60 секунд)
            const endTime = Date.now() + 60000;
            localStorage.setItem(this.COOLDOWN_KEY, endTime.toString());

            this.startTimerInterval(); // Запускаємо відлік
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.emailSent = false;
          this.cooldownSeconds = 0;
          localStorage.removeItem(this.COOLDOWN_KEY);
          this.cdr.detectChanges();
        }
      });
    }

  // Дуже важливо для Angular: очищати таймери, якщо користувач перейшов на іншу сторінку
  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  onLogout() {
    this.authService.logout();
  }
}