import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanzasService } from '../finanzas.service';
import { environment } from '../../../../src/environments/environment';
import { loadStripe } from '@stripe/stripe-js';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent implements OnInit {
  loading = false;
  errorMessage = '';

  constructor(private finanzas: FinanzasService) {}

  async ngOnInit() {
    this.loading = true;
    try {
      // Crear sesión en el backend que retorne un session_id o clientSecret según implementación
      const resp: any = await this.finanzas.createCheckoutSession({}).toPromise();
      // La implementación de backend puede devolver { session_id } o { clientSecret }
      const sessionId = resp.session_id || resp.sessionId;
      const clientSecret = resp.clientSecret || resp.client_secret;

      // Inicializar Stripe
      const stripe = await loadStripe(environment.stripeKey as string);
      if (!stripe) throw new Error('No se pudo inicializar Stripe');

      if (typeof (stripe as any).initEmbeddedCheckout === 'function') {
        // Usar Embedded Checkout
        const fetchClientSecret = async () => {
          // Backend debería exponer un endpoint que devuelva clientSecret por session
          if (clientSecret) return clientSecret;
          // Si el backend devuelve session_id, consultamos su client secret en otro endpoint
          const r = await fetch(`${environment.apiBase.replace(/\/api\/finanzas$/, '')}/api/finanzas/session-client-secret/?session_id=${encodeURIComponent(sessionId)}`, { method: 'GET' });
          const j = await r.json();
          return j.clientSecret || j.client_secret;
        };

        const checkout = await (stripe as any).initEmbeddedCheckout({ fetchClientSecret });
        checkout.mount('#checkout');
      } else if (sessionId) {
        // Fallback: si backend devuelve session_id y usamos Checkout (redirect)
        // redirigir a la página de Checkout en el servidor o a la URL proporcionada
        if (resp.url) {
          window.location.href = resp.url;
        } else {
          // construir URL local de retorno si aplica
          window.location.href = `/finanzas/checkout-return?session_id=${encodeURIComponent(sessionId)}`;
        }
      } else {
        throw new Error('Respuesta inesperada del servidor para iniciar checkout');
      }
    } catch (err: any) {
      this.errorMessage = err && err.message ? err.message : String(err);
    } finally {
      this.loading = false;
    }
  }
}
