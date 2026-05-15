import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-profile-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-reviews.component.html'
})
export class ProfileReviewsComponent {
  @Input({ required: true }) user!: User;
  @Input({ required: true }) reviews: any[] = [];
  @Input({ required: true }) isLoading = false;

  readonly starIndexes = [1, 2, 3, 4, 5] as const;
}