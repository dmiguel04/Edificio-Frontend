import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckoutComponent } from './checkout/checkout.component';
import { CheckoutSummaryComponent } from './checkout/checkout-summary.component';
import { PaymentSuccessComponent } from './payment/payment-success/payment-success.component';
import { PaymentFailedComponent } from './payment/payment-failed/payment-failed.component';
import { TreasuryDashboardComponent } from './treasury/treasury-dashboard.component';
import { InvoicesListComponent } from './invoices/invoices-list.component';
import { PayrollComponent } from './payroll/payroll.component';
import { ReservationCheckoutComponent } from './reservation-checkout/reservation-checkout.component';
import { FinanzasRoutingModule } from './finanzas-routing.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    // Algunos componentes en este proyecto están definidos como standalone;
    // importarlos en lugar de declararlos evita el error "standalone cannot be declared".
    CheckoutComponent,
    CheckoutSummaryComponent,
    PaymentSuccessComponent,
    PaymentFailedComponent,
  TreasuryDashboardComponent,
    ReservationCheckoutComponent,
    InvoicesListComponent,
    PayrollComponent,
    FinanzasRoutingModule
  ],
  providers: []
})
export class FinanzasModule {}