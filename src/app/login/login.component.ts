import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent {
  mostrarQR: boolean = false;
  qrImageUrl: string = '';
  tokenCorreo: string = '';
  private estadoCuentaInterval: any;

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
  }
  token: string = '';
  codigo2FA: string = '';
  mostrarPassword = false;
  username: string = '';
  password: string = '';
  email: string = '';
  captcha: string = '';
  mensaje: string = '';
  captchaPregunta: string = '';
  captchaRespuesta: string = '';
  mostrarTokenCorreo: boolean = false;
  mostrarToken2FA: boolean = false;
  credencialesGuardadas: { username: string; password: string } | null = null;
  error: string = '';
  estadoCuenta: string = '';
  estadoCuentaColor: string = '#388e3c'; // Verde por defecto

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.generarCaptcha();
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
    this.auth.checkAccountStatus(this.username).subscribe({
      next: (status: any) => {
        if (status.account_locked_until) {
          this.estadoCuenta = `Cuenta bloqueada hasta ${status.account_locked_until}`;
          this.estadoCuentaColor = '#c62828';
        } else {
          this.estadoCuenta = '';
          this.estadoCuentaColor = '#388e3c';
        }
        this.realizarLoginAvanzado();
      },
      error: () => {
        this.estadoCuenta = '';
        this.estadoCuentaColor = '#388e3c';
        this.realizarLoginAvanzado();
      }
    });
  }

  realizarLoginAvanzado() {
    // Paso 1: login normal
    this.auth.loginWithUserPassAdvanced(this.username, this.password).subscribe({
      next: (res: any) => {
        console.log('Respuesta login:', res);
        if (res.access && res.refresh) {
          localStorage.setItem('access', res.access);
          localStorage.setItem('refresh', res.refresh);
          this.router.navigate(['/dashboard']);
          return;
        }
        if (res.msg && res.username) {
          this.mostrarTokenCorreo = true;
          this.mostrarToken2FA = false;
          this.credencialesGuardadas = { username: this.username, password: this.password };
          this.mensaje = res.msg;
          return;
        }
        if (res.require_2fa) {
          this.mostrarTokenCorreo = false;
          this.mostrarToken2FA = true;
          this.credencialesGuardadas = { username: this.username, password: this.password };
          this.mensaje = 'Ingresa el código 2FA.';
          return;
        }
        if (res.error) {
          this.error = res.error;
          return;
        }
        this.error = 'Respuesta inesperada del servidor';
      },
      error: (err) => {
        this.error = err.error?.error || 'Error en login';
      }
    });
}

  verificarTokenCorreo() {
    if (!this.tokenCorreo) {
      this.mensaje = 'Por favor ingresa el token.';
      return;
    }
    if (!this.credencialesGuardadas) {
      this.mensaje = 'No hay credenciales guardadas para validar el token.';
      return;
    }
    this.auth.validateTokenCorreo(this.credencialesGuardadas.username, this.tokenCorreo).subscribe({
      next: (res: any) => {
        if (res.require_2fa) {
          this.mostrarTokenCorreo = false;
          this.mostrarToken2FA = true;
          this.mensaje = 'Ingresa el código 2FA de tu app.';
        } else if (res.qr_url) {
          this.mostrarTokenCorreo = false;
          this.mostrarQR = true;
          this.qrImageUrl = res.qr_url;
          this.mensaje = 'Escanea el QR y luego ingresa el código 2FA.';
        } else if (res.access) {
          localStorage.setItem('access', res.access);
          localStorage.setItem('refresh', res.refresh);
          this.mensaje = 'Login exitoso';
          this.error = '';
          this.router.navigate(['/dashboard']);
        } else {
          this.error = res.error || 'Respuesta inesperada del servidor';
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Token inválido o error en login.';
      }
    });
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
    this.auth.validateCodigo2FA(payload).subscribe({
      next: (res: any) => {
        if (res.access) {
          localStorage.setItem('access', res.access);
          localStorage.setItem('refresh', res.refresh);
          this.mensaje = 'Login exitoso';
          this.error = '';
          this.router.navigate(['/dashboard']);
        } else {
          this.error = res.error || 'Código 2FA incorrecto.';
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Código 2FA incorrecto.';
      }
    });
  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}