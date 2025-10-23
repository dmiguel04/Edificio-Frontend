import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanzasService } from '../finanzas.service';

@Component({
  selector: 'app-checkout-return',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout-return.component.html',
})
export class CheckoutReturnComponent implements OnInit {
  loading = true;
  status: string | null = null;
  customerEmail: string | null = null;
  errorMessage: string | null = null;

  constructor(private finanzas: FinanzasService) {}

  async ngOnInit() {
    try {
      const qs = new URLSearchParams(window.location.search);
      const sessionId = qs.get('session_id');
      if (!sessionId) throw new Error('Session id no encontrada en la URL');

      const resp: any = await this.finanzas.getSessionStatus(sessionId).toPromise();
      this.status = resp.status;
      this.customerEmail = resp.customer_email || resp.customerEmail || null;
    } catch (err: any) {
      this.errorMessage = err && err.message ? err.message : String(err);
    } finally {
      this.loading = false;
    }
  }
}
