import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ToastService } from '@core/services/toast.service';
import type { VolunteerRequest } from '../../models/volunteer-request.model';
import { VolunteerRequestService } from '../../services/volunter-request.service';

@Component({
  selector: 'app-complete-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './complete-review-modal.component.html',
})
export class CompleteReviewModalComponent {
  readonly open = input(false);
  readonly requestId = input<string | null>(null);

  readonly dismiss = output<void>();
  readonly success = output<VolunteerRequest>();

  readonly starOptions = [1, 2, 3, 4, 5] as const;

  rating = signal(0);
  comment = '';
  submitting = signal(false);

  private requestService = inject(VolunteerRequestService);
  private toastService = inject(ToastService);

  setRating(n: number): void {
    this.rating.set(n);
  }

  cancel(): void {
    if (this.submitting()) return;
    this.resetForm();
    this.dismiss.emit();
  }

  onBackdrop(): void {
    this.cancel();
  }

  submit(): void {
    const rid = this.requestId();
    if (!rid || this.rating() < 1) {
      this.toastService.show('Увага', 'Оберіть оцінку від 1 до 5 зірок', 'error');
      return;
    }
    this.submitting.set(true);
    const c = this.comment.trim();
    this.requestService
      .completeRequestWithReview(rid, this.rating(), c || undefined)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (res) => {
          const req = res.data?.completeRequestWithReview as VolunteerRequest | undefined;
          if (req) {
            this.success.emit(req);
          }
          this.resetForm();
          this.dismiss.emit();
          this.toastService.show('Готово', 'Запит завершено, дякуємо за відгук', 'success');
        },
        error: () => {
          this.toastService.show('Помилка', 'Не вдалося завершити запит або відгук уже залишено', 'error');
        },
      });
  }

  private resetForm(): void {
    this.rating.set(0);
    this.comment = '';
  }
}
