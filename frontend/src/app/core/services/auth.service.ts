import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs'; // Додали 'of'
import { Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      access_token
      user {
        id
        email
        firstName
        role
        city
        region,
        isEmailVerified
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      access_token
      user {
        id
        email
        role
        firstName
        city
        isEmailVerified
      }
    }
  }
`;

const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

const GENERATE_2FA_MUTATION = gql`
  mutation Generate2FA($userId: String!) {
    generate2FA(userId: $userId)
  }
`;

const TURN_ON_2FA_MUTATION = gql`
  mutation TurnOn2FA($userId: String!, $code: String!) {
    turnOn2FA(userId: $userId, code: $code)
  }
`;

const RESEND_VERIFICATION_EMAIL = gql`
  mutation ResendVerificationEmail($userId: String!) {
    resendVerificationEmail(userId: $userId)
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

  verifyEmail(token: string): Observable<boolean> {
    return this.apollo.mutate<{ verifyEmail: boolean }>({
      mutation: VERIFY_EMAIL_MUTATION,
      variables: { token }
    }).pipe(
      map(result => !!result.data?.verifyEmail),
      tap(success => {
        if (success) {
          // Якщо верифікація успішна, оновлюємо локальні дані користувача
          const user = this.getUserFromStorage();
          if (user) {
            const updatedUser = { ...user, isEmailVerified: true };
            this.handleAuthentication(this.getToken() || '', updatedUser);
          }
        }
      })
    );
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
      const mappedRole = userData.userType === 'individual' ? 'volunteer' : 'organization';

      const registerPayload = {
        email: userData.email, 
        password: userData.password, 
        role: mappedRole,
        name: userData.name, // На фронті поле називається 'name', а на бекенді DTO теж чекає 'name'
        region: userData.region,
        city: userData.city
      };

      return this.apollo.mutate<any>({
        mutation: REGISTER_MUTATION,
        variables: { 
          input: registerPayload
        }
      }).pipe(
        // Очікуємо, що бекенд повертає об'єкт { access_token, user } так само, як і при логіні
        map(result => result.data.register),
        tap(data => {
          this.handleAuthentication(data.access_token, data.user);
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

  generate2FA(userId: string): Observable<string> {
    return this.apollo.mutate<any>({
      mutation: GENERATE_2FA_MUTATION,
      variables: { userId }
    }).pipe(map(result => result.data.generate2FA));
  }

  turnOn2FA(userId: string, code: string): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: TURN_ON_2FA_MUTATION,
      variables: { userId, code }
    }).pipe(
      map(result => result.data.turnOn2FA),
      tap(success => {
        if (success) {
          // Оновлюємо локальні дані користувача, щоб статус 2FA змінився на true
          const user = this.getUserFromStorage();
          if (user) {
            this.handleAuthentication(this.getToken() || '', { ...user, isTwoFactorAuthenticationEnabled: true });
          }
        }
      })
    );
  }

  resendVerificationEmail(userId: string): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: RESEND_VERIFICATION_EMAIL,
      variables: { userId }
    }).pipe(
      // !! перетворює результат на boolean (true, якщо об'єкт є)
      map(result => !!result.data?.resendVerificationEmail),
      // Якщо бекенд повернув помилку або мережа лягла
      catchError(err => {
        console.error('Помилка GraphQL:', err);
        return of(false); // Повертаємо false, щоб subscribe спрацював і зупинив лоадер
      })
    );
  }
 
}