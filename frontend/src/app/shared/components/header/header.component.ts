import { Component, computed, EventEmitter, inject, Output } from '@angular/core';
import { UiEventsService } from '@core/services/ui-events.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { CommonModule } from '@angular/common';
import { AbilityServiceSignal } from '@casl/angular';
 

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private router = inject(Router);
  private uiEventsService = inject(UiEventsService);
  private casl = inject(AbilityServiceSignal);
  public authService = inject(AuthService); // Публічний для доступу з HTML
  
  @Output() createRequest = new EventEmitter<void>();

  canCreateRequest = computed(() => this.casl.can('create', 'VolunteerRequest'));

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

  getRoleBadgeClasses(role: string): string {
    const baseClasses = 'inline-block px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md mb-1 transition-colors';
    
    switch (role?.toLowerCase()) {
      case 'admin':
        // Червоно-чорний або золотий стиль для адміна
        return `${baseClasses} bg-slate-900 text-amber-400 group-hover:bg-amber-400 group-hover:text-slate-900`;
      case 'organization':
        // Фіолетовий стиль для організацій
        return `${baseClasses} bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white`;
      case 'volunteer':
      default:
        // Твій стандартний синій для волонтерів
        return `${baseClasses} bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white`;
    }
  }

  getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      admin: 'Адміністратор',
      organization: 'Організація',
      volunteer: 'Волонтер'
    };
    return roles[role?.toLowerCase()] || 'Користувач';
  }
}
