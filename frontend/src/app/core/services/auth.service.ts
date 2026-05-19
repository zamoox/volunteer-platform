import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, take, tap } from 'rxjs'; // Додали 'of'
import { Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { User } from '../models/user.model';
import { UserRole } from '../enums/user-role.enum';
import { CaslService } from '../casl/services/casl.service';
import { 
  LOGIN_MUTATION, 
  LOGIN_WITH_2FA_MUTATION,
  REGISTER_MUTATION,
  VERIFY_EMAIL_MUTATION,
  RESEND_VERIFICATION_EMAIL,
  TURN_ON_2FA_MUTATION,
  GENERATE_2FA_MUTATION,
  CHANGE_PASSWORD_MUTATION,
  FORGOT_PASSWORD_MUTATION
 } from '@features/auth/graphql/auth.mutations';
 import { GET_PROFILE } from '@features/auth/graphql/auth.queries';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private apollo = inject(Apollo);
  private caslService = inject(CaslService);

  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';
  private readonly RULES_KEY = 'user_rules';

  constructor(){
     this.currentUserSubject.next(this.getUserFromStorage());
     this.initAbilities();
  }

  public getUserFromStorage(): any {
    const savedUser = localStorage.getItem(this.USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  }

  private initAbilities() {
    const savedRules = localStorage.getItem(this.RULES_KEY);
    if (savedRules) {
      try {
        this.caslService.updateAbility(JSON.parse(savedRules));
      } catch (e) {
        console.error('Помилка парсингу правил CASL', e);
        this.caslService.clear();
      }
    }
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
          // Якщо бекенд просить 2FA — ми НЕ зберігаємо токен, а просто пропускаємо дані далі
          if (data.require2FA) return; 
          // Якщо це звичайний логін — зберігаємо токен і пускаємо в систему
          if (data.access_token && data.user) {
                this.handleAuthentication(data.access_token, data.user, data.rules);
          }
        })
      );
  }

  loginWith2FA(userId: string, code: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: LOGIN_WITH_2FA_MUTATION,
      variables: { userId, code }
    }).pipe(
      map(result => result.data.loginWith2FA),
      tap(data => {
        // Якщо бекенд повернув токен, зберігаємо його і авторизуємо юзера
        if (data.access_token && data.user) {
          this.handleAuthentication(data.access_token, data.user, data.rules);
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    const mappedRole = userData.userType === 'individual' 
      ? UserRole.VOLUNTEER 
      : UserRole.ORGANIZATION;

    const registerPayload = {
      email:    userData.email,
      password: userData.password,
      role:     mappedRole,
      name:     userData.name,
      region:   userData.region,
      city:     userData.city
    };

    return this.apollo.mutate<any>({
      mutation: REGISTER_MUTATION,
      variables: { input: registerPayload }
    }).pipe(
      map(result => { 
        console.log('=== RAW RESULT ===', result.data.register);
        return result.data.register}),
      tap(data => {
        console.log('=== TAP DATA ===', data);
        if (data.access_token && data.user) {
          this.handleAuthentication(data.access_token, data.user, data.rules);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.RULES_KEY);
    this.caslService.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
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

  changePassword(userId: string, oldPassword: string, newPassword: string): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: CHANGE_PASSWORD_MUTATION,
      variables: { userId, oldPassword, newPassword }
    }).pipe(
      map(result => result.data.changePassword),
      catchError(err => {
        console.error('Помилка зміни пароля:', err);
        throw err; 
      })
    );
  }

  getCurrentUser() {
    // Очікуємо AuthResponse від поля "me"
    return this.apollo.query<{ me: { user: User; rules: any[] } }>({ 
      query: GET_PROFILE, 
      fetchPolicy: 'network-only' 
    }).pipe(
      map(result => {
        console.log(result);
        // Перевіряємо вкладеність me.user
        if (!result.data || !result.data.me || !result.data.me.user) {
          throw new Error('Профіль не знайдено');
        }
        return result.data.me; // Повертаємо { user, rules }
      }),
      tap(({ user, rules }) => {
        console.log(`${user} ${rules}`)
        if (this.getToken()) {
          this.handleAuthentication(this.getToken() || '', user, rules);
        }
      }),
      catchError(err => {
        console.error('Помилка завантаження профіля:', err);
        throw err;
      })
    );
  }

handleAuthentication(token: string, user: User | null, rules: any[] = []) {

  if (!token) {
    this.logout();
    return;
  }

  localStorage.setItem(this.TOKEN_KEY, token);
  
  if (user && rules?.length > 0) {
    this.saveSessionData(user, rules);
    return;
  }

  // 4. Сценарій Б: Тільки токен (Google OAuth редирект)
  // Використовуємо take(1) для автоматичного відключення від стріму
  this.getCurrentUser().pipe(take(1)).subscribe({
    next: (response: any) => {
      console.log(response + ' GET CURRENT USER METHOD FRONTEND')
      if (response?.user && response?.rules) {
        this.saveSessionData(response.user, response.rules);
      }
    },
    error: (err) => {
      console.error('Failed to hydrate profile after OAuth:', err);
      this.logout(); // Якщо не вдалося завантажити профіль — сесія недійсна
    }
  });
}

private saveSessionData(user: User, rules: any[]): void {
  // Зберігаємо в Storage
  localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  localStorage.setItem(this.RULES_KEY, JSON.stringify(rules));

  // Оновлюємо реактивні стани
  this.caslService.updateAbility(rules);
  this.currentUserSubject.next(user);
}

forgotPassword(email: string) {
    return this.apollo.mutate({
      mutation: FORGOT_PASSWORD_MUTATION,
      variables: { email }
    });
  }
 
}