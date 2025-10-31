import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CheckoutComponent } from './checkout/checkout.component';
import { PaymentSuccessComponent } from './payment/payment-success/payment-success.component';
import { PaymentFailedComponent } from './payment/payment-failed/payment-failed.component';
import { TreasuryDashboardComponent } from './treasury/treasury-dashboard.component';
import { ReservationCheckoutComponent } from './reservation-checkout/reservation-checkout.component';
import { FinanzasComponent } from './finanzas.component';
import { InvoicesListComponent } from './invoices/invoices-list.component';
import { PayrollComponent } from './payroll/payroll.component';

const routes: Routes = [
  { path: 'checkout', component: CheckoutComponent },
  { path: 'payment/success', component: PaymentSuccessComponent },
  { path: 'payment/failed', component: PaymentFailedComponent },
  { path: 'treasury', component: TreasuryDashboardComponent },
  { path: 'reservation', component: ReservationCheckoutComponent },
  { path: 'invoices', component: InvoicesListComponent },
  { path: 'payroll', component: PayrollComponent },
  { path: 'list', component: FinanzasComponent },
  { path: '', redirectTo: 'checkout', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanzasRoutingModule {}
