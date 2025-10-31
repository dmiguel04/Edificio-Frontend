import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary-card">
      <header class="summary-header">
        <h3>Resumen del pago</h3>
      </header>
      <div class="summary-body">
        <div class="field">
          <span class="label">Monto:</span>
          <span class="value">{{ amount !== null && amount !== undefined ? (amount | currency:'USD') : '' }}</span>
        </div>
        <div class="field small">Incluye impuestos y cargos si aplican</div>
      </div>
      <footer class="summary-footer">
        <button class="btn primary" (click)="confirm.emit()">Confirmar</button>
      </footer>
    </div>
  `,
  styles: [
    `
    .summary-card {
      background: #fff;
      border: 1px solid #ececec;
      border-radius: 8px;
      padding: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
      width: 100%;
    }
    .summary-header h3 { margin: 0 0 8px 0; font-size: 1.05rem }
    .summary-body { margin-bottom: 12px }
    .field { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px }
    .field.small { font-size: 0.85rem; color:#666 }
    .label { color:#444 }
    .value { font-weight:600 }
    .summary-footer { text-align:right }
    .btn { padding:8px 12px; border-radius:6px; border:0; cursor:pointer }
    .btn.primary { background:#0b74de; color:#fff }
    `
  ]
})
export class CheckoutSummaryComponent {
  @Input() amount: number | null = null;
  @Output() confirm = new EventEmitter<void>();
}
