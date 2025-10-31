import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanzasService } from '../finanzas.service';
import { Router } from '@angular/router';

type EntryType = 'earning' | 'deduction';

interface PayrollEntryInput {
  type: EntryType;
  description: string;
  days?: number | null;
  // amount en unidades (ej: 34344.34) en el form; se convertirá a cents al enviar
  amount?: number | null;
  // optional beneficiary id si el frontend lo provee
  beneficiary?: number | null;
}

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payroll.component.html',
  styleUrls: ['./payroll.component.scss']
})
export class PayrollComponent implements OnInit {
  payrolls: any[] = [];
  loading = false;

  // UI messages
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // create form
  name = '';
  period_start: string | null = null; // format YYYY-MM-DD
  period_end: string | null = null;
  // total_amount en unidades (p.ej. 34344.34). Convertiremos a cents al enviar.
  total_amount: number | null = null;
  cargo = ''; // nuevo campo cargo

  // entries (lineas de la nomina)
  entries: PayrollEntryInput[] = [];
  // UI: show/hide extended form (useful on mobile)
  showDetails = true;

  constructor(private finanzas: FinanzasService, private router: Router) {}

  toggleDetails() {
    this.showDetails = !this.showDetails;
    // focus first entry input when showing details for better UX
    if (this.showDetails) {
      setTimeout(() => {
        const el = document.querySelector('.entries-table tbody input');
        try { (el as HTMLElement | null)?.focus?.(); } catch (e) { /* ignore */ }
      }, 80);
    }
  }

  // Reset the form to initial state
  resetForm() {
    this.name = '';
    this.period_start = null;
    this.period_end = null;
    this.total_amount = null;
    this.cargo = '';
    this.entries = [];
    this.addEntry();
    this.errorMessage = null;
    this.successMessage = null;
  }

  // Fill sample data to help testing / demo
  fillSample() {
    this.name = 'Ciclo ejemplo';
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.period_start = `${yyyy}-${mm}-${dd}`;
    this.period_end = `${yyyy}-${mm}-${dd}`;
    this.cargo = 'Conserje';
    this.total_amount = 343.44;
    this.entries = [
      { type: 'earning', description: 'Sueldo base', days: 30, amount: 300.00 },
      { type: 'earning', description: 'Horas extras', days: 2, amount: 43.44 },
      { type: 'deduction', description: 'Retención', days: null, amount: 10.00 }
    ];
  }

  // Navigate to checkout to pay a payroll
  payPayroll(payrollId: any) {
    try {
      this.router.navigate(['/finanzas/checkout'], { queryParams: { payroll_id: payrollId } });
    } catch (e) {
      console.warn('Navigation to checkout failed', e);
    }
  }

  ngOnInit(): void {
    this.load();
    // inicializa con una fila por defecto para que UX tenga algo
    if (this.entries.length === 0) {
      this.addEntry();
    }
  }

  load() {
    this.loading = true;
    this.finanzas.listPayrolls().subscribe(res => {
      this.payrolls = Array.isArray(res) ? res : res;
      this.loading = false;
    }, () => this.loading = false);
  }

  addEntry() {
    this.entries.push({
      type: 'earning',
      description: '',
      days: null,
      amount: null,
      beneficiary: null
    });
  }

  removeEntry(idx: number) {
    if (idx >= 0 && idx < this.entries.length) {
      this.entries.splice(idx, 1);
    }
    // Ensure at least one entry remains for UX
    if (this.entries.length === 0) this.addEntry();
  }

  // Helper: convierte a centavos (int)
  private toCents(amount?: number | null): number {
    try {
      const n = Number(amount) || 0;
      // Round to nearest cent
      return Math.round(n * 100);
    } catch {
      return 0;
    }
  }

  // trackBy for payroll rows and entries for better rendering
  trackByPayroll(index: number, item: any) {
    return item?.id ?? index;
  }

  trackByEntry(index: number, item: PayrollEntryInput) {
    return index;
  }

  // compute totals (in cents)
  computeTotalsCents() {
    let gross = 0;
    let deductions = 0;
    for (const e of this.entries) {
      const cents = this.toCents(e.amount);
      if (e.type === 'earning') gross += cents;
      else deductions += cents;
    }
    return { gross, deductions, net: gross - deductions };
  }

  // human readable totals (units)
  computeTotalsUnits() {
    const t = this.computeTotalsCents();
    return { gross: t.gross / 100, deductions: t.deductions / 100, net: t.net / 100 };
  }

  createPayroll() {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.name) {
      this.errorMessage = 'Nombre requerido';
      return;
    }
    if (!this.period_start || !this.period_end) {
      this.errorMessage = 'Periodo inicio y fin requeridos';
      return;
    }

    // Validar y construir payload entries
    const validEntries = this.entries.filter(e => e.description && (e.amount || e.amount === 0));
    if (validEntries.length === 0) {
      this.errorMessage = 'Agregar al menos un concepto con descripción y monto.';
      return;
    }
    const entriesPayload = validEntries.map(e => ({
      type: e.type,
      description: e.description,
      days: e.days || null,
      // backend espera amount_cents (entero)
      amount_cents: this.toCents(e.amount),
      beneficiary: e.beneficiary || null
    }));

    // Si el usuario no puso total_amount, podemos calcularlo desde las entradas de tipo earning
    let totalCentsFromEntries = 0;
    if (entriesPayload && entriesPayload.length) {
      totalCentsFromEntries = entriesPayload
        .filter((x: any) => x.type === 'earning')
        .reduce((s: number, x: any) => s + (Number(x.amount_cents) || 0), 0);
    }

    // Construir payload para el backend. El backend espera total_amount en centavos.
    const payload: any = {
      name: this.name,
      period_start: this.period_start,
      period_end: this.period_end,
      // si el usuario puso total_amount en unidades lo convertimos, si no usamos totalCentsFromEntries
      total_amount: this.total_amount != null ? this.toCents(this.total_amount) : (totalCentsFromEntries || 0),
      // include cargo under several common keys to increase backend compatibility
      cargo: this.cargo,
      position: this.cargo,
      job_title: this.cargo,
      role: this.cargo,
      entries: entriesPayload
    };

    // debug: show payload in console to help backend mapping issues
    try { console.debug('Creating payroll payload', payload); } catch (e) {}

    this.loading = true;
    this.finanzas.createPayroll(payload).subscribe(res => {
      this.loading = false;
      this.successMessage = 'Nómina creada correctamente.';
      // reiniciar formulario
      this.name = '';
      this.period_start = null;
      this.period_end = null;
      this.total_amount = null;
      this.cargo = '';
      this.entries = [];
      this.addEntry();
      this.load();
      // limpiar mensaje luego de unos segundos
      setTimeout(() => this.successMessage = null, 4000);
    }, err => {
      this.loading = false;
      console.error('Error creando nómina', err);
      this.errorMessage = 'Error creando nómina: verifica la consola del navegador';
    });
  }

  downloadPayroll(payrollId: any) {
    this.finanzas.downloadPayroll(payrollId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${payrollId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }, err => {
      console.error('download payroll error', err);
      alert('No se pudo descargar el archivo de nómina (el backend puede no exponer el endpoint).');
    });
  }
}