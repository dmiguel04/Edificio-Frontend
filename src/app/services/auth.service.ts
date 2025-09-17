interface LoginResponse {
  msg: string;
  username: string;
  access?: string;
  refresh?: string;
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Logout: elimina tokens y (opcional) notifica al backend para blacklisting
   */
  logout(): void {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    // Si tienes endpoint de logout para blacklisting:
    // this.http.post(`${this.apiUrl}/logout/`, { refresh: localStorage.getItem('refresh') }).subscribe();
  }
  /**
   * Valida el token recibido por correo
   */
  validateTokenCorreo(username: string, token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/validate-login-token/`, { username, token });
  }

  /**
   * Valida el código 2FA del autenticador
   */
  validateCodigo2FA(payload: { username: string; code: string }): Observable<any> {
    // El backend espera username y code
    return this.http.post(`${this.apiUrl}/2fa/verify/`, payload);
  }
  private apiUrl = 'http://localhost:8000/api/usuarios';

  constructor(private http: HttpClient) {}

  verifyEmail(token: string) {
    return this.http.get(`${this.apiUrl}/verify-email/${token}/`);
  }

  login(credentials: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/`, credentials);
  }

  /** Nuevo login con username y password sueltos */
  loginWithUserPass(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/`, { username, password });
  }

  /**
   * Login avanzado: maneja errores de cuenta bloqueada y 2FA
   */
  loginWithUserPassAdvanced(username: string, password: string, totpCode?: string): Observable<LoginResponse> {
    const body: any = { username, password };
    if (totpCode) body.totp_code = totpCode;
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/`, body);
  }

  validateToken(username: string, token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/validate-login-token/`, { username, token }).pipe(
      tap((resp: any) => {
        if (resp.access) {
          localStorage.setItem('access', resp.access);
          localStorage.setItem('refresh', resp.refresh);
        }
      })
    );
  }

  /**
   * Verifica si la cuenta está bloqueada (por fuerza bruta)
   */
  checkAccountStatus(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/account-status/?username=${encodeURIComponent(username)}`);
  }

  /**
   * Activa 2FA para el usuario actual
   */
  activate2FA(): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/activate/`, {});
  }

  /**
   * Verifica el código TOTP de 2FA
   */
  verify2FA(totpCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/verify/`, { totp_code: totpCode });
  }

  /**
   * Consulta auditoría de eventos del usuario
   */
  getAuditLog(): Observable<any> {
    return this.http.get(`${this.apiUrl}/audit/`);
  }

  /**
   * Consulta el endpoint raw seguro (solo para pruebas)
   */
  getRawQuery(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/raw/?username=${encodeURIComponent(username)}`);
  }

  /**
   * Valida si una contraseña es fuerte (puedes usar una expresión regular aquí también)
   */
  isStrongPassword(password: string, username?: string, email?: string): boolean {
    if (!password || password.length < 8) return false;
    if (username && password.toLowerCase().includes(username.toLowerCase())) return false;
    if (email && password.toLowerCase().includes(email.toLowerCase())) return false;
    // Debe tener mayúscula, minúscula, número y símbolo
    return /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  }


  isLoggedIn(): boolean {
    return !!localStorage.getItem('access');
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
