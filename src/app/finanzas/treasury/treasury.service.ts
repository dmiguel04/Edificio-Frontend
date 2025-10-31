import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TreasuryService {
  // Point to backend Django API
  private base = 'http://localhost:8000/api/finanzas';

  constructor(private http: HttpClient) {}

  // Create connected account + financial account
  createAccount(): Observable<any> {
    return this.http.post<any>(`${this.base}/crear_cuenta_financiera/`, {});
  }

  // Create a card via backend
  crearTarjeta(payload: { tipo: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/crear_tarjeta/`, payload);
  }

  // Obtener saldo de la cuenta financiera del usuario
  obtenerSaldo(): Observable<any> {
    return this.http.get<any>(`${this.base}/obtener_saldo/`);
  }

  // Transferir fondos
  transferirFondos(payload: { destination_payment_method: string; monto: number; descripcion?: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/transferir_fondos/`, payload);
  }

  // Listar transacciones y sincronizar
  listarTransacciones(): Observable<any> {
    return this.http.get<any>(`${this.base}/listar_transacciones/`);
  }
}
