import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CommonModule, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, NgIf, RouterModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {
  transactionId: string | null = null;
  customerEmail: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Try navigation state first (guarded for SSR)
    let state: any = {};
    try {
      if (typeof window !== 'undefined' && typeof history !== 'undefined') {
        state = (window.history as any).state || {};
      }
    } catch (e) {
      state = {};
    }
    if (state && state.transactionId) {
      this.transactionId = state.transactionId;
    }
    if (state && state.email) {
      this.customerEmail = state.email;
    }

    // Fallback to query params
    this.route.queryParamMap.subscribe(q => {
      if (!this.transactionId && q.get('transactionId')) {
        this.transactionId = q.get('transactionId');
      }
      if (!this.customerEmail && q.get('email')) {
        this.customerEmail = q.get('email');
      }
    });
  }
}
