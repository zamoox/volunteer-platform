import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs'; // Додали 'of'
import { Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      access_token
      user {
        id
        email
        role
      }
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private apollo = inject(Apollo);
  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  private getUserFromStorage(): any {
    const savedUser = localStorage.getItem('user_data');
    return savedUser ? JSON.parse(savedUser) : null;
  }

  login(email: string, password: string) {
      return this.apollo.mutate<any>({
        mutation: LOGIN_MUTATION,
        variables: { email, password }
      }).pipe(
        map(result => result.data.login),
        tap(data => {
          localStorage.setItem(this.TOKEN_KEY, data.access_token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
          this.currentUserSubject.next(data.user);
        })
      );
  }

  register(userData: any): Observable<any> {
    // Для реєстрації теж повертаємо успіх і ті дані, що ввів юзер
    return of({ token: 'fake-jwt-token-67890', user: userData }).pipe(
      tap(response => {
        this.handleAuthentication(response.token, response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private handleAuthentication(token: string, user: any): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}