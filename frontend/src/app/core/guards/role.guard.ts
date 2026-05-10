import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.getUserFromStorage();

    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    if (!allowedRoles.includes(user.role)) {
      // Редирект на свій дашборд
      const roleRoutes: Record<string, string> = {
        volunteer:    '/map',
        organization: '/organization',
        admin:        '/admin',
      };
      router.navigate([roleRoutes[user.role] ?? '/']);
      return false;
    }

    return true;
  };
};