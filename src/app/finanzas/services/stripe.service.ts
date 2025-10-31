import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise: Promise<Stripe | null>;

  constructor(private http: HttpClient) {
    // environment.ts defines `stripeKey` and `apiBase`.
    this.stripePromise = loadStripe(environment.stripeKey as string);
  }

  /**
   * Devuelve la promesa interna de Stripe para usar desde componentes.
   * Mantener la propiedad privada pero ofrecer un getter público es más seguro
   * que acceder a la propiedad con indexer desde componentes.
   */
  getStripe(): Promise<Stripe | null> {
    return this.stripePromise;
  }

  createPaymentIntent(amount: number, currency: string = 'usd'): Observable<any> {
    return this.http.post(`${environment.apiBase}/create-payment-intent/`, { amount, currency });
  }

  async confirmCardPayment(clientSecret: string, cardElement: any) {
    const stripe = await this.stripePromise;
    if (!stripe) {
      throw new Error('Stripe.js failed to load');
    }
    return stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      }
    });
  }
}
