// ...existing code...
// ...existing code...
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/usuarios'; // Cambia esto por la URL de tu backend

  constructor(private http: HttpClient) {}

  verifyEmail(token: string) {
    return this.http.get(`${this.apiUrl}/verify-email/${token}/`);
  }

  login(credentials: { username: string; password: string }) {
  return this.http.post(`${this.apiUrl}/login/`, credentials);
}

register(data: any) {
  return this.http.post(`${this.apiUrl}/register/`, data);
}

forgotPassword(email: string) {
  return this.http.post(`${this.apiUrl}/forgot-password/`, { email });
}

  resetPassword(token: string, newPassword: string) {
    return this.http.post(`${this.apiUrl}/reset-password/`, { token, new_password: newPassword });
  }
}
