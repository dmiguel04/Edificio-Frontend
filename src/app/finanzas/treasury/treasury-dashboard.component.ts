import { Component, OnInit } from '@angular/core';
import { TreasuryService } from './treasury.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-treasury-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterModule],
  templateUrl: './treasury-dashboard.component.html',
  styleUrls: ['./treasury-dashboard.component.scss']
})
export class TreasuryDashboardComponent implements OnInit {
  account: any = null;
  balance: any = null;
  transactions: any[] = [];
  loading = false;

  constructor(private treasury: TreasuryService) {}

  ngOnInit(): void {
    // in a real app we'd fetch by logged-in user
  }

  createAccount() {
    this.loading = true;
    this.treasury.createAccount().subscribe(res => {
      // backend returns serializer data for CuentaFinanciera
      this.account = res;
      this.loading = false;
    }, () => this.loading = false);
  }

  loadBalance() {
    if (!this.account) return;
    this.treasury.obtenerSaldo().subscribe(res => {
      // backend returns { balance: [...], currency: 'usd' }
      this.balance = res;
    });
  }

  issueCard() {
    if (!this.account) return;
    this.treasury.crearTarjeta({ tipo: 'virtual' }).subscribe(res => {
      alert('Tarjeta creada: ' + (res.stripe_card_id || res.cardId || res.cardId));
    });
  }

  transfer() {
    if (!this.account) return;
    const amount = 1000; // cents
    this.treasury.transferirFondos({ destination_payment_method: 'pm_external_123', monto: amount, descripcion: 'Pago externo' }).subscribe(res => {
      alert('Transferencia iniciada: ' + (res.stripe_transaction_id || res.transferId || res.id));
    });
  }

  loadTransactions() {
    if (!this.account) return;
    this.treasury.listarTransacciones().subscribe(res => {
      // backend returns serialized list
      this.transactions = Array.isArray(res) ? res : (res.transactions || []);
    });
  }
}
