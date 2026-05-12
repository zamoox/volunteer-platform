import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { ToastService } from '@core/services/toast.service';
import { VolunteerRequest, VolunteerRequestService } from '@features/requests';

@Component({
  selector: 'app-organization-dashboard',
  imports: [CommonModule],
  templateUrl: './organization-dashboard.component.html',
  styleUrl: './organization-dashboard.component.css',
})
export class OrganizationDashboardComponent implements OnInit {
  private requestService = inject(VolunteerRequestService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  myRequests: VolunteerRequest[] = [];
  loading = true;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.requestService.getMyRequests().pipe(take(1)).subscribe({
      next: (list) => {
        this.myRequests = list ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.myRequests = [];
        this.loading = false;
        this.toast.show('Помилка', 'Не вдалося завантажити запити', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  volunteerName(req: VolunteerRequest): string {
    const v = req.volunteer;
    if (!v) return '';
    const fn = v.firstName || v.user?.firstName || '';
    const ln = v.lastName || v.user?.lastName || '';
    return `${fn} ${ln}`.trim() || 'Волонтер';
  }

  volunteerInitial(req: VolunteerRequest): string {
    const n = this.volunteerName(req);
    return n ? n.charAt(0).toUpperCase() : 'V';
  }

  cancelVolunteerHelp(req: VolunteerRequest): void {
    if (req.status !== 'in_progress') return;
    this.requestService.updateStatus(req.id, 'cancelled').pipe(take(1)).subscribe({
      next: () => {
        this.toast.show('Оновлено', 'Допомогу скасовано', 'success');
        this.reload();
      },
      error: () => this.toast.show('Помилка', 'Не вдалося скасувати', 'error'),
    });
  }

  deleteRequest(req: VolunteerRequest): void {
    if (req.status !== 'open') return;
    if (!confirm('Видалити цей запит?')) return;
    this.requestService.deleteRequest(req.id).pipe(take(1)).subscribe({
      next: () => {
        this.toast.show('Видалено', 'Запит прибрано зі списку', 'success');
        this.reload();
      },
      error: () => this.toast.show('Помилка', 'Не вдалося видалити', 'error'),
    });
  }
}
