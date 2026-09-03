import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { appConfig } from '../config/app-config';
import { LoginRequest, LoginResponse } from '../models/auth.model';

const SESSION_KEY = 'imobiliaria_admin_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = appConfig.apiUrl;

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, request)
      .pipe(tap((response) => this.saveSession(response)));
  }

  getSession(): LoginResponse | null {
    const rawSession = localStorage.getItem(SESSION_KEY);

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as LoginResponse;
    } catch {
      this.logout();
      return null;
    }
  }

  getToken(): string | null {
    return this.getSession()?.token ?? null;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  private saveSession(response: LoginResponse): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(response));
  }
}
