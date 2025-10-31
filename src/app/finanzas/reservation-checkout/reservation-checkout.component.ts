import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StripeService } from '../../services/stripe.service';
import { environment } from '../../../environments/environment';
import { FinanzasService } from '../finanzas.service';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reservation-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './reservation-checkout.component.html',
  styleUrls: ['./reservation-checkout.component.scss']
})
export class ReservationCheckoutComponent implements OnInit, OnDestroy {
  form: FormGroup;
  card: any;
  elements: any;
  loading = false;
  error = '';
  areas: Array<{ id: any, label: string }> = [];
  payExisting = false;
  existingReservation: any = null;
  showPaymentPanel = false;
  gateways: any[] = [];
  selectedGateway: string = 'card';
  // Calendar state
  calendarMonth: Date = new Date();
  calendarDays: Array<any> = [];
  selectedDay: Date | null = null;
  reservationsByDate: { [key: string]: any[] } = {};
  loadingReservations = false;

  constructor(
    private fb: FormBuilder,
    private stripeService: StripeService,
    private finanzas: FinanzasService,
    private router: Router,
    private toast: ToastService,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      area_comun: [null, [Validators.required]],
      fecha_reserva: [null, [Validators.required]],
      hora_inicio: [null, [Validators.required]],
      hora_fin: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: [''],
      email: ['']
    }, { validators: this.timeRangeValidator });
  }

  // Validator to ensure hora_inicio < hora_fin (values as 'HH:MM')
  timeRangeValidator = (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('hora_inicio')?.value;
    const end = group.get('hora_fin')?.value;
    if (!start || !end) return null;
    const toMinutes = (v: string) => {
      if (typeof v !== 'string') return NaN;
      const parts = v.split(':');
      if (parts.length < 2) return NaN;
      const h = Number(parts[0]);
      const m = Number(parts[1]);
      if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
      return h * 60 + m;
    };
    const s = toMinutes(start);
    const e = toMinutes(end);
    if (Number.isNaN(s) || Number.isNaN(e)) return null;
    return s < e ? null : { timeRangeInvalid: true };
  }

  async ngOnInit() {
    try {
      const st: any = (typeof window !== 'undefined' && history && history.state) ? history.state : null;
      if (st && st.reservation && st.reservation.id) {
        this.payExisting = true;
        this.existingReservation = st.reservation;
        this.showPaymentPanel = true;
        this.form.patchValue({
          area_comun: this.existingReservation.area_comun ?? null,
          fecha_reserva: this.existingReservation.start_date ?? this.existingReservation.fecha_reserva ?? null,
          hora_inicio: this.existingReservation.hora_inicio ?? null,
          hora_fin: this.existingReservation.hora_fin ?? null,
          amount: (this.existingReservation.due_today_cents ? (this.existingReservation.due_today_cents / 100) : (this.existingReservation.amount_cents ? (this.existingReservation.amount_cents / 100) : this.existingReservation.amount)) ?? null,
          description: this.existingReservation.summary ?? this.existingReservation.description ?? ''
        });
        try { await this.initPaymentElements(); } catch (e) { console.warn('Stripe init skipped', e); }
      } else {
        try {
          const resp: any = await firstValueFrom(this.finanzas.getAreas());
          const raw = Array.isArray(resp) ? resp : (resp?.results || resp?.data || []);
          this.areas = (raw || []).map((a: any, idx: number) => {
            // Try many possible id fields, fall back to index so the option always appears
            let id: any = a.id ?? a.pk ?? a.area_id ?? a.value ?? a.key ?? a.type ?? a.slug ?? a.code ?? (Array.isArray(a) ? a[0] : undefined);
            // If still undefined, use fallback index prefixed to avoid collision with numeric ids
            if (id === undefined || id === null) id = `idx_${idx}`;
            // Normalize numeric strings to numbers when safe
            if (typeof id === 'string' && /^[0-9]+$/.test(id)) id = Number(id);
            const label = a.nombre ?? a.display_name ?? a.name ?? a.title ?? a.label ?? a.descripcion ?? a.description ?? (Array.isArray(a) ? a[1] : `Área ${idx + 1}`);
            return { id, label };
          });
          // Sort by label for more predictable listing (case-insensitive)
          this.areas.sort((x: any, y: any) => String(x.label || '').localeCompare(String(y.label || ''), undefined, { sensitivity: 'base' }));
          console.info('Finanzas: loaded areas raw=', raw, 'mapped=', this.areas);
          if (!this.areas.length) {
            const TIPO_AREA: Array<[string,string]> = [
              ['salon', 'Salón Principal'],
              ['gimnasio', 'Gimnasio'],
              ['parqueo', 'Parqueo'],
              ['piscina', 'Piscina'],
              ['terraza', 'Terraza']
            ];
            this.areas = TIPO_AREA.map(t => ({ id: t[0], label: t[1] }));
          }
        } catch (e) {
          this.areas = [];
        }
          // build initial calendar and load reservations for selected area (if any)
          if (typeof window !== 'undefined') {
            this.buildCalendar(this.calendarMonth);
            const areaValInit = this.normalizeAreaComun(this.form.get('area_comun')?.value);
            // fire-and-forget
            this.loadReservationsForMonth(this.calendarMonth, areaValInit).then(() => this.buildCalendar(this.calendarMonth));
          }
        try {
          const me: any = await firstValueFrom(this.userService.getCurrentUser());
          if (me && me.email) {
            this.form.patchValue({ email: me.email });
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      console.warn('Init error', e);
    }
  }

  // Cuando cambia el área, recargar reservas y reconstruir calendario
  async onAreaChanged() {
    if (typeof window === 'undefined') return;
    const areaVal = this.form.get('area_comun')?.value;
    const normalizedArea = this.normalizeAreaComun(areaVal);
    await this.loadReservationsForMonth(this.calendarMonth, normalizedArea);
    this.buildCalendar(this.calendarMonth);
  }

  private formatDateKey(d: Date) {
    return d.toISOString().slice(0,10); // YYYY-MM-DD
  }

  // Cargar reservas para el mes (o rango) y agrupar por fecha
  async loadReservationsForMonth(month: Date, areaId: any = null) {
    if (typeof window === 'undefined') return;
    this.loadingReservations = true;
    try {
      const start = new Date(month.getFullYear(), month.getMonth(), 1);
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      const params: any = {};
      if (areaId !== null && areaId !== undefined) params.area_comun = areaId;
      // Backend may expect start_date/end_date or fecha_desde/fecha_hasta; try common names
      params.start_date = start.toISOString().slice(0,10);
      params.end_date = end.toISOString().slice(0,10);
      let resp: any = null;
      try { resp = await firstValueFrom(this.finanzas.getReservations(params)); } catch (e) { resp = null; }
      const items = Array.isArray(resp) ? resp : (resp?.results || resp?.data || resp?.items || []);
      this.reservationsByDate = {};
      (items || []).forEach((r: any) => {
        // Prefer backend field `fecha_reserva` (YYYY-MM-DD or ISO). Fallback to common names.
        const ds = r.fecha_reserva || r.start_date || r.date || r.reservation_date || r.start || null;
        let dateStr = null;
        if (ds && typeof ds === 'string') dateStr = ds.slice(0,10);
        else if (ds instanceof Date) dateStr = this.formatDateKey(ds);
        if (!dateStr && r.start_time) {
          // fallback: try to parse combined
          try {
            const parsed = new Date(r.start_time);
            if (!Number.isNaN(parsed.getTime())) dateStr = this.formatDateKey(parsed);
          } catch (e) {}
        }
        if (!dateStr) return;
        if (!this.reservationsByDate[dateStr]) this.reservationsByDate[dateStr] = [];
        this.reservationsByDate[dateStr].push(r);
      });
    } catch (e) {
      this.reservationsByDate = {};
    } finally {
      this.loadingReservations = false;
    }
  }

  // Construir la estructura del calendario (mes mostrado)
  buildCalendar(month: Date) {
    const year = month.getFullYear();
    const mon = month.getMonth();
    const first = new Date(year, mon, 1);
    const startDay = first.getDay(); // 0..6 (Sun..Sat)
    const daysInMonth = new Date(year, mon + 1, 0).getDate();
    const prevDays = startDay; // number of leading blanks
    const totalCells = Math.ceil((prevDays + daysInMonth) / 7) * 7;
    const startDate = new Date(year, mon, 1 - prevDays);
    this.calendarDays = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const key = this.formatDateKey(d);
      const inMonth = (d.getMonth() === mon);
      const hasReservations = !!(this.reservationsByDate[key] && this.reservationsByDate[key].length);
      this.calendarDays.push({ date: d, label: d.getDate(), inMonth, hasReservations, key });
    }
  }

  // Navegar al mes anterior/sgte
  async changeMonth(delta: number) {
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + delta, 1);
    const areaVal = this.normalizeAreaComun(this.form.get('area_comun')?.value);
    await this.loadReservationsForMonth(this.calendarMonth, areaVal);
    this.buildCalendar(this.calendarMonth);
  }

  // Seleccionar un día en el calendario
  selectDay(cell: any) {
    if (!cell.inMonth) return; // only allow selecting current month days
    this.selectedDay = cell.date;
  }

  // Helper para template: reservas del día seleccionado
  getReservationsForSelectedDay(): any[] {
    if (!this.selectedDay) return [];
    const key = this.formatDateKey(this.selectedDay);
    return this.reservationsByDate[key] || [];
  }

  private normalizeAreaComun(areaValue: any): number | null {
    if (areaValue == null || areaValue === '') return null;
    if (typeof areaValue === 'number') return areaValue;
    if (typeof areaValue === 'string') {
      const n = Number(areaValue);
      if (!Number.isNaN(n)) return n;
      const found = this.areas.find(a => {
        if (a.id === areaValue) return true;
        if (typeof a.id === 'number' && String(a.id) === areaValue) return true;
        if ((a.label || '').toLowerCase() === String(areaValue).toLowerCase()) return true;
        return false;
      });
      if (found) {
        const nn = Number(found.id);
        if (!Number.isNaN(nn)) return nn;
      }
    }
    return null;
  }

  async pay() {
    if (this.form.invalid) {
      const invalid: string[] = [];
      Object.keys(this.form.controls || {}).forEach(k => {
        const c = this.form.get(k);
        if (c && c.invalid) invalid.push(k);
      });
      const msg = invalid.length ? `Hay campos inválidos: ${invalid.join(', ')}` : 'Ingrese un monto válido';
      this.error = msg;
      this.toast.show(msg, 'error');
      return;
    }

    try {
      const logged = !!(this.authService && (typeof (this.authService as any).isLoggedIn === 'function' ? (this.authService as any).isLoggedIn() : false));
      const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('access') : null;
      console.log('Auth check before creating reservation - isLoggedIn:', logged, 'token present:', !!token);
      if (!logged) {
        this.toast.show('Debes iniciar sesión para crear una reserva y pagar', 'error');
        this.router.navigate(['/login']);
        return;
      }
    } catch (e) {
      console.warn('Auth check error', e);
    }

    this.loading = true;
    this.error = '';

    const rawAmount = this.form.value.amount;
    const amount = Math.round((rawAmount ?? 0) * 100);

    try {
      if (!this.showPaymentPanel && !this.payExisting) {
        let reservaResp: any;
        try {
          const formVal = { ...this.form.value };
          const normalizedArea = this.normalizeAreaComun(formVal.area_comun);
          if (normalizedArea === null) {
            const msg = 'Selecciona un área válida (asegúrate de elegir una opción del selector).';
            this.toast.show(msg, 'error');
            this.error = msg;
            this.loading = false;
            return;
          }
          formVal.area_comun = normalizedArea;
          formVal.amount = typeof formVal.amount === 'string' ? Number(formVal.amount) : formVal.amount;
          const payload = { ...formVal, pay_now: false };
          console.log('Creando reserva con payload:', payload);
          this.toast.show('Creando reserva...', 'info');
          reservaResp = await firstValueFrom(this.finanzas.createReservation(payload));
          console.log('Respuesta reserva:', reservaResp);
          this.toast.show('Reserva creada correctamente.', 'success');
        } catch (err: any) {
          console.error('Error creando reserva:', err);
          const rawMsg = err?.error || err?.message || err?.toString?.() || '';
          if (typeof rawMsg === 'string' && rawMsg.indexOf('<') !== -1) {
            const msg = 'Respuesta inesperada del servidor. Es probable que la sesión haya expirado. Por favor inicia sesión.';
            this.toast.show(msg, 'error');
            this.router.navigate(['/login']);
            this.loading = false;
            return;
          }
          const msg = err?.error || err?.message || 'Error creando la reserva';
          this.toast.show(msg, 'error');
          this.error = msg;
          this.loading = false;
          return;
        }

        const due = reservaResp?.due_today_cents ?? reservaResp?.due_cents ?? reservaResp?.amount_cents ?? null;
        const amountToPay = due != null ? (due / 100) : (this.form.value.amount ?? null);
        this.router.navigate(['/finanzas', 'checkout'], { state: { reservation: reservaResp, amount: amountToPay } });
        this.loading = false;
        return;
      }

      if (!this.existingReservation || !this.existingReservation.id) {
        this.error = 'Reserva no encontrada para pagar';
        this.loading = false;
        return;
      }

      if (this.selectedGateway && this.selectedGateway !== 'card') {
        try {
          const sess: any = await firstValueFrom(this.finanzas.createCheckoutSession({ reservation_id: this.existingReservation.id, gateway: this.selectedGateway, amount }));
          const url = sess?.url || sess?.session_url || sess?.checkout_url || sess?._payment?.checkout_url || null;
          if (url) { window.location.href = url; return; }
        } catch (e: any) {
          this.error = e?.error || e?.message || 'No se pudo iniciar la sesión de pago';
          this.loading = false;
          return;
        }
      }

      let intentResp: any = null;
      try {
        intentResp = await firstValueFrom(this.finanzas.createPaymentIntent({ reservation_id: this.existingReservation.id, amount }));
      } catch (e: any) {
        const msg = e?.error || e?.message || 'No se pudo iniciar el pago';
        this.toast.show(msg, 'error');
        this.error = msg;
        this.loading = false;
        return;
      }

  const clientSecret = this.findClientSecret(intentResp);
  console.log('Resolved clientSecret:', clientSecret, 'intentResp:', intentResp);
      const paymentId = intentResp?.payment_id || intentResp?._payment?.payment_id || null;

      // If backend indicated this is a mock intent (local dev), call the mock confirm endpoint
      if (intentResp?.mock || intentResp?.mock_confirm_url) {
        try {
          const respMock: any = await firstValueFrom(this.finanzas.confirmMockPayment(paymentId));
          // If the response already contains a status indicating success
          if (respMock && respMock.status === 'succeeded') {
            let canonical: any = null;
            if (paymentId) {
              try { canonical = await firstValueFrom(this.finanzas.getPaymentStatus(paymentId)); } catch (e) { canonical = null; }
            }
            this.toast.show('Pago procesado correctamente (mock)', 'success');
            this.router.navigate(['/finanzas/payment/success'], { state: { transactionId: canonical?.transaction_id || respMock?.transaction_id || paymentId } });
            this.loading = false;
            return;
          }
          // fallback: poll payment status
          if (paymentId) {
            await this.pollPaymentStatus(paymentId);
            this.loading = false;
            return;
          }
        } catch (err: any) {
          const msg = err?.error || err?.message || 'Error confirmando pago (mock)';
          this.toast.show(msg, 'error');
          this.error = msg;
          this.loading = false;
          return;
        }
      }

      if (!clientSecret) {
        const checkoutUrl = intentResp?._payment?.checkout_url || intentResp?.checkout_url || null;
        if (checkoutUrl) { window.location.href = checkoutUrl; return; }
        // If backend mistakenly returned only the PaymentIntent ID (pi_...) instead
        // of the full client_secret, show a clearer error to help debugging.
        const maybePi = intentResp?.payment_id || intentResp?.id || intentResp?.payment_intent || null;
        if (typeof maybePi === 'string' && maybePi.startsWith('pi_')) {
          const msg = `El backend devolvió sólo el id del PaymentIntent (${maybePi}) en lugar del client_secret. Revisa la configuración del backend.`;
          this.error = msg;
          this.toast.show(msg, 'error');
        } else {
          this.error = 'No se obtuvo client_secret para procesar el pago';
          this.toast.show(this.error, 'error');
        }
        this.loading = false;
        return;
      }

      if (!this.card) {
        await this.initPaymentElements();
      }

      // Safety: ensure clientSecret looks like a real client_secret (contains 'secret_')
      if (!(clientSecret && typeof clientSecret === 'string' && clientSecret.indexOf('secret_') !== -1)) {
        const msg = 'El client_secret no es válido para confirmar con Stripe. Evitando llamada a Stripe.js para prevenir errores (posible respuesta mock o backend mal configurado).';
        console.error(msg, { clientSecret, intentResp });
        this.toast.show(msg, 'error');
        this.error = msg;
        this.loading = false;
        // If we have a paymentId, try polling its status as fallback
        if (paymentId) {
          await this.pollPaymentStatus(paymentId);
        }
        return;
      }

      // Debug: show masked publishable key to help detect key/account mismatches
      try {
        const pub = (environment && environment.stripeKey) ? String(environment.stripeKey) : null;
        const masked = pub ? (pub.substr(0, 8) + '...' + pub.substr(pub.length - 8)) : null;
        console.log('Calling Stripe.confirmCardPayment with clientSecret (masked) and publishable key:', !!clientSecret, masked);
      } catch (e) {}

      const result: any = await this.stripeService.confirmCardPayment(clientSecret, this.card);
      if (result?.error) {
        this.error = result.error.message || 'Error procesando el pago';
        this.toast.show(this.error, 'error');
        this.loading = false;
        return;
      }

      if (result?.paymentIntent && result.paymentIntent.status === 'succeeded') {
        let canonical: any = null;
        if (paymentId) {
          try { canonical = await firstValueFrom(this.finanzas.getPaymentStatus(paymentId)); } catch (e) { canonical = null; }
        }
        this.toast.show('Pago procesado correctamente', 'success');
        this.router.navigate(['/finanzas/payment/success'], { state: { transactionId: canonical?.transaction_id || result.paymentIntent.id } });
        this.loading = false;
        return;
      }

      if (paymentId) {
        await this.pollPaymentStatus(paymentId);
        this.loading = false;
        return;
      }

      this.router.navigate(['/finanzas/payment/failed']);
    } catch (err: any) {
      console.error('Payment error', err);
      this.error = err?.message || 'Error procesando el pago';
      this.loading = false;
      this.router.navigate(['/finanzas/payment/failed']);
    }
  }

  async pollPaymentStatus(paymentId: string) {
    const maxAttempts = 12;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    for (let i = 0; i < maxAttempts; i++) {
      let resp: any = null;
      try {
        resp = await firstValueFrom(this.finanzas.getPaymentStatus(paymentId));
      } catch (e) {
        resp = null;
      }
      const p = Array.isArray(resp) ? resp[0] : resp;
      const status = p?.status || p?.payment_status || null;
      if (status === 'succeeded' || status === 'paid' || status === 'complete') {
        this.router.navigate(['/finanzas/payment/success'], { state: { transactionId: p?.transaction_id } });
        return;
      }
      await delay(2000);
    }
    this.router.navigate(['/finanzas/payment/failed']);
  }

  async initPaymentElements() {
    try {
      try {
        const gResp: any = await firstValueFrom(this.finanzas.getGateways());
        const raw = Array.isArray(gResp) ? gResp : (gResp?.results || gResp?.gateways || []);
        this.gateways = raw.map((x: any) => ({ id: x.id || x.gateway_id || x.name || x.key || 'card', label: x.label || x.display_name || x.name || x.title || (x.id || x.gateway_id) }));
        if (this.gateways.length) {
          const foundCard = this.gateways.find(g => (g.id || '').toLowerCase().includes('card') || (g.label || '').toLowerCase().includes('tarjeta'));
          this.selectedGateway = (foundCard && foundCard.id) ? foundCard.id : (this.gateways[0].id || 'card');
        } else {
          this.selectedGateway = 'card';
        }
      } catch (e) {
        this.gateways = [];
        this.selectedGateway = 'card';
      }

      const stripe = await this.stripeService.getStripe();
      if (!stripe) { throw new Error('Stripe no disponible'); }
      try { if (this.card) { this.card.unmount(); this.card = null; } } catch (e) {}

      if (!this.selectedGateway || this.selectedGateway === 'card') {
        this.elements = stripe.elements();
        this.card = this.elements.create('card');
        setTimeout(() => {
          const node = document.getElementById('card-element');
          if (node) {
            try { this.card.mount(node); } catch (e) { console.warn('mount error', e); }
          }
        }, 50);
      } else {
        try { if (this.card) { this.card.unmount(); this.card = null; } } catch (e) {}
      }
    } catch (e) {
      console.warn('initPaymentElements error', e);
      throw e;
    }
  }

  // Helper: buscar recursivamente un client_secret en la respuesta del backend
  private findClientSecret(obj: any): string | null {
    if (!obj) return null;
    const stack: any[] = [obj];
    while (stack.length) {
      const cur = stack.pop();
      if (typeof cur === 'string') {
        if (cur.indexOf('secret_') !== -1) return cur;
      } else if (typeof cur === 'object' && cur !== null) {
        for (const k of Object.keys(cur)) {
          const v = cur[k];
          if (typeof v === 'string' && v.indexOf('secret_') !== -1) return v;
          if (typeof v === 'object' && v !== null) stack.push(v);
        }
      }
    }
    return null;
  }

  ngOnDestroy() {
    try { if (this.card) { this.card.unmount(); this.card = null; } } catch (e) {}
  }
}