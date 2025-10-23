import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:8000/api/usuarios';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getUsers(params: any = {}): Observable<any> {
    // Endpoint corregido: API de gestión de usuarios
    const base = 'http://localhost:8000/api/gestion-usuarios/usuarios/';
    const qs = Object.keys(params).length
      ? ('?' + Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as any)}`).join('&'))
      : '';
    return this.http.get<any>(`${base}${qs}`);
  }

  /**
   * Obtener información del usuario actual (si el backend expone /me/)
   * Si no existe, el frontend puede depender del token.
   */
  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me/`);
  }

  getUserById(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/`);
  }

  createUser(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/`, data);
  }

  assignRole(userId: number, role: string): Observable<any> {
    // El backend espera el campo 'rol' en español y normalmente valores en minúsculas
    const rolPayload = { rol: (role || '').toString().toLowerCase() };
    return this.http.post<any>(`${this.apiUrl}/${userId}/assign-role/`, rolPayload);
  }

  setActive(userId: number, activo: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${userId}/set-active/`, { activo });
  }

  changePassword(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password/`, payload);
  }
}
