import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanzasService } from '../finanzas.service';
import { Router } from '@angular/router';

interface LineItem {
  description: string;
  quantity: number;      // unidades (por defecto 1)
  unitAmount: number;    // importe por unidad en la UI (ej. 12.50)
}

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoices-list.component.html',
  styleUrls: ['./invoices-list.component.scss']
})
export class InvoicesListComponent implements OnInit {
  invoices: any[] = [];
  loading = false;

  // create form fields (unidades/decimales en moneda: ej. 12.50)
  amount: number | null = null; // monto en unidades (ej. 12.50) — opcional si se usan line_items
  currency = 'usd';
  description = '';
  due_date: string | null = null;

  // campos opcionales añadidos
  invoiceNumber: string | null = null;
  billingAddress: string | null = null;
  taxId: string | null = null;
  reference: string | null = null;

  // line items gestionables
  lineItems: LineItem[] = [];

  creating = false;

  constructor(private finanzas: FinanzasService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.finanzas.listInvoices().subscribe(res => {
      this.invoices = Array.isArray(res) ? res : res;
      this.loading = false;
    }, () => this.loading = false);
  }

  // UI helpers para manejar line items
  addLineItem() {
    this.lineItems.push({ description: '', quantity: 1, unitAmount: 0 });
  }

  removeLineItem(index: number) {
    this.lineItems.splice(index, 1);
  }

  // calcular total desde lineItems (en centavos)
  private computeTotalFromLineItemsCents(): number {
    let total = 0;
    for (const it of this.lineItems) {
      const qty = Number(it.quantity || 0);
      const unit = Number(it.unitAmount || 0);
      // convertimos a centavos y redondeamos
      const unitCents = Math.round(unit * 100);
      total += qty * unitCents;
    }
    return total;
  }

  // build payload and create invoice
  createInvoice() {
    if (this.lineItems.length === 0 && (this.amount === null || isNaN(this.amount))) {
      return alert('Monto requerido si no se agregan líneas.');
    }

    this.creating = true;

    // Si hay line items, construir payload line_items y calcular total automáticamente
    const payload: any = {
      currency: this.currency,
      description: this.description || '',
      // campos opcionales administrativos
      invoice_number: this.invoiceNumber || undefined,
      billing_address: this.billingAddress || undefined,
      tax_id: this.taxId || undefined,
      reference: this.reference || undefined,
    };

    if (this.lineItems.length > 0) {
      // Convertir a la estructura esperada: [{ description, quantity, amount }, ...] con amount en centavos
      payload.line_items = this.lineItems.map(li => ({
        description: li.description || '',
        quantity: Number(li.quantity || 1),
        // backend espera amount en centavos (llamado 'amount' en el PDF builder)
        amount: Math.round((Number(li.unitAmount || 0)) * 100),
      }));

      // Si el backend espera un total explícito, envíalo como 'amount' (suma de los ítems)
      const totalCents = this.computeTotalFromLineItemsCents();
      payload.amount = totalCents;
    } else {
      // Si no hay líneas, enviar amount en centavos calculado desde la entrada
      payload.amount = Math.round(Number(this.amount || 0) * 100);
    }

    // incluir due_date solo si tiene valor
    if (this.due_date) payload.due_date = this.due_date;

    // POST al backend
    this.finanzas.createInvoice(payload).subscribe(res => {
      this.creating = false;
      // Si backend devuelve id y quieres redirigir al checkout/checkout flow:
      if (res && res.id) {
        try {
          this.router.navigate(['/finanzas/checkout'], { queryParams: { invoice_id: res.id } });
          return;
        } catch (e) {
          // fallback: recargar lista
        }
      }

      // refrescar la lista y resetear formulario
      this.resetForm();
      this.load();
    }, (err) => {
      this.creating = false;
      console.error('Error creando la factura', err);
      alert('Error creando la factura: ' + (err?.message || JSON.stringify(err)));
    });
  }

  resetForm() {
    this.amount = null;
    this.description = '';
    this.due_date = null;
    this.invoiceNumber = null;
    this.billingAddress = null;
    this.taxId = null;
    this.reference = null;
    this.lineItems = [];
  }

  // descarga del PDF — el servicio debe devolver responseType: 'blob'
  download(invoiceId: any, filename?: string) {
    this.finanzas.downloadInvoice(invoiceId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      // preferir invoiceNumber como nombre de archivo si existe
      const fileName = filename || `${invoiceId}.pdf`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }, err => {
      console.error('download error', err);
      alert('Error descargando la factura');
    });
  }
}