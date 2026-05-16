import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { CaslService } from '@core/casl/services/casl.service';
import { AuthService } from '@core/services';
import { ToastService } from '@core/services/toast.service';
import { VolunteerRequest, VolunteerRequestService } from '@features/requests';
import { REQUEST_CATEGORIES } from '@features/requests/constants/categories.constant';
import { VolunteerRequestsStore } from '../../services/volunteer-requests-store.service';
import { CompleteReviewModalComponent } from '../complete-review-modal/complete-review-modal.component';

@Component({
  selector: 'app-request-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, CompleteReviewModalComponent],
  templateUrl: './request-details.component.html',
  styleUrl: './request-details.component.css',
})
export class RequestDetailsComponent implements OnChanges {
  @Input() request!: VolunteerRequest;
  @Input() position: 'left' | 'right' = 'left';

  @Output() closed = new EventEmitter<void>();
  @Output() responded = new EventEmitter<string>();
  @Output() edit = new EventEmitter<VolunteerRequest>();
  @Output() delete = new EventEmitter<string>();

  private requestService = inject(VolunteerRequestService);
  private toastService = inject(ToastService);
  public caslService = inject(CaslService);
  authService = inject(AuthService);
  private store = inject(VolunteerRequestsStore);

  private requestSignal = signal<VolunteerRequest | null>(null);
  private currentUser = signal(this.authService.getUserFromStorage());

  reviewModalOpen = signal(false);
  reviewTargetRequestId = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['request']) {
      this.requestSignal.set(this.request);
    }
  }

  public isOwner = computed(() => {
    const req = this.requestSignal();
    const user = this.currentUser();
    return !!user && !!req?.organization && user.id === req.organization.userId;
  });

  public isAlreadyResponded = computed(() => {
    const req = this.requestSignal();
    const user = this.currentUser();
    return !!user && !!req?.volunteer && user.id === req.volunteer.userId;
  });

  public canRespond = computed(() => {
    const req = this.requestSignal();
    const user = this.currentUser();

    if (!req || !user) return false;

    const owner = !!req.organization && user.id === req.organization.userId;
    const hasVolunteerRole = this.caslService.can('update', 'VolunteerRequest');

    return hasVolunteerRole && !owner && req.status === 'open';
  });

  /** Власник, запит у процесі, є волонтер, відгуку ще немає */
  public canCompleteWithReview = computed(() => {
    const req = this.requestSignal();
    if (!req) return false;
    return (
      this.isOwner() &&
      req.status === 'in_progress' &&
      !!req.volunteer &&
      !req.review
    );
  });

  public categoryData = computed(() => {
    const req = this.requestSignal();
    return req
      ? REQUEST_CATEGORIES[req.category] || {
          label: 'Запит',
          emoji: '📍',
          color: 'bg-slate-500',
        }
      : null;
  });

  public volunteerDisplayName = computed(() => {
    const v = this.requestSignal()?.volunteer;
    if (!v) return '';
    const fn = v.firstName || v.user?.firstName || '';
    const ln = v.lastName || v.user?.lastName || '';
    const combined = `${fn} ${ln}`.trim();
    return combined || 'Волонтер';
  });

  public volunteerPhone = computed(() => {
    const v = this.requestSignal()?.volunteer;
    return v?.user?.phone?.trim() || '';
  });

  public volunteerInitial = computed(() => {
    const name = this.volunteerDisplayName();
    return name ? name.charAt(0).toUpperCase() : 'V';
  });

  public volunteerFilledStars = computed(() => {
    const v = this.requestSignal()?.volunteer;
    if (!v) return 0;
    return Math.min(5, Math.max(0, Math.round(v.averageRating || 0)));
  });

  public volunteerStatsLine = computed(() => {
    const v = this.requestSignal()?.volunteer;
    if (!v) return '';
    const avg = v.averageRating ?? 0;
    const cnt = v.completedRequestsCount ?? 0;
    return `${cnt} успішних кейсів`;
  });

onRespond(): void {
  const requestId = this.request?.id;
  if (!requestId) return;

  this.requestService.acceptRequest(requestId).subscribe({
    next: (res) => {
      // Використовуємо каст до any, щоб уникнути помилки TS2339, поки Cursor оновлює типи
      const data = res.data as any;
      const updatedRequest = data?.acceptRequest as VolunteerRequest | undefined;

      if (updatedRequest) {
        // Оновлюємо локальний Store. Оскільки updatedRequest тепер містить 
        // об'єкт volunteer з рейтингом, UI перемалюється автоматично.
        this.store.addOrUpdate(updatedRequest);
        
        // Обов'язково вибираємо оновлений запит у сторі, щоб синхронізувати details
        this.store.select(updatedRequest.id);
      } else {
        // Фолбек, якщо мутація не повернула об'єкт
        this.store.loadAll();
      }

      this.responded.emit(requestId);
      
      this.toastService.show(
        'Запит прийнято!', 
        'Тепер ви бачите контакти організації. Удачі!', 
        'success'
      );
    },
    error: (err) => {
      const errorMessage = err.message?.includes('already accepted') 
        ? 'Цей запит уже хтось взяв' 
        : 'Не вдалося відгукнутися на запит';
        
      this.toastService.show('Помилка', errorMessage, 'error');
    },
  });
}

  openReviewModal(): void {
    const req = this.requestSignal();
    if (!req?.id || !this.canCompleteWithReview()) return;
    this.reviewTargetRequestId.set(req.id);
    this.reviewModalOpen.set(true);
  }

  afterReviewModalClosed(): void {
    this.reviewModalOpen.set(false);
    this.reviewTargetRequestId.set(null);
  }

  onReviewSuccess(req: VolunteerRequest): void {
    this.store.addOrUpdate(req);
  }

  onClose(): void {
    this.closed.emit();
  }
}
