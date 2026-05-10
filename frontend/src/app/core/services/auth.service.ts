import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs'; // Додали 'of'
import { Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { User } from '../models/user.model';
import { UserRole } from '../enums/user-role.enum';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      access_token
      require2FA       # 👈 Додаємо
      userId           # 👈 Додаємо
      message
      user {
        id
        email
        firstName
        role
        city
        region,
        isEmailVerified
        isTwoFactorEnabled
      }
    }
  }
`;

const LOGIN_WITH_2FA_MUTATION = gql`
  mutation LoginWith2FA($userId: String!, $code: String!) {
    loginWith2FA(userId: $userId, code: $code) {
      access_token
      user {
        id
        email
        firstName
        role
        city
        region
        isEmailVerified
        isTwoFactorEnabled
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

const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($userId: String!, $oldPassword: String!, $newPassword: String!) {
    changePassword(userId: $userId, oldPassword: $oldPassword, newPassword: $newPassword)
  }
`;

const GET_PROFILE = gql`
  query {
    me {
      id
      email
      firstName
      lastName
      role
      isTwoFactorEnabled
      isEmailVerified
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

  constructor(){
     this.currentUserSubject.next(this.initUserFromStorage());
  }

  public getUserFromStorage(): any {
    const savedUser = localStorage.getItem(this.USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  }

  private initUserFromStorage(): User | null {
    const savedUser = localStorage.getItem(this.USER_KEY);
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
          // Якщо бекенд просить 2FA — ми НЕ зберігаємо токен, а просто пропускаємо дані далі
          if (data.require2FA) return; 
          // Якщо це звичайний логін — зберігаємо токен і пускаємо в систему
          if (data.access_token && data.user) {
                this.handleAuthentication(data.access_token, data.user);
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
          this.handleAuthentication(data.access_token, data.user);
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
        // Тільки зберігаємо — без navigate!
        console.log('=== TAP DATA ===', data);
        if (data.access_token && data.user) {
          localStorage.setItem(this.TOKEN_KEY, data.access_token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
          this.currentUserSubject.next(data.user);
        }
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

  changePassword(userId: string, oldPassword: string, newPassword: string): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: CHANGE_PASSWORD_MUTATION,
      variables: { userId, oldPassword, newPassword }
    }).pipe(
      map(result => result.data.changePassword),
      catchError(err => {
        console.error('Помилка зміни пароля:', err);
        // Прокидаємо помилку далі, щоб компонент міг показати текст помилки
        throw err; 
      })
    );
  }

  getCurrentUser() {
    // Твій GraphQL запит для отримання профілю
    return this.apollo.query<{ me: User }>({ query: GET_PROFILE, fetchPolicy: 'network-only' }).pipe(
      map(result => {
        if (!result.data || !result.data.me) {
          throw new Error('Профіль не знайдено');
        }
        return result.data.me
      }),
      catchError(err => {
        console.error('Помилка завантаження профіля:', err);
        throw err; 
      })
    );
  }


  handleAuthentication(token: string, user: User | null) {
    localStorage.setItem(this.TOKEN_KEY, token);
    
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.currentUserSubject.next(user);
    } else {
      // ЯКЩО ЮЗЕРА НЕМАЄ (як після Google), ЗАВАНТАЖУЄМО ЙОГО
      this.getCurrentUser().subscribe({
        next: (loadedUser) => {
          localStorage.setItem(this.USER_KEY, JSON.stringify(loadedUser));
          this.currentUserSubject.next(loadedUser);
        },
        error: (err) => console.error('Не вдалося завантажити профіль після Google:', err)
      });
    }
  }
 
}