import { Component, EventEmitter, inject, Output } from '@angular/core';
import { UiEventsService } from '../../../core/services/ui-events.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private router = inject(Router);
  public authService = inject(AuthService); // Публічний для доступу з HTML
  private uiEventsService = inject(UiEventsService);
  // Подія для відкриття форми на мапі
  @Output() createRequest = new EventEmitter<void>();

  constructor(){}

  goToHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  async onCreateRequest() {
    if (this.authService.isLoggedIn()) {
      if (this.router.url.includes('/map')) {
        // Ми на карті: викликаємо без даних, 
        // а MapComponent у handleHeaderCreateRequest сам візьме map.getCenter()
        this.uiEventsService.emitOpenCreateRequest(); 
      } else {
        // Редірект на карту
        this.router.navigate(['/map'], { queryParams: { action: 'create' } });
      }
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/map?action=create' }
      });
    }
  }
}
