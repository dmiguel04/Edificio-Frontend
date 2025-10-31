import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { StripeService } from '../services/stripe.service';
import { FinanzasService } from '../finanzas.service';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, NgIf, RouterModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent implements OnInit, OnDestroy {
  clientSecret = '';
  card: any;
  elements: any;
  loading = false;
  errorMessage = '';
  amount: number | null = null; // start empty (dollars)
  description = '';
  lastIntentResp: any = null;
  reservation: any = null; // hold reservation/default payment info
  // Invoice flow
  isInvoiceFlow = false;
  invoiceId: any = null;
  // mock/debug invoice flow
  isMockMode = false;
  mockConfirmUrl: string | null = null;
  amount_display: string | null = null;
  status_label: string | null = null;
  // gateways: array of { id, label }
  gateways: Array<{ id: string; label: string }> = [];
  selectedGateway: string | null = null;
  private stripeInstance: any = null;
  cardMounted = false;
  // Abort controller to cancel polling when component destroyed
  private pollingAbortController: AbortController | null = null;
  private destroyed = false;
  private readonly MAX_POLL_ATTEMPTS = 12;
  private readonly POLL_BASE_MS = 2000;
  private readonly CARD_MOUNT_MAX_ATTEMPTS = 10;

  constructor(
    private stripeService: StripeService,
    private finanzasService: FinanzasService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // helper used from template because arrow functions aren't allowed there
  get onlyCardAvailable(): boolean {
    return !!(this.gateways && this.gateways.length > 0 && this.gateways.every(g => g.id === 'card'));
  }

  async ngOnInit() {
    // fetch stripe instance lazily and gateway/reservation data
    const stripe = await this.stripeService.getStripe();
    if (!stripe) {
      this.errorMessage = 'No se pudo inicializar Stripe en este navegador.';
      // continue, some flows may redirect to external Checkout
    } else {
      this.stripeInstance = stripe;
    }

    // If navigated here with a reservation (from reservation flow), use Router state (SSR-safe)
    try {
      const navState: any = (this.router && (this.router as any).getCurrentNavigation && (this.router as any).getCurrentNavigation()?.extras?.state) || null;
      if (navState && navState.reservation) {
        this.reservation = navState.reservation;
        if (navState.amount != null) this.amount = navState.amount;
        this.selectedGateway = this.reservation?.recommended_method || this.selectedGateway || 'card';
        if (this.selectedGateway === 'card') this.ensureCardMounted();
        // inform OnPush change detection
        try { this.cdr.markForCheck(); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      // ignore if router introspection not present
    }

    // If opened via link with ?invoice_id=..., start invoice flow (browser only)
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        const params = new URLSearchParams(window.location.search || '');
        const inv = params.get('invoice_id') || params.get('invoice') || null;
        if (inv) {
          this.isInvoiceFlow = true;
          this.invoiceId = inv;
          await this.initInvoiceIntent(inv);
          try { this.cdr.markForCheck(); } catch (e) { /* ignore */ }
        }
      }
    } catch (e) {
      console.warn('Invoice init error', e);
    }

    // Fetch default payment/reservation and gateways in parallel
    try {
      const [defResp, gwResp] = await Promise.all([
        firstValueFrom(this.finanzasService.getDefaultPayment()),
        firstValueFrom(this.finanzasService.getGateways())
      ]);

      if (defResp) this.applyDefaultPayment(defResp);

  this.gateways = this.normalizeGateways(gwResp);
  this.selectedGateway = this.reservation?.recommended_method || (this.gateways.length ? this.gateways[0].id : 'card');
  if (this.selectedGateway === 'card') this.ensureCardMounted();
  try { this.cdr.markForCheck(); } catch (e) { /* ignore */ }
    } catch (e) {
      this.gateways = [{ id: 'card', label: 'Tarjeta' }];
      this.selectedGateway = 'card';
    }
  }

  // Called when user switches gateway radio; called from template
  onGatewayChange(gwId: string) {
    this.selectedGateway = gwId;
    if (gwId === 'card') {
      this.ensureCardMounted();
    } else {
      // unmount card if present to avoid stray focus/iframes
      if (this.card && this.cardMounted) {
        try { this.card.unmount(); } catch (e) { /* ignore */ }
        this.cardMounted = false;
      }
    }
  }

  // lazily create and mount the Stripe Card element
  async ensureCardMounted() {
    if (!this.stripeInstance) {
      this.stripeInstance = await this.stripeService.getStripe();
      if (!this.stripeInstance) return;
    }
    try {
      if (!this.elements) this.elements = this.stripeInstance.elements();
      if (!this.card) this.card = this.elements.create('card');
      if (!this.cardMounted) {
        // try mounting with bounded attempts to avoid infinite recursion
        let attempts = 0;
        const tryMount = () => {
          if (this.destroyed) return;
          const node = typeof document !== 'undefined' ? document.getElementById('card-element') : null;
          if (node) {
            try {
              this.card.mount('#card-element');
              this.cardMounted = true;
              try { this.cdr.markForCheck(); } catch (e) { /* ignore */ }
            } catch (e) {
              console.warn('mount card failed', e);
            }
          } else if (attempts < this.CARD_MOUNT_MAX_ATTEMPTS) {
            attempts += 1;
            setTimeout(tryMount, 50);
          } else {
            console.warn('Card mount aborted after max attempts');
          }
        };
        requestAnimationFrame(tryMount);
      }
    } catch (e) {
      console.warn('Stripe element init error', e);
    }
  }

  // crea PaymentIntent y confirma con Stripe (tarjeta) o redirige a Checkout para métodos no-card
  async pay() {
    if (!this.amount || Number(this.amount) <= 0) {
      this.errorMessage = 'Ingresa un monto válido antes de pagar.';
      return;
    }

    this.loading = true;
    try {
      // Non-card path: create Checkout Session and redirect
      if (this.selectedGateway && this.selectedGateway !== 'card') {
        const items = (this.reservation?.items || []).map((it: any) => ({
          price_data: {
            currency: this.reservation?.currency || 'usd',
            unit_amount: it.unit_amount_cents ?? it.line_total_cents ?? Math.round((it.unit_amount ?? 0) * 100),
            product_data: { name: it.title || it.name || 'Item' }
          },
          quantity: it.quantity || 1
        }));

        const payload: any = {
          line_items: items,
          success_url: window.location.origin + '/finanzas/payment/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: window.location.origin + '/finanzas/payment/failed',
          payment_method_types: [this.selectedGateway],
          customer_email: this.reservation?.customer_email || this.reservation?.email || undefined,
          metadata: { reservation_id: this.reservation?.reservation_id }
        };

        try {
          const resp: any = await firstValueFrom(this.finanzasService.createCheckoutSession(payload));
          if (resp && resp.url) {
            try { window.location.href = resp.url; } catch (e) { window.open(resp.url, '_blank'); }
            return;
          }
        } catch (err: any) {
          this.errorMessage = err?.error?.error || err?.message || 'Error iniciando Checkout.';
          this.loading = false;
          return;
        }
      }

      // Card path: create or reuse intent
      let intentResp: any = this.isInvoiceFlow && this.lastIntentResp ? this.lastIntentResp : null;
      if (!intentResp) {
        const payload = { amount: Math.round((this.amount ?? 0) * 100), currency: this.reservation?.currency || 'usd', description: this.description };
        try {
          intentResp = await firstValueFrom(this.finanzasService.createPaymentIntent(payload));
        } catch (err: any) {
          this.errorMessage = err?.error?.error || err?.error?.detail || err?.message || 'Error creando el pago';
          this.loading = false;
          return;
        }
      }

      this.clientSecret = intentResp?.client_secret || '';
      this.lastIntentResp = intentResp;

      // If backend signalled this is a mock payment, call the backend mock-confirm endpoint
      const paymentId = intentResp?.payment_id || intentResp?.id || intentResp?.paymentId || null;
      if (intentResp?.mock || intentResp?.mock_confirm_url) {
        try {
          const respMock: any = await firstValueFrom(this.finanzasService.confirmMockPayment(paymentId));
          if (respMock && respMock.status === 'succeeded') {
            // attempt to get canonical transaction id
            let canonical: any = null;
            if (paymentId) {
              try { canonical = await firstValueFrom(this.finanzasService.getPaymentStatus(paymentId)); } catch (e) { canonical = null; }
            }
            const transactionId = canonical?.transaction_id || respMock?.transaction_id || paymentId;
            this.router.navigate(['/finanzas/payment/success'], { state: { transactionId, email: respMock?.customer_email || intentResp?.customer_email } });
            this.loading = false;
            return;
          }
          // fallback: poll
          if (paymentId) {
            await this.pollPaymentStatus(paymentId);
            this.loading = false;
            return;
          }
        } catch (err: any) {
          this.errorMessage = err?.error || err?.message || 'Error confirmando pago (mock)';
          this.loading = false;
          return;
        }
      }

      // Safety: ensure clientSecret looks valid before calling Stripe
      if (!this.isValidClientSecret(this.clientSecret)) {
        this.errorMessage = 'El client_secret no es válido para confirmar con Stripe. Evitando llamada a Stripe.js.';
        console.error(this.errorMessage, { clientSecret: this.clientSecret, intentResp });
        if (paymentId) await this.pollPaymentStatus(paymentId);
        this.loading = false;
        return;
      }

      // Debug: masked publishable key
      try {
        const env = (await import('../../../environments/environment')).environment;
        const pub = env?.stripeKey ? String(env.stripeKey) : null;
        const masked = pub ? (pub.substr(0,8) + '...' + pub.substr(pub.length-8)) : null;
        console.log('Calling Stripe.confirmCardPayment (checkout) with clientSecret present, publishable key (masked):', !!this.clientSecret, masked);
      } catch (e) {}

  const result = await this.stripeService.confirmCardPayment(this.clientSecret, this.card);

      if (result?.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // extract transactionId and email where possible
        let transactionId = this.lastIntentResp?.transaction_id || null;
        let customerEmail = this.lastIntentResp?.customer_email || null;
        try {
          const piAny: any = result.paymentIntent as any;
          const charges = piAny.charges?.data;
          if (!transactionId && Array.isArray(charges) && charges.length) {
            transactionId = charges[0].id || transactionId;
          }
          if (!customerEmail && charges && charges[0] && charges[0].billing_details) {
            customerEmail = charges[0].billing_details.email || customerEmail;
          }
        } catch (e) { /* ignore */ }

        this.router.navigate(['/finanzas/payment/success'], { state: { transactionId, email: customerEmail } });
        this.loading = false;
        return;
      }

      const fallbackPaymentId = this.lastIntentResp?.payment_id || this.lastIntentResp?.id || this.lastIntentResp?.paymentId || null;
      if (fallbackPaymentId) {
        await this.pollPaymentStatus(fallbackPaymentId);
        this.loading = false;
        return;
      }

      this.router.navigate(['/finanzas/payment/failed']);
      this.loading = false;
    } catch (err: any) {
      console.error('Payment error', err);
      this.errorMessage = err?.message || 'Error procesando el pago.';
      this.loading = false;
    }
  }

  // Poll payment status until succeeded or timeout
  async pollPaymentStatus(paymentId: string) {
    const maxAttempts = this.MAX_POLL_ATTEMPTS;
    this.pollingAbortController?.abort();
    this.pollingAbortController = new AbortController();
    const signal = this.pollingAbortController.signal;

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      if (this.destroyed || signal.aborted) return; // stop if component destroyed
      try {
        const resp: any = await firstValueFrom(this.finanzasService.getPaymentStatus(paymentId));
        const status = resp?.status || resp?.payment_status || null;
        if (status === 'succeeded' || status === 'paid' || status === 'complete') {
          const transactionId = resp?.transaction_id || resp?.stripe_charge_id || resp?.stripe_payment_intent || null;
          const email = resp?.customer_email || resp?.email || null;
          this.router.navigate(['/finanzas/payment/success'], { state: { transactionId, email } });
          return;
        }
      } catch (e) {
        // ignore transient errors and retry
      }
      const delay = Math.min(this.POLL_BASE_MS * Math.pow(1.5, attempts), 10000);
      await new Promise(r => setTimeout(r, delay));
    }
    if (!this.destroyed) this.router.navigate(['/finanzas/payment/failed']);
  }

  ngOnDestroy() {
    this.destroyed = true;
    if (this.card) {
      try { this.card.unmount(); } catch (e) { /* ignore */ }
    }
    if (this.pollingAbortController) {
      try { this.pollingAbortController.abort(); } catch (e) { /* ignore */ }
      this.pollingAbortController = null;
    }
    // release element refs
    try { this.elements = null; } catch (e) { /* ignore */ }
    try { this.card = null; } catch (e) { /* ignore */ }
  }

  // Initialize invoice intent when arriving with invoice_id
  private async initInvoiceIntent(invId: any) {
    try {
      this.loading = true;
      const resp: any = await firstValueFrom(this.finanzasService.createInvoicePaymentIntent(invId, {}));
      if (resp) {
        this.lastIntentResp = resp;
        // Resolve client_secret robustly following preferred paths
        const tryPaths: Array<{ path: string; value: any }> = [];
        tryPaths.push({ path: 'resp.client_secret', value: resp?.client_secret });
        tryPaths.push({ path: 'resp.payment_intent && resp.payment_intent.client_secret', value: resp?.payment_intent && resp.payment_intent.client_secret });
        tryPaths.push({ path: 'resp._payment && resp._payment.client_secret', value: resp?._payment && resp._payment.client_secret });
        tryPaths.push({ path: 'resp.payment_intent?.client_secret', value: resp?.payment_intent?.client_secret });

        let resolved: string | null = null;
        let resolvedPath: string | null = null;
        for (const p of tryPaths) {
          if (p.value) { resolved = String(p.value); resolvedPath = p.path; break; }
        }
        this.clientSecret = resolved || '';
        console.log('Resolved clientSecret:', resolvedPath || 'none', this.clientSecret ? '***masked***' : null);

        // mock handling
        this.isMockMode = !!resp?.mock;
        this.mockConfirmUrl = resp?.mock_confirm_url || null;
        // parse amount_display like "120.00 USD" to number
        if (resp?.amount_display && typeof resp.amount_display === 'string') {
          const m = resp.amount_display.split(' ')[0].replace(/,/g, '');
          const n = Number(m);
          if (!Number.isNaN(n)) this.amount = n;
          this.amount_display = resp.amount_display;
        }
        this.status_label = resp?.status_label || null;
        // fill reservation-like fields for UI
        this.reservation = this.reservation || {};
        this.reservation.title = resp?.title || `Factura #${invId}`;
        this.reservation.customer_email = resp?.customer_email || resp?.email || this.reservation.customer_email;
        // prefer card
        this.selectedGateway = this.selectedGateway || 'card';
        if (this.selectedGateway === 'card') await this.ensureCardMounted();
      }
    } catch (e) {
      console.warn('initInvoiceIntent failed', e);
    } finally {
      this.loading = false;
    }
  }

  // Download invoice PDF if backend exposes endpoint
  async downloadInvoicePdf() {
    if (!this.invoiceId) return;
    try {
      const blob: Blob = await firstValueFrom(this.finanzasService.downloadInvoice(this.invoiceId));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${this.invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      this.errorMessage = 'No se pudo descargar la factura.';
    }
  }

  // --- Helpers ---
  private normalizeGateways(raw: any): Array<{ id: string; label: string }> {
    try {
      let list: any[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (raw && Array.isArray(raw.results)) list = raw.results;

      const normalized = list.map(item => {
        if (!item) return null;
        if (typeof item === 'string') return { id: item, label: item };
        if (typeof item === 'object') {
          const id = item.name || item.id || item.key || (item?.label || '') || String(item);
          const label = item.config?.display_name || item.display_name || item.label || id;
          return { id, label };
        }
        return null;
      }).filter(Boolean) as Array<{ id: string; label: string }>;

      return normalized.length ? normalized : [{ id: 'card', label: 'Tarjeta' }];
    } catch (e) {
      return [{ id: 'card', label: 'Tarjeta' }];
    }
  }

  private applyDefaultPayment(defResp: any) {
    this.reservation = defResp;
    const cents = defResp?.due_today_cents ?? defResp?.amount_cents ?? defResp?.total_cents ?? defResp?.due_today ?? defResp?.amount ?? null;
    if (typeof cents === 'number') {
      this.amount = cents > 1000 ? Math.round(cents) / 100 : cents;
    }
  }

  private isValidClientSecret(secret: any): boolean {
    return !!(secret && typeof secret === 'string' && secret.indexOf('secret_') !== -1);
  }
}
