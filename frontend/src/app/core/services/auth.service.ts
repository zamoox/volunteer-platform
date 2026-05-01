import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // URL твого бекенду (зміни на реальний, коли він буде)
  private readonly API_URL = 'https://api.your-volunteer-project.com/auth';

  // Стан користувача: зберігаємо дані про юзера (ім'я, роль тощо)
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  /**
   * Метод для входу
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/login`, { email, password }).pipe(
      tap(response => {
        // Якщо бекенд повертає { token: '...', user: {...} }
        if (response && response.token) {
          this.handleAuthentication(response.token, response.user);
        }
      })
    );
  }

  /**
   * Метод для реєстрації
   */
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/register`, userData).pipe(
      tap(response => {
        if (response && response.token) {
          this.handleAuthentication(response.token, response.user);
        }
      })
    );
  }

  /**
   * Вихід із системи
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Перевірка, чи залогінений користувач
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Отримання токена для інтерцептора
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Допоміжний метод для збереження даних після входу/реєстрації
   */
  private handleAuthentication(token: string, user: any): void {
    localStorage.setItem('auth_token', token);
    this.currentUserSubject.next(user);
  }
}