import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-residente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-shell">
      <h2>Panel Residente</h2>
      <p>Interfaz para residentes.</p>

      <section style="margin-top:16px">
        <h3>Pago rápido de factura</h3>
        <div style="display:flex; gap:8px; align-items:center">
          <input [(ngModel)]="invoiceId" placeholder="Ingrese invoice_id (ej: 456)" style="padding:8px; border-radius:6px; border:1px solid #ccc" />
          <button (click)="openInvoiceInNewWindow()" style="padding:8px 12px; border-radius:6px; background:#1976d2; color:#fff; border:0">Abrir pago en nueva ventana</button>
          <button (click)="openInvoicesList()" style="padding:8px 12px; border-radius:6px; background:#6b7280; color:#fff; border:0">Ver mis facturas</button>
        </div>
        <div class="small muted" style="margin-top:8px">Puedes pegar el ID de la factura recibida por correo y abrir la ventana de pago.</div>
      </section>
    </div>
  `
})
export class DashboardResidenteComponent {
  invoiceId: string | null = null;

  openInvoiceInNewWindow() {
    const id = (this.invoiceId || '').toString().trim();
    if (!id) {
      alert('Ingrese invoice_id');
      return;
    }
    const url = (window.location.origin || '') + '/payments/checkout/?invoice_id=' + encodeURIComponent(id);
    window.open(url, '_blank');
  }

  openInvoicesList() {
    const url = (window.location.origin || '') + '/finanzas/invoices';
    window.open(url, '_blank');
  }
}


