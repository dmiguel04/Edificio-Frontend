import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { FinanzasComponent } from './finanzas.component';
import { FinanzasService } from './finanzas.service';
import { PaymentComponent } from './payment/payment.component';
import { PaymentSuccessComponent } from './payment-success.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { CheckoutReturnComponent } from './checkout/checkout-return.component';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    FinanzasComponent,
    PaymentComponent,
    PaymentSuccessComponent,
    RouterModule.forChild([
      { path: '', component: FinanzasComponent },
      { path: 'payment', component: PaymentComponent },
      { path: 'success', component: PaymentSuccessComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'checkout-return', component: CheckoutReturnComponent }
    ])
  ],
  providers: [FinanzasService]
})
export class FinanzasModule { }