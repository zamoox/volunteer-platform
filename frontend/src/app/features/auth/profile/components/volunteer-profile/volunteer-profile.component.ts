import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { take } from 'rxjs/operators';
import { MY_VOLUNTEER_PROFILE } from '@features/volunteers/graphql/volunteer.queries';
import type { MyVolunteerProfile } from '@features/volunteers/models/my-volunteer-profile.model';

@Component({
  selector: 'app-volunteer-profile',
  imports: [CommonModule, RouterLink],
  templateUrl: './volunteer-profile.component.html',
  styleUrl: './volunteer-profile.component.css',
})
export class VolunteerProfileComponent implements OnInit {
  private apollo = inject(Apollo);

  readonly profile = signal<MyVolunteerProfile | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly activeTab = signal<'overview' | 'tasks' | 'reviews'>('overview');

  readonly displayName = computed(() => {
    const p = this.profile();
    if (!p) return '';
    const fn = p.firstName || p.user?.firstName || '';
    const ln = p.lastName || p.user?.lastName || '';
    const s = `${fn} ${ln}`.trim();
    return s || 'Волонтер';
  });

  readonly filledStars = computed(() => {
    const p = this.profile();
    if (!p) return 0;
    return Math.min(5, Math.max(0, Math.round(p.averageRating || 0)));
  });

  readonly starIndexes = [1, 2, 3, 4, 5] as const;

  ngOnInit(): void {
    this.apollo
      .query<{ myVolunteerProfile: MyVolunteerProfile | null }>({
        query: MY_VOLUNTEER_PROFILE,
        fetchPolicy: 'network-only',
      })
      .pipe(take(1))
      .subscribe({
        next: (r) => {
          this.profile.set(r.data?.myVolunteerProfile ?? null);
          this.loading.set(false);
          this.error.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set(true);
        },
      });
  }

  setTab(tab: 'overview' | 'tasks' | 'reviews'): void {
    this.activeTab.set(tab);
  }
}
