import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@core/models/user.model';
import { VolunteerRequest } from '@features/requests';

@Component({
  selector: 'app-profile-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-requests.component.html'
})
export class ProfileRequestsComponent {
  @Input({ required: true }) user!: User;
  @Input({ required: true }) requests: VolunteerRequest[] | null = [];
  @Input({ required: true }) volunteerTasks: VolunteerRequest[] = [];
  @Input({ required: true }) volunteerLoading = false;
  @Input({ required: true }) volunteerError = false;

  @Output() editRequest = new EventEmitter<VolunteerRequest>();
  @Output() deleteRequest = new EventEmitter<string>();
  @Output() cancelHelp = new EventEmitter<VolunteerRequest>();
  @Output() completeReview = new EventEmitter<VolunteerRequest>();
  @Output() openOnMap = new EventEmitter<VolunteerRequest>();

  @Input() canUpdateFn!: (req: VolunteerRequest) => boolean;
  @Input() canDeleteFn!: (req: VolunteerRequest) => boolean;
  @Input() volunteerNameFn!: (req: VolunteerRequest) => string;
  @Input() volunteerInitialFn!: (req: VolunteerRequest) => string;
  @Input() orgPhoneFn!: (req: VolunteerRequest) => string | null;
}