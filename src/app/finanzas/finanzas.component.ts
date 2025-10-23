import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FinanzasService } from './finanzas.service';

@Component({
  selector: 'app-finanzas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss']
})
export class FinanzasComponent implements OnInit {
  payments: any[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  
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
  
  loadPayments() {
    this.loading = true;
    this.errorMessage = '';
    this.finanzasService.getPayments().subscribe(
      (data: any) => {
        // backend returns either array or { payments: [] }
        this.payments = Array.isArray(data) ? data : (data && data.payments ? data.payments : []);
        this.loading = false;
      },
      error => {
        console.error('Error al cargar pagos:', error);
        this.errorMessage = 'No se pudieron cargar los pagos. Intente más tarde.';
        this.loading = false;
      }
    );
  }
}