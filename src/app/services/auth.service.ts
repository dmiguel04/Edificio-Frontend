import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, timeout, catchError, of, map } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

interface LoginResponse {
  msg: string;
  username: string;
  access?: string;
  refresh?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isBrowser: boolean;
  private apiUrl = 'http://localhost:8000/api/usuarios';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  logout(): Observable<any> {
    console.log('=== LOGOUT ULTRA-OPTIMIZADO ANTI-BROKEN-PIPE ===');
    
    const refresh = this.getFromStorage('refresh');
    const access = this.getFromStorage('access');
    
    // 1. SIEMPRE limpiar tokens primero - logout local garantizado
    this.clearTokens();
    console.log('✅ Tokens limpiados - Logout local completado');
    
    // 2. Si no hay tokens, no hacer llamada al backend
    if (!refresh) {
      console.log('ℹ️ Sin refresh token - Logout completado sin backend');
      return of({ 
        msg: 'Logout exitoso',
        status: 'success',
        method: 'local_only'
      });
    }
    
    console.log('� Notificación express al backend (anti-broken-pipe)...');
    
    // 3. Headers optimizados para CORS y anti-broken-pipe
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
      // Removidos headers que pueden causar problemas de CORS
    };
    
    // 4. Solo refresh token (mínimo payload)
    const payload = { refresh };
    
    // 5. Configuración ultra-agresiva
    return this.http.post(`${this.apiUrl}/logout/`, payload, { 
      headers,
      observe: 'response' // Observar respuesta completa
    }).pipe(
      timeout(400), // Timeout ultra-agresivo 400ms
      tap((httpResponse: any) => {
        const response = httpResponse.body;
        console.log('✅ Backend notificado (anti-broken-pipe):', response);
        console.log(`🎯 HTTP Status: ${httpResponse.status}, Backend Status: ${response?.status}`);
      }),
      catchError((error) => {
        console.warn('⚠️ Backend error (NORMAL - logout ya completado):', error.message);
        
        // Identificar tipo de error específico
        let errorType = 'unknown';
        if (error.name === 'TimeoutError') {
          errorType = 'timeout';
        } else if (error.message && error.message.includes('CORS')) {
          errorType = 'cors';
          console.log('ℹ️ Error CORS detectado - común en desarrollo, logout local exitoso');
        } else if (error.status === 0) {
          errorType = 'network_or_cors';
          console.log('ℹ️ Error de red/CORS (status 0) - logout local exitoso');
        }
        
        // IMPORTANTE: El logout YA está completado localmente
        return of({ 
          msg: 'Logout exitoso',
          status: 'success',
          method: 'local_with_backend_error',
          backend_error: errorType,
          error_details: error.message,
          note: 'Logout completado exitosamente (error de backend/CORS ignorado)'
        });
      }),
      // Mapear respuesta HTTP a respuesta simple
      map((httpResponse: any) => {
        if (httpResponse.body) {
          return {
            msg: 'Logout exitoso',
            status: 'success',
            method: 'local_and_backend',
            backend_response: httpResponse.body
          };
        }
        return httpResponse;
      })
    );
  }

  private getFromStorage(key: string): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(key);
    }
    return null;
  }

  private setInStorage(key: string, value: string): void {
    if (this.isBrowser) {
      localStorage.setItem(key, value);
    }
  }

  private removeFromStorage(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    }
  }

  clearTokens(): void {
    this.removeFromStorage('access');
    this.removeFromStorage('refresh');
  }

  verifyEmail(token: string) {
    return this.http.get(`${this.apiUrl}/verify-email/${token}/`);
  }

  login(credentials: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/`, credentials);
  }

  loginWithUserPass(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/`, { username, password });
  }

  loginWithUserPassAdvanced(username: string, password: string, totpCode?: string): Observable<LoginResponse> {
    const body: any = { username, password };
    if (totpCode) body.totp_code = totpCode;
    
    // Debugging: log what we're sending
    console.log('=== LOGIN DEBUG ===');
    console.log('Username:', username);
    console.log('Password length:', password ? password.length : 0);
    console.log('Body being sent:', body);
    console.log('URL:', `${this.apiUrl}/login/`);
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/`, body);
  }

  validateToken(username: string, token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/validate-login-token/`, { username, token }).pipe(
      tap((resp: any) => {
        if (resp.access) {
          this.setInStorage('access', resp.access);
          this.setInStorage('refresh', resp.refresh);
        }
      })
    );
  }

  validateTokenCorreo(username: string, token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/validate-login-token/`, { username, token });
  }

  validateCodigo2FA(payload: { username: string; code: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/verify/`, payload);
  }

  checkAccountStatus(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/account-status/?username=${encodeURIComponent(username)}`);
  }

  activate2FA(): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/activate/`, {});
  }

  verify2FA(totpCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/verify/`, { totp_code: totpCode });
  }

  getAuditLog(): Observable<any> {
    return this.http.get(`${this.apiUrl}/audit/`);
  }

  getRawQuery(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/raw/?username=${encodeURIComponent(username)}`);
  }

  isStrongPassword(password: string, username?: string, email?: string): boolean {
    if (!password || password.length < 8) return false;
    if (username && password.toLowerCase().includes(username.toLowerCase())) return false;
    if (email && password.toLowerCase().includes(email.toLowerCase())) return false;
    return /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    const token = this.getFromStorage('access');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp < currentTime) {
        this.clearTokens();
        return false;
      }
      return true;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  getUserFromToken(): any {
    const token = this.getFromStorage('access');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.user_id,
        username: payload.username,
        email: payload.email,
        exp: payload.exp
      };
    } catch (error) {
      return null;
    }
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

  verificarEmail(email: string, codigo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verificar-email/`, { 
      email: email, 
      codigo: codigo 
    });
  }

  reenviarVerificacion(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reenviar-verificacion/`, { 
      email: email 
    });
  }
}
