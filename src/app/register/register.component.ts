import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnDestroy {
  persona = {
    nombre: '',
    apellido: '',
    ci: '',
    email: '',
    sexo: '',
    telefono: '',
    fecha_nacimiento: ''
  };
  username = '';
  password = '';
  mensaje = '';
  error = '';
  mostrarPassword = false;
  private loginTimeout: any = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  registrar() {
    this.mensaje = '';
    this.error = '';
    const body = {
      persona: this.persona,
      username: this.username,
      password: this.password
    };
    this.auth.register(body).subscribe({
      next: (res: any) => {
        this.mensaje = 'Usuario registrado correctamente';
        this.error = '';
        // Login automático tras registro
        this.auth.loginWithUserPass(this.username, this.password).subscribe({
          next: (loginRes: any) => {
            if (loginRes.token) {
              this.auth.validateToken(this.username, loginRes.token).subscribe({
                next: () => {
                  this.router.navigate(['/dashboard']);
                },
                error: () => {
                  this.router.navigate(['/login']);
                }
              });
            } else if (loginRes.access) {
              localStorage.setItem('access', loginRes.access);
              localStorage.setItem('refresh', loginRes.refresh);
              this.router.navigate(['/dashboard']);
            } else {
              this.router.navigate(['/login']);
            }
          },
          error: () => {
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        if (err.error) {
          if (typeof err.error === 'string') {
            this.error = err.error;
          } else if (typeof err.error === 'object') {
            this.error = this.getFirstMessage(err.error);
          } else {
            this.error = 'Error en registro';
          }
        } else {
          this.error = 'Error en registro';
        }
      }
    });
  }

  private getFirstMessage(obj: any): string {
    if (!obj) return 'Error en registro';
    if (typeof obj === 'string') return obj;
    if (Array.isArray(obj)) return this.getFirstMessage(obj[0]);
    if (typeof obj === 'object') {
      const firstKey = Object.keys(obj)[0];
      return this.getFirstMessage(obj[firstKey]);
    }
    return 'Error en registro';
  }

  onVolver(): void {
  console.log('Click en Volver');
    if (this.loginTimeout) {
      clearTimeout(this.loginTimeout);
      this.loginTimeout = null;
    }
    this.mensaje = '';
    this.error = '';
    this.router.navigate(['/']);
}

  ngOnDestroy(): void {
    if (this.loginTimeout) {
      clearTimeout(this.loginTimeout);
    }
  }
}