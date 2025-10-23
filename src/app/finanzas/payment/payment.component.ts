import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FinanzasService } from '../finanzas.service';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, NgIf],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  stripe: Stripe | null = null;
  elements: any = null;
  paymentElement: any = null;
  loading = false;
  errorMessage = '';
  successMessage: string | null = null;

  // state
  selectedMethod = 'card';
  lastResponse: any = null;
  qrImageUrl: string | null = null;
  authUrl: string | null = null;
  nextActionType: string | null = null;

  constructor(private finanzasService: FinanzasService) {}

  ngOnInit() {
    // crear PaymentIntent inicial con método por defecto
    this.createIntent(this.selectedMethod);
  }

  createIntent(method: string) {
    this.loading = true;
    this.errorMessage = '';
    this.qrImageUrl = null;
    this.authUrl = null;
    this.nextActionType = null;
    this.lastResponse = null;

    this.finanzasService.createPaymentIntent({ amount: 1000, currency: 'usd', payment_method_types: [method] }).subscribe(
      async (response: any) => {
        this.lastResponse = response;
        try {
          const clientSecret = response.client_secret || response.clientSecret || response.client_secret;
          const nextAction = response.next_action || response.nextAction || null;

          if (nextAction) {
            if ((nextAction as any).qr_code) {
              this.nextActionType = 'qr_code';
              this.qrImageUrl = (nextAction as any).qr_code.image_url_png || (nextAction as any).qr_code.image_url_svg || null;
              this.loading = false;
              return;
            }

            const mobileUrl = (nextAction as any).mobile_auth_url || (nextAction as any).mobileAuthUrl;
            const hostedUrl = (nextAction as any).hosted_instructions_url || (nextAction as any).hostedInstructionsUrl;
            const urlToOpen = mobileUrl || hostedUrl || null;
            if (urlToOpen) {
              this.nextActionType = mobileUrl ? 'mobile_auth' : 'hosted_instructions';
              this.authUrl = urlToOpen;
              try { window.open(urlToOpen, '_blank'); } catch (e) { /* ignore */ }
              this.loading = false;
              return;
            }
          }

          if (!clientSecret) throw new Error('Client secret no disponible del servidor');

          this.stripe = await loadStripe(environment.stripeKey as string);
          if (!this.stripe) throw new Error('No se pudo inicializar Stripe');

          try { if (this.paymentElement) this.paymentElement.unmount(); } catch (e) { /* ignore */ }

          this.elements = this.stripe.elements({ clientSecret });
          this.paymentElement = this.elements.create('payment');
          this.paymentElement.mount('#payment-element');
        } catch (err: any) {
          this.errorMessage = 'Error al inicializar el pago: ' + (err && err.message ? err.message : String(err));
          console.error(err);
        } finally {
          this.loading = false;
        }
      },
      (error) => {
        this.errorMessage = 'Error al inicializar el pago: ' + (error && error.message ? error.message : String(error));
        this.loading = false;
      }
    );
  }

  onMethodChange(method: string) {
    this.selectedMethod = method;
    this.createIntent(method);
  }

  async handleSubmit() {
    if (!this.stripe || !this.elements) {
      this.errorMessage = 'Stripe no está inicializado correctamente.';
      return;
    }

    this.loading = true;
    try {
      const result = await this.stripe.confirmPayment({ elements: this.elements, redirect: 'if_required' });

      if ((result as any).error) {
        this.errorMessage = (result as any).error.message || 'Error en la confirmación del pago';
        return;
      }

      const pi = (result as any).paymentIntent;
      if (pi && (pi.status === 'succeeded' || pi.status === 'processing')) {
        this.successMessage = 'Pago completado. Gracias — su pago se ha procesado correctamente.';
        try { this.paymentElement.unmount(); } catch (e) { /* ignore */ }
      } else if (pi && pi.status) {
        this.successMessage = `Estado del pago: ${pi.status}`;
      }
    } catch (err: any) {
      this.errorMessage = err && err.message ? err.message : String(err);
    } finally {
      this.loading = false;
    }
  }
}