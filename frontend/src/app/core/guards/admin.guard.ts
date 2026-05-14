import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../enums/user-role.enum';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getUserFromStorage();

  if (authService.isLoggedIn() && user?.role === UserRole.ADMIN) {
    return true;
  }

  console.warn('Доступ заборонено: Недостатньо прав для перегляду цієї сторінки');
  
  return router.createUrlTree(['/profile']);
};