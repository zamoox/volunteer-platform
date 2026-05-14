import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Твій сервіс авторизації

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Перевіряємо роль (наприклад, беремо її з поточного користувача або JWT)

//   if (role === 'admin') {
//     return true; // Дозволяємо перехід
//   }

  // Якщо це не адмін — мовчки викидаємо на головну (або сторінку 403)
  return router.parseUrl('/map'); 
};