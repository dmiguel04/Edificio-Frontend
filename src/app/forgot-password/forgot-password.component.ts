import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 350px; margin: 3rem auto; padding: 2rem; border-radius: 12px; background: #fff; color: #222; box-shadow: 0 2px 12px #0002;">
      <h2 style="text-align:center; color:#1976d2;">Recuperar contraseña</h2>
      <form (ngSubmit)="enviarCorreo()" #form="ngForm" style="display: flex; flex-direction: column; gap: 1.2rem;">
        <div>
          <label for="email">Correo electrónico:</label>
          <input id="email" name="email" [(ngModel)]="email" required type="email" style="width:100%; padding:0.5rem; border-radius:6px; background:#fff; color:#222; border:1px solid #ccc;">
        </div>
        <button type="submit" [disabled]="form.invalid" style="background:#1976d2; color:white; border:none; border-radius:6px; padding:0.7rem; font-size:1rem; cursor:pointer;">Enviar código</button>
      </form>
      <p style="text-align:center; color:#388e3c; margin-top:1rem;" *ngIf="mensaje">{{ mensaje }}</p>
      <p style="text-align:center; color:#d32f2f; margin-top:1rem;" *ngIf="error">{{ error }}</p>
    </div>
  `
})
export class ForgotPasswordComponent {
  email = '';
  mensaje = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  enviarCorreo() {
    this.mensaje = '';
    this.error = '';
    this.auth.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.mensaje = 'Correo de recuperación enviado. Revisa tu bandeja.';
        setTimeout(() => {
          this.router.navigate(['/reset-password']);
        }, 1200);
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al enviar el correo.';
      }
    });
  }
}
