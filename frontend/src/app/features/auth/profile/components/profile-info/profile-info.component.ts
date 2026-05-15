import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '@core/models/user.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-info.component.html'
})
export class ProfileInfoComponent {
  @Input({ required: true }) user!: User;
  @Input({ required: true }) organizationProfile$!: Observable<any>;
  @Input({ required: true }) isSendingEmail = false;
  @Input({ required: true }) cooldownSeconds = 0;

  @Output() resendEmail = new EventEmitter<string>();

  get accountTypeLabel(): string {
    if (this.user.role === 'organization') return 'Організація';
    if (this.user.role === 'volunteer') return 'Волонтер';
    if (this.user.role === 'admin') return 'Адмін';
    return 'Фізична особа';
  }
}