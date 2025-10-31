import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-failed',
  standalone: true,
  imports: [CommonModule, NgIf, RouterModule],
  templateUrl: './payment-failed.component.html',
  styleUrls: ['./payment-failed.component.css']
})
export class PaymentFailedComponent implements OnInit {
  transactionId: string | null = null;
  customerEmail: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    let state: any = {};
    try {
      if (typeof window !== 'undefined' && typeof history !== 'undefined') {
        state = (window.history as any).state || {};
      }
    } catch (e) {
      state = {};
    }
    if (state && state.transactionId) this.transactionId = state.transactionId;
    if (state && state.email) this.customerEmail = state.email;

    this.route.queryParamMap.subscribe(q => {
      if (!this.transactionId && q.get('transactionId')) this.transactionId = q.get('transactionId');
      if (!this.customerEmail && q.get('email')) this.customerEmail = q.get('email');
    });
  }
}
