import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs'; // Додали 'of'
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private readonly API_URL = 'https://api.your-volunteer-project.com/auth';

  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private getUserFromStorage(): any {
    const savedUser = localStorage.getItem('user_data');
    return savedUser ? JSON.parse(savedUser) : null;
  }

  /**
   * Тимчасовий метод для тестування з Dummy User
   */
  login(email: string, password: string): Observable<any> {
    // Створюємо фейкову відповідь від сервера
    const dummyResponse = {
      token: 'fake-jwt-token-12345',
      user: {
        name: 'Благодійний Фонд "Світло"',
        email: email, // беремо той, що ввели
        region: 'Київська',
        city: 'Київ',
        userType: 'organization' // Спробуй змінити на 'individual' для тесту
      }
    };

    // Симулюємо запит до сервера за допомогою 'of'
    return of(dummyResponse).pipe(
      tap(response => {
        this.handleAuthentication(response.token, response.user);
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
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private handleAuthentication(token: string, user: any): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}