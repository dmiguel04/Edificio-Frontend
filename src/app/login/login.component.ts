import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  mostrarPassword = false;
  username = '';
  password = '';
  email = '';
  captcha = '';
  mensaje = '';
  captchaPregunta = '';
  captchaRespuesta = '';
  token = '';
  mostrarToken = false;
  credencialesGuardadas: any = null;

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

    this.http.post('http://localhost:8000/api/usuarios/login/', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res: any) => {
        this.credencialesGuardadas = { username: this.username, password: this.password };
        this.mostrarToken = true;
        this.mensaje = 'Se ha enviado un token a tu correo. Ingresa el token para continuar.';
      },
      error: (err) => {
        const errorMsg = (err.error && (typeof err.error === 'string' ? err.error : JSON.stringify(err.error))) || 'Error en login.';
        this.mensaje = errorMsg;
        this.generarCaptcha();
      }
    });
  }

  verificarToken() {
    if (!this.token) {
      this.mensaje = 'Por favor ingresa el token.';
      return;
    }
    // Llama al endpoint para validar el token
    this.http.post('http://localhost:8000/api/usuarios/validate-login-token/', {
      username: this.credencialesGuardadas.username,
      token: this.token
    }).subscribe({
      next: (res: any) => {
        this.mensaje = 'Login exitoso';
        this.mostrarToken = false;
        // Aquí puedes guardar el JWT si lo necesitas
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 800);
      },
      error: (err) => {
        this.mensaje = (err.error && (typeof err.error === 'string' ? err.error : JSON.stringify(err.error))) || 'Token inválido o error en login.';
      }
    });
  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}