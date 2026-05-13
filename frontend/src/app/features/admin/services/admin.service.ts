import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import { GET_ADMIN_STATS, GET_ADMIN_USERS } from '../graphql/admin.queries';
import { BAN_USER } from '../graphql/admin.mutations';
import { AdminDashboardStats } from '../models/admin-dashboard.model';
import { AdminUser } from '../models/admin-user.model';

@Injectable({
  providedIn: 'root' // Або вкажи конкретний модуль, якщо не хочеш global scope
})
export class AdminService {
  private apollo = inject(Apollo);

  /**
   * Отримує статистику для карток дашборду
   */
  getDashboardStats(): Observable<AdminDashboardStats> {
    return this.apollo
      .watchQuery<{ adminGetDashboardStats: AdminDashboardStats }>({
        query: GET_ADMIN_STATS,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        // Додаємо оператор "!" або повертаємо порожній об'єкт як fallback
        map((result) => result.data?.adminGetDashboardStats as AdminDashboardStats)
      );
  }

  getAllUsers(): Observable<AdminUser[]> {
      return this.apollo
        .watchQuery<{ adminGetAllUsers: AdminUser[] }>({ 
          query: GET_ADMIN_USERS,
          fetchPolicy: 'cache-and-network' 
        })
        .valueChanges.pipe(
          // Кастуємо через 'as', щоб TypeScript не сварився на DeepPartial
          map(result => (result.data?.adminGetAllUsers || []) as AdminUser[])
        );
    }

  /**
   * Блокування користувача
   */
  banUser(userId: string, reason: string): Observable<boolean> {
    return this.apollo
      .mutate<{ adminBanUser: boolean }>({
        mutation: BAN_USER,
        variables: {
          input: { userId, reason },
        },
        // Після бану оновлюємо кеш або перезапитуємо список
        refetchQueries: [{ query: GET_ADMIN_USERS }]
      })
      .pipe(map((result) => !!result.data?.adminBanUser));
  }
}