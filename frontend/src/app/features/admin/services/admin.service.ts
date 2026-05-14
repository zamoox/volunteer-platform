import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import { GET_ADMIN_ORGS, GET_ADMIN_REQUESTS, GET_ADMIN_STATS, GET_ADMIN_USERS } from '../graphql/admin.queries';
import { BAN_USER, DELETE_REQUEST, VERIFY_ORG } from '../graphql/admin.mutations';
import { AdminDashboardStats } from '../models/admin-dashboard.model';
import { AdminUser } from '../models/admin-user.model';

@Injectable({
  providedIn: 'root' // Або вкажи конкретний модуль, якщо не хочеш global scope
})
export class AdminService {
  private apollo = inject(Apollo);

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

  getAllOrganizations(): Observable<any[]> {
    return this.apollo
      .watchQuery<{ adminGetAllOrganizations: any[] }>({
        query: GET_ADMIN_ORGS,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map(result => result.data?.adminGetAllOrganizations || []));
  }

  getAllRequests(): Observable<any[]> {
    return this.apollo
      .watchQuery<{ adminGetAllRequests: any[] }>({
        query: GET_ADMIN_REQUESTS,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map(result => result.data?.adminGetAllRequests || []));
  }

  verifyOrganization(id: string): Observable<any> {
    return this.apollo.mutate({
      mutation: VERIFY_ORG,
      variables: { id },
      refetchQueries: [{ query: GET_ADMIN_ORGS }, { query: GET_ADMIN_STATS }]
    });
  }

  deleteRequest(id: string, reason: string): Observable<any> {
    return this.apollo.mutate({
      mutation: DELETE_REQUEST,
      variables: { id, reason },
      refetchQueries: [{ query: GET_ADMIN_REQUESTS }, { query: GET_ADMIN_STATS }]
    });
  }
}