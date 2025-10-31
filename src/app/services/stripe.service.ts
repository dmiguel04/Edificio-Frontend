import { Injectable } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private stripePromise = loadStripe(environment.stripeKey);

  async getStripe(): Promise<Stripe | null> {
    return await this.stripePromise;
  }

  // helper to confirm card payment given client_secret and a card element
  async confirmCardPayment(clientSecret: string, cardElement: any) {
    const stripe = await this.getStripe();
    if (!stripe) throw new Error('Stripe no inicializado');
    return stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardElement } });
  }
}
