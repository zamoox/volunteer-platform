import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '@core/models';

@Component({
  selector: 'app-profile-header',
  imports: [CommonModule],
  templateUrl: './profile-header.component.html',
  styleUrl: './profile-header.component.css',
})
export class ProfileHeaderComponent {
  @Input({ required: true }) user!: User;
  @Input() orgStatus: 'pending' | 'verified' | null = null;
  @Output() logout = new EventEmitter<void>();

  get initials(): string {
    return (this.user.firstName?.[0] || this.user.email?.[0] || 'U').toUpperCase();
  }

  get roleLabel(): string {
    const roles: Record<string, string> = {
      volunteer: 'Волонтер',
      organization: 'Організація',
      admin: 'Адміністратор'
    };
    return roles[this.user.role] || 'Користувач';
  }
}
