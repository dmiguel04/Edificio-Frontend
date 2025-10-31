import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    // New backend tests expect a paginated list under /payments/list/
    return this.http.get<any>(`${this.base}/payments/list/${qs}`);
  }

  // Get canonical payment status (by id). Prefer backend to support GET /payments/?id=... or /payments/{id}/
  getPaymentStatus(paymentId: any): Observable<any> {
    // Prefer explicit status endpoint (used by backend tests): /payments/<id>/status/
    return this.http.get<any>(`${this.base}/payments/${encodeURIComponent(paymentId)}/status/`);
  }

  /**
   * Obtener monto por defecto (por ejemplo, deuda pendiente) desde backend.
   * Endpoint hipotético: GET /pending-amount/
   */
  getDefaultPayment(): Observable<any> {
    return this.http.get<any>(`${this.base}/pending-amount/`);
  }

  // Crear una reserva en el backend (serializador ReservaViewSet.create)
  // El backend acepta 'pay_now' boolean para intentar crear PaymentIntent inmediatamente.
  createReservation(payload: any): Observable<any> {
    // Use absolute backend URL so requests go to the API server (not the SSR host)
    // and send credentials in case backend uses session cookies.
    return this.http.post<any>(`http://localhost:8000/api/reservas/`, payload, { withCredentials: true });
  }

  // Obtener lista de áreas públicas (AreaComun). Endpoint RESTReadOnly del backend.
  getAreas(): Observable<any> {
    // During server-side rendering we must not perform network calls to
    // relative API endpoints because the prerender server doesn't proxy
    // those routes. Return an empty list while prerendering and only
    // attempt real requests in the browser.
    if (typeof window === 'undefined') {
      return of([]);
    }

    // Use the API backend host explicitly in the browser so requests
    // go to the backend (not to the SSR host).
    return this.http.get<any>(`http://localhost:8000/api/areas/`).pipe(
      catchError(() => this.http.get<any>(`http://localhost:8000/api/area-comun/`)),
      catchError(() => this.http.get<any>(`http://localhost:8000/api/areas-comunes/`)),
      catchError(() => of([]))
    );
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

  listInvoices(params: any = {}): Observable<any> {
    const qs = Object.keys(params).length ? ('?' + Object.entries(params).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as any)}`).join('&')) : '';
    return this.http.get<any>(`${this.base}/invoices/${qs}`);
  }

  // Descargar el PDF de una factura por id usando HttpClient con responseType 'blob'
  downloadInvoice(invoiceId: any) {
    const url = `${this.base}/invoices/${invoiceId}/download/`;
    // Devolver Observable<Blob> para que el componente gestione la descarga
    return this.http.get(url, { responseType: 'blob' });
  }

  // Descargar paquete/archivo asociado a una nómina si el backend lo expone
  downloadPayroll(payrollId: any) {
    const url = `${this.base}/payroll/${payrollId}/download/`;
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
            setTimeout(() => attempt(tryCount + 1), retryDelayMs * tryCount);
            return;
          }

          const text = await resp.text().catch(() => null);
          subscriber.error({ status: resp.status, message: resp.statusText, body: text });
        }).catch((err) => {
          subscriber.error(err);
        });
      };

      attempt(1);
    });
  }

  // Descargar un recibo/archivo asociado a un pago si el backend lo expone
  downloadPaymentReceipt(paymentId: any) {
    const url = `${this.base}/payments/${paymentId}/download/`;
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
            setTimeout(() => attempt(tryCount + 1), retryDelayMs * tryCount);
            return;
          }

          const text = await resp.text().catch(() => null);
          subscriber.error({ status: resp.status, message: resp.statusText, body: text });
        }).catch((err) => {
          subscriber.error(err);
        });
      };

      attempt(1);
    });
  }

  // Comprobar si el endpoint de descarga está disponible para un pago (HEAD)
  checkPaymentReceiptAvailable(paymentId: any) {
    const url = `${this.base}/payments/${paymentId}/download/`;

    return new Observable<boolean>((subscriber) => {
      try {
        const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('access') : null;
        fetch(url, {
          method: 'HEAD',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }).then((resp) => {
          // resp.ok true for 2xx, treat 200/204 as available
          subscriber.next(resp.ok);
          subscriber.complete();
        }).catch((err) => {
          // On network errors assume not available
          subscriber.next(false);
          subscriber.complete();
        });
      } catch (e) {
        subscriber.next(false);
        subscriber.complete();
      }
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

  // Create subscription for customer (backend handles Stripe secret)
  createSubscription(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/subscriptions/`, payload);
  }

  // Crear un PaymentIntent para una factura específica
  createInvoicePaymentIntent(invoiceId: any, body: any = {}): Observable<any> {
    const url = `${this.base}/invoices/${encodeURIComponent(invoiceId)}/create-payment-intent/`;
    return this.http.post<any>(url, body, { withCredentials: true });
  }

  // Request refund (admin-protected). Payload: { payment_intent, amount_cents }
  requestRefund(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/refunds/`, payload);
  }

  listPayrolls(): Observable<any> {
    return this.http.get<any>(`${this.base}/payroll/`);
  }

  // Confirm a mock payment (useful for local/dev backends that expose a mock confirm endpoint)
  confirmMockPayment(paymentId: number) {
    // Keep style consistent: return an Observable from HttpClient
    return this.http.post<any>(`${this.base}/mock-confirm/`, { payment_id: paymentId });
  }

  // Obtener reservas (filtrable por area_comun, fecha desde/hasta, etc.)
  // Usa la colección de reservas expuesta en el backend: GET /api/reservas/
  getReservations(params: any = {}): Observable<any> {
    const qs = Object.keys(params).length ? ('?' + Object.entries(params).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as any)}`).join('&')) : '';
    // Use absolute backend URL and include credentials in case sessions are required
    return this.http.get<any>(`http://localhost:8000/api/reservas/${qs}`, { withCredentials: true });
  }
}
