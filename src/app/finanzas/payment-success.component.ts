import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="payment-success">
      <h2>Pago completado</h2>
      <p>Gracias. Su pago se ha procesado correctamente.</p>
      <a routerLink="/finanzas">Volver a finanzas</a>
    </div>
  `
})
export class PaymentSuccessComponent {}
