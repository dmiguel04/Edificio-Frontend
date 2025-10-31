import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FinanzasService } from './finanzas.service';

@Component({
  selector: 'app-finanzas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss']
})
export class FinanzasComponent implements OnInit {
  payments: any[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  lastResponse: any = null;
  // map paymentId => boolean indicating download availability
  downloadAvailableMap: Record<string, boolean> = {};
  // cached global availability (null = unknown, true = available, false = unavailable)
  downloadGloballyAvailable: boolean | null = null;
  // filters & pagination
  filterMode: 'mine' | 'all' | 'user' = 'mine';
  filterUserId: string = '';
  // search by payment id
  searchPaymentId: string = '';
  page = 1;
  pageSize = 20;
  totalCount: number | null = null;
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object, private finanzasService: FinanzasService, private router: Router) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPayments();
    }
  }
  
  createNewCustomer() {
    this.loading = true;
    this.successMessage = '';
    this.finanzasService.createCustomer().subscribe(
      response => {
        console.log('Cliente creado:', response);
        this.successMessage = 'Cliente creado correctamente.';
        this.loading = false;
      },
      error => {
        console.error('Error al crear cliente:', error);
        this.errorMessage = 'Error al crear cliente.';
        this.loading = false;
      }
    );
  }
  
  createPayment() {
    // Navegar a la pantalla de pago (PaymentComponent) donde se inicializa Stripe
    this.router.navigate(['/finanzas', 'payment']);
  }

  openEmbeddedCheckout() {
    this.router.navigate(['/finanzas', 'checkout']);
  }
  
  loadPayments(page = 1) {
    this.page = page;
    this.loading = true;
    this.errorMessage = '';
    // If search by payment id is active, fetch by id only
    let params: any = {};
    if (this.searchPaymentId) {
      params = { id: this.searchPaymentId };
    } else {
      params = { page };
      if (this.filterMode === 'user' && this.filterUserId) {
        params.user_id = this.filterUserId;
      }
    }

    this.finanzasService.getPayments(params).subscribe(
      (data: any) => {
        this.lastResponse = data;
        // Attempt to extract total count for pagination
        this.totalCount = data?.count || data?.total || data?.results?.length || data?.payments?.length || (Array.isArray(data) ? data.length : null);

        if (Array.isArray(data)) {
          this.payments = data;
        } else if (data) {
          // If API returned single object for id lookup, normalize to array
          if (data && (data.id || data.payment_id || data.payment)) {
            this.payments = [data];
          } else {
            // common paginated shapes
            this.payments = data.results || data.payments || data.data || [];
          }
        } else {
          this.payments = [];
        }

        this.loading = false;
        // After loading payments, probe the download endpoint once (use first payment id)
        if (this.payments && this.payments.length && this.downloadGloballyAvailable === null) {
          const exampleId = this.payments[0].id;
          this.finanzasService.checkPaymentReceiptAvailable(exampleId).subscribe((avail: boolean) => {
            this.downloadGloballyAvailable = avail;
          }, () => {
            this.downloadGloballyAvailable = false;
          });
        } else if (!this.payments || !this.payments.length) {
          this.downloadGloballyAvailable = false;
        }
      },
      error => {
        console.error('Error al cargar pagos:', error);
        this.errorMessage = 'No se pudieron cargar los pagos. Intente más tarde.';
        this.loading = false;
      }
    );
  }

  viewPayment(id: any) {
    this.loading = true;
    this.finanzasService.getPayments({ id }).subscribe({
      next: (r: any) => {
        this.loading = false;
        const item = Array.isArray(r) ? r.find((x: any) => x.id == id) : (r?.results?.[0] || r);
        const text = JSON.stringify(item, null, 2);
        const w = window.open('', '_blank');
        if (w) {
          w.document.title = `Pago ${id}`;
          w.document.body.style.whiteSpace = 'pre-wrap';
          w.document.body.style.fontFamily = 'monospace';
          w.document.body.textContent = text;
        } else {
          alert(text);
        }
      },
      error: (e: any) => {
        this.loading = false;
        console.error('Error cargando pago:', e);
        alert('Error cargando pago');
      }
    });
  }

  changeFilter(mode: 'mine' | 'all' | 'user') {
    this.filterMode = mode;
    // reset page and userId if not needed
    if (mode !== 'user') this.filterUserId = '';
    // Clear id search when changing filter
    this.searchPaymentId = '';
    this.loadPayments(1);
  }

  // Trigger search by payment id
  searchById() {
    if (!this.searchPaymentId) return this.loadPayments(1);
    // set filterMode to all to avoid user-scoped filtering when searching by id
    this.filterMode = 'all';
    this.loadPayments(1);
  }

  // Show the full list (clear search)
  showFullList() {
    this.searchPaymentId = '';
    this.filterUserId = '';
    this.filterMode = 'mine';
    this.loadPayments(1);
  }

  goToPage(p: number) {
    if (p < 1) return;
    this.loadPayments(p);
  }

  downloadReceipt(paymentId: any) {
    this.loading = true;
    this.finanzasService.downloadPaymentReceipt(paymentId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      this.loading = false;
    }, err => {
      console.error('download receipt error', err);
      // Mark global availability as false to hide the button next time
      this.downloadGloballyAvailable = false;
      alert('No se pudo descargar el recibo (el backend puede no exponer el endpoint).');
      this.loading = false;
    });
  }
}