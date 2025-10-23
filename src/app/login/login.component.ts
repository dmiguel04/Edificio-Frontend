import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../services/user.service';
import { timeout, catchError, take, finalize } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  // estado de UI
  isLoading: boolean = false;
  mostrarQR: boolean = false;
  qrImageUrl: string = '';
  tokenCorreo: string = '';
  // Intentos y bloqueo para token OTP
  private tokenCorreoIntentos: number = 0;
  tokenCorreoBloqueadoHasta: number | null = null; // timestamp ms

  // Getter para saber si actualmente está bloqueado (evitar Date en template)
  get isTokenCorreoBloqueado(): boolean {
    return !!(this.tokenCorreoBloqueadoHasta && Date.now() < this.tokenCorreoBloqueadoHasta);
  }

  // Segundos restantes de bloqueo (0 si no está bloqueado)
  get tokenCorreoBloqueadoSegundos(): number {
    if (!this.tokenCorreoBloqueadoHasta) return 0;
    const s = Math.ceil((this.tokenCorreoBloqueadoHasta - Date.now()) / 1000);
    return s > 0 ? s : 0;
  }
  private estadoCuentaInterval: any;
  private subs: Subscription[] = [];

  verificarEstadoCuenta() {
    if (!this.username) {
      this.estadoCuenta = '';
      return;
    }
    this.auth.checkAccountStatus(this.username).subscribe({
      next: (status: any) => {
        if (status.account_locked_until) {
          this.estadoCuenta = `Cuenta bloqueada hasta ${status.account_locked_until}`;
          this.estadoCuentaColor = '#c62828';
          // Si ya hay un intervalo, no crear otro
          if (!this.estadoCuentaInterval) {
            this.estadoCuentaInterval = setInterval(() => this.verificarEstadoCuenta(), 5000);
          }
        } else {
          this.estadoCuenta = '';
          this.estadoCuentaColor = '#388e3c';
          if (this.estadoCuentaInterval) {
            clearInterval(this.estadoCuentaInterval);
            this.estadoCuentaInterval = null;
          }
        }
      },
      error: () => {
        this.estadoCuenta = '';
        this.estadoCuentaColor = '#388e3c';
        if (this.estadoCuentaInterval) {
          clearInterval(this.estadoCuentaInterval);
          this.estadoCuentaInterval = null;
        }
      }
    });
  }
  ngOnDestroy() {
    if (this.estadoCuentaInterval) {
      clearInterval(this.estadoCuentaInterval);
    }
    // cancelar suscripciones pendientes
    this.subs.forEach(s => s.unsubscribe());
  }
  token: string = '';
  codigo2FA: string = '';
  mostrarPassword = false;
  username: string = '';
  password: string = '';
  email: string = '';
  captcha: string = '';
  mensaje: string = '';
  sentToMasked: string | null = null;
  captchaPregunta: string = '';
  captchaRespuesta: string = '';
  mostrarTokenCorreo: boolean = false;
  mostrarToken2FA: boolean = false;
  credencialesGuardadas: { username: string; password: string } | null = null;
  error: string = '';
  estadoCuenta: string = '';
  estadoCuentaColor: string = '#388e3c'; // Verde por defecto
  // Cambiado a '/' para forzar que la navegación sea determinada por el role extraído del token
  returnUrl: string = '/';
  loginMessage: string = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private userService: UserService
  ) {
    this.generarCaptcha();
  }

  ngOnInit() {
    // Obtener URL de retorno y mensaje de los query params
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/dashboard';
      this.loginMessage = params['message'] || '';
      
      if (this.loginMessage) {
        this.mensaje = this.loginMessage;
      }
    });
  }

  // Helper: mask email for display like j***@d***.com
  private maskEmail(email: string): string {
    try {
      const [local, domain] = email.split('@');
      const domParts = domain.split('.');
      const tld = domParts.pop();
      const domainMain = domParts.join('.');
      const localMasked = local.length <= 2 ? local[0] + '*' : local[0] + '*'.repeat(Math.max(1, local.length - 2)) + local.slice(-1);
      const domainMasked = domainMain.length <= 2 ? domainMain[0] + '*' : domainMain[0] + '*'.repeat(Math.max(1, domainMain.length - 2)) + domainMain.slice(-1);
      return `${localMasked}@${domainMasked}.${tld}`;
    } catch (e) {
      return email;
    }
  }

  generarCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.captchaPregunta = result;
    this.captchaRespuesta = result;
    this.captcha = '';
  }

  login() {
    if (this.isLoading) return; // prevenir envíos múltiples

    if (this.captcha.trim() !== this.captchaRespuesta) {
      this.mensaje = 'Captcha incorrecto. Intenta de nuevo.';
      this.generarCaptcha();
      return;
    }

    this.mensaje = '';
    this.error = '';
    if (!this.username || !this.password) {
      this.error = 'Usuario y contraseña requeridos';
      return;
    }

    // Consultar estado antes de login y refrescar mensaje, pero permitir siempre el login
    this.isLoading = true;
    const s = this.auth.checkAccountStatus(this.username).pipe(take(1), timeout(3000), catchError(() => of(null)), finalize(() => {})).subscribe({
      next: (status: any) => {
        if (status?.account_locked_until) {
          this.estadoCuenta = `Cuenta bloqueada hasta ${status.account_locked_until}`;
          this.estadoCuentaColor = '#c62828';
        } else {
          this.estadoCuenta = '';
          this.estadoCuentaColor = '#388e3c';
        }
        // iniciar login
        this.realizarLoginAvanzado();
      },
      error: () => {
        this.estadoCuenta = '';
        this.estadoCuentaColor = '#388e3c';
        this.realizarLoginAvanzado();
      }
    });
    this.subs.push(s);
  }

  realizarLoginAvanzado() {
    console.log('=== LOGIN COMPONENT DEBUG ===', { username: this.username, pwLen: this.password?.length });

    // ejecutar login
    this.isLoading = true;
    const s = this.auth.loginWithUserPassAdvanced(this.username, this.password).pipe(take(1)).subscribe({
      next: (res: any) => {
        console.log('Respuesta login:', res);

        // Helpers para variantes
        const getMsg = (r: any) => r?.message || r?.msg || r?.detail || null;
        const hasRequireToken = (r: any) => !!(r?.require_token || r?.requires_token || r?.token_required);
        const hasRequire2fa = (r: any) => !!(r?.require_2fa || r?.requires_2fa || r?.two_factor_enabled);
        const hasMustChangePassword = (r: any) => !!(r?.must_change_password || r?.must_change_pass);
        const extractTokens = (r: any) => {
          return {
            access: r?.access || r?.access_token || r?.token || null,
            refresh: r?.refresh || r?.refresh_token || r?.refreshToken || null
          };
        };

        // 1) if backend asks for email token
        if (hasRequireToken(res) || (getMsg(res) && /token/i.test(getMsg(res)))) {
          this.mostrarTokenCorreo = true;
          this.mostrarToken2FA = false;
          this.credencialesGuardadas = { username: this.username, password: this.password };
          this.mensaje = getMsg(res) || 'Se requiere token enviado por correo';
          // opcional: mostrar correo parcialmente si el backend lo devuelve
          const sent = res?.sent_to || res?.sentTo || res?.to || null;
          this.sentToMasked = sent ? this.maskEmail(sent) : null;
          this.isLoading = false;
          return;
        }

        // 2) if backend says must change password
        if (hasMustChangePassword(res)) {
          this.isLoading = false;
          this.mensaje = getMsg(res) || 'Debe cambiar la contraseña';
          // redirigir al reset-password con query (puedes ajustar)
          this.router.navigate(['/reset-password'], { queryParams: { username: this.username } });
          return;
        }

        // 3) 2FA required
        if (hasRequire2fa(res)) {
          this.mostrarTokenCorreo = false;
          this.mostrarToken2FA = true;
          this.credencialesGuardadas = { username: this.username, password: this.password };
          this.mensaje = getMsg(res) || 'Ingresa el código 2FA.';
          this.isLoading = false;
          return;
        }

        // 4) tokens directly
        const toks = extractTokens(res);
        if (toks.access && toks.refresh) {
          this.handleTokensAndDecide(toks.access, toks.refresh);
          return;
        }

        // 5) fallback: if error-like
        const errMsg = getMsg(res) || res?.error || res?.errors;
        if (errMsg) {
          this.error = typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg);
          this.isLoading = false;
          return;
        }

        // 6) último recurso: mostrar JSON crudo para debugging
        try {
          this.error = JSON.stringify(res);
        } catch (e) {
          this.error = 'Respuesta inesperada del servidor (no se pudo parsear)';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('LOGIN ERROR:', err);
        const getErrMsg = (e: any) => e?.error?.message || e?.error?.msg || e?.error?.detail || e?.message || null;
        this.error = getErrMsg(err) || (err?.error ? JSON.stringify(err.error) : 'Error en login');
        this.isLoading = false;
      }
    });
    this.subs.push(s);
}

  private handleTokensAndDecide(access: string, refresh: string) {
    try {
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
    } catch (e) {
      console.warn('No se pudo escribir en localStorage', e);
    }

    // Consultar /me/ para obtener flags reales y decidir el flujo, con timeout
    const s = this.userService.getCurrentUser().pipe(timeout(3000), take(1), catchError(err => {
      console.warn('Login: /me/ falló o timeout, proceder con token local', err);
      return of(null);
    })).subscribe((me: any) => {
      // si /me/ indica email pendiente -> navegar a verify-email
      const emailVerifiedFlags = ['email_verified','is_email_verified','verified','is_verified','email_confirmed'];
      let emailVerifiedPresent = false;
      let emailVerified = true;
      if (me) {
        for (const f of emailVerifiedFlags) {
          if (f in me) {
            emailVerifiedPresent = true;
            if (!me[f]) emailVerified = false;
          }
        }
      }

      const requires2faFlags = ['require_2fa','requires_2fa','two_factor_enabled','2fa_enabled'];
      let requires2fa = false;
      if (me) {
        for (const f of requires2faFlags) {
          if (f in me && !!me[f]) requires2fa = true;
        }
      }

      if (emailVerifiedPresent && !emailVerified) {
        const query: any = {};
        if (me?.email) query.email = me.email;
        this.isLoading = false;
        this.router.navigate(['/verify-email'], { queryParams: query });
        return;
      }

      if (requires2fa) {
        this.isLoading = false;
        this.mostrarToken2FA = true;
        this.credencialesGuardadas = { username: this.username, password: this.password };
        this.mensaje = 'Ingresa el código 2FA.';
        return;
      }

      // Si todo OK -> redirigir por role extraído del token
      const user = this.auth.getUserFromToken();
      const role = (user && (user as any).role) || (user && (user as any).roles && (user as any).roles[0]);
      if (role) {
        const r = role.toString().toUpperCase();
        if (r === 'ADMIN' || r === 'ADMINISTRADOR') { this.isLoading = false; this.router.navigate(['/dashboard/administrador']); return; }
        if (r === 'JUNTA') { this.isLoading = false; this.router.navigate(['/dashboard/junta']); return; }
        if (r === 'PERSONAL') { this.isLoading = false; this.router.navigate(['/dashboard/personal']); return; }
        if (r === 'RESIDENTE') { this.isLoading = false; this.router.navigate(['/dashboard/residente']); return; }
      }

      this.isLoading = false;
      this.router.navigate([this.returnUrl]);
    });
    this.subs.push(s);
  }

  verificarTokenCorreo() {
    const now = Date.now();
    if (this.tokenCorreoBloqueadoHasta && now < this.tokenCorreoBloqueadoHasta) {
      const sLeft = Math.ceil((this.tokenCorreoBloqueadoHasta - now) / 1000);
      this.mensaje = `Demasiados intentos fallidos. Intenta en ${sLeft} segundos.`;
      return;
    }

    if (!this.tokenCorreo) {
      this.mensaje = 'Por favor ingresa el token.';
      return;
    }
    // Validación cliente: OTP de 6 dígitos
    if (!/^\d{6}$/.test(this.tokenCorreo.trim())) {
      this.mensaje = 'El token debe ser un código numérico de 6 dígitos.';
      return;
    }
    if (!this.credencialesGuardadas) {
      this.mensaje = 'No hay credenciales guardadas para validar el token.';
      return;
    }
    this.isLoading = true;
    const s = this.auth.validateTokenCorreo(this.credencialesGuardadas.username, this.tokenCorreo).pipe(take(1), timeout(3000), catchError(err => of({ error: 'timeout_or_error' }))).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // 2FA next
        if (res?.require_2fa || res?.requires_2fa) {
          this.mostrarTokenCorreo = false;
          this.mostrarToken2FA = true;
          this.mensaje = res?.message || res?.msg || 'Ingresa el código 2FA de tu app.';
          return;
        }

        // QR for activating 2FA
        if (res?.qr_url) {
          this.mostrarTokenCorreo = false;
          this.mostrarQR = true;
          this.qrImageUrl = res.qr_url;
          this.mensaje = res?.message || res?.msg || 'Escanea el QR y luego ingresa el código 2FA.';
          return;
        }

        // extract tokens with synonyms
        const access = res?.access || res?.access_token || res?.token || null;
        const refresh = res?.refresh || res?.refresh_token || res?.refreshToken || null;
        if (access && refresh) {
          // reset contador en éxito
          this.tokenCorreoIntentos = 0;
          this.tokenCorreoBloqueadoHasta = null;
          this.handleTokensAndDecide(access, refresh);
          return;
        }

        // message or error
        const msg = res?.message || res?.msg || res?.detail;
        if (msg) {
          // contar esto como fallo si viene del backend como error de token
          if (/invalid|incorrect|inválid|incorrecto/i.test(msg)) {
            this.tokenCorreoIntentos += 1;
            if (this.tokenCorreoIntentos >= 5) {
              // bloquear por 60 segundos
              this.tokenCorreoBloqueadoHasta = Date.now() + 60_000;
              this.mensaje = 'Demasiados intentos fallidos. Intenta de nuevo en 60 segundos.';
              return;
            }
          }
          this.mensaje = msg;
          // mostrar correo parcialmente si backend lo devuelve
          const sent = res?.sent_to || res?.sentTo || res?.to || null;
          this.sentToMasked = sent ? this.maskEmail(sent) : null;
          return;
        }

        // fallback show raw JSON
        // contar como fallo genérico
        this.tokenCorreoIntentos += 1;
        if (this.tokenCorreoIntentos >= 5) {
          this.tokenCorreoBloqueadoHasta = Date.now() + 60_000;
          this.mensaje = 'Demasiados intentos fallidos. Intenta de nuevo en 60 segundos.';
          return;
        }
        try {
          this.error = JSON.stringify(res);
        } catch (e) {
          this.error = res?.error || 'Respuesta inesperada del servidor';
        }
      },
      error: (err) => {
        this.isLoading = false;
        // contar intento fallido
        this.tokenCorreoIntentos += 1;
        if (this.tokenCorreoIntentos >= 5) {
          this.tokenCorreoBloqueadoHasta = Date.now() + 60_000;
          this.mensaje = 'Demasiados intentos fallidos. Intenta de nuevo en 60 segundos.';
          return;
        }
        this.error = err?.error?.message || err?.error?.msg || err?.message || 'Token inválido o error en login.';
      }
    });
    this.subs.push(s);
  }

  verificarCodigo2FA() {
    if (!this.codigo2FA) {
      this.mensaje = 'Por favor ingresa el código 2FA.';
      return;
    }
    if (!this.credencialesGuardadas) {
      this.mensaje = 'No hay credenciales guardadas para validar el código.';
      return;
    }
    const payload = {
      username: this.credencialesGuardadas.username,
      code: this.codigo2FA
    };
    this.isLoading = true;
    const s = this.auth.validateCodigo2FA(payload).pipe(take(1), timeout(3000), catchError(err => of({ error: 'timeout_or_error' }))).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // accept token synonyms
        const access = res?.access || res?.access_token || res?.token || null;
        const refresh = res?.refresh || res?.refresh_token || res?.refreshToken || null;
        if (access && refresh) {
          this.handleTokensAndDecide(access, refresh);
          return;
        }

        // if server still requires 2FA
        if (res?.require_2fa || res?.requires_2fa) {
          this.mostrarToken2FA = true;
          this.mensaje = res?.message || res?.msg || 'Ingresa el código 2FA.';
          return;
        }

        const msg = res?.message || res?.msg || res?.detail;
        if (msg) {
          this.mensaje = msg;
          return;
        }

        try {
          this.error = JSON.stringify(res) || 'Código 2FA incorrecto.';
        } catch (e) {
          this.error = res?.error || 'Código 2FA incorrecto.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.message || err?.error?.msg || err?.message || 'Código 2FA incorrecto.';
      }
    });
    this.subs.push(s);
  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}