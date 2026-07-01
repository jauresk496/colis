import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { API_URL } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'auth_token';

  readonly token = signal<string | null>(this.getToken());

  constructor(private http: HttpClient) {}

  isAuthenticated(): boolean {
    return !!this.token();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
    this.token.set(token);
  }

  login(username: string, password: string) {
    const body = new HttpParams()
      .set('username', username)
      .set('password', password);

    return this.http.post<{ token: string }>(`${API_URL}/auth/login`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap((res) => this.setToken(res.token))
    );
  }

  logout(): void {
    this.setToken(null);
  }

  me() {
    return this.http.get<{ user: string | null; role: string | null; exp: number | null }>(`${API_URL}/auth/me`).pipe(
      map((x) => x)
    );
  }
}
