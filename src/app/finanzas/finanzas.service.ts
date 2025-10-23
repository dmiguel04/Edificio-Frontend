import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FinanzasService {
  private base = 'http://localhost:8000/api/finanzas';

  constructor(private http: HttpClient) {}

  createCustomer(): Observable<any> {
    return this.http.post<any>(`${this.base}/create-customer/`, {});
  }

  createPaymentIntent(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/create-payment-intent/`, payload);
  }

  // Crear una sesión para Embedded Checkout (backend debe exponer este endpoint)
  createCheckoutSession(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/create-checkout-session/`, payload);
  }

  // Obtener estado de una sesión de checkout por session_id
  getSessionStatus(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/session-status/?session_id=${encodeURIComponent(sessionId)}`);
  }

  getPayments(params: any = {}): Observable<any> {
    const qs = Object.keys(params).length ? ('?' + Object.entries(params).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as any)}`).join('&')) : '';
    // The backend returns a list of payments (array)
    return this.http.get<any>(`${this.base}/payments/${qs}`);
  }

  registerManual(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/payments/manual/`, payload);
  }

  getGateways(): Observable<any> {
    return this.http.get<any>(`${this.base}/gateways/`);
  }

  createInvoice(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/invoices/`, payload);
  }

  // Intenta descargar el PDF de una factura por id (si el backend provee endpoint)
  downloadInvoice(invoiceId: any) {
    // Usar fetch directo para poder setear responseType blob y Authorization header fácilmente
    const url = `${this.base}/invoices/${invoiceId}/download/`;
    const maxRetries = 3;
    const retryDelayMs = 1000;

    return new Observable<Blob>((subscriber) => {
      const attempt = (tryCount: number) => {
        const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('access') : null;
        fetch(url, {
          method: 'GET',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }).then(async (resp) => {
          if (resp.ok) {
            const blob = await resp.blob();
            subscriber.next(blob);
            subscriber.complete();
            return;
          }

          if (resp.status === 404 && tryCount < maxRetries) {
            // Esperar y reintentar (backoff simple)
            setTimeout(() => attempt(tryCount + 1), retryDelayMs * tryCount);
            return;
          }

          // Otros errores: emitir error con detalle
          const text = await resp.text().catch(() => null);
          subscriber.error({ status: resp.status, message: resp.statusText, body: text });
        }).catch((err) => {
          subscriber.error(err);
        });
      };

      attempt(1);
    });
  }

  // Obtener detalle de una factura
  getInvoice(invoiceId: any) {
    return this.http.get<any>(`${this.base}/invoices/${invoiceId}/`);
  }

  // Construir URL a la vista detalle (útil como fallback si no hay download endpoint)
  getInvoiceUrl(invoiceId: any) {
    return `${this.base}/invoices/${invoiceId}/`;
  }

  applyOverdue(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/overdue/charge/`, payload);
  }

  createPayroll(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/payroll/`, payload);
  }
}
