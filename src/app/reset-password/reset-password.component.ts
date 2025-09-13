import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 350px; margin: 3rem auto; padding: 2rem; border-radius: 12px; background: #fff; color: #222; box-shadow: 0 2px 12px #0002;">
      <h2 style="text-align:center; color:#1976d2;">Restablecer contraseña</h2>
      <form (ngSubmit)="resetPassword()" #form="ngForm" style="display: flex; flex-direction: column; gap: 1.2rem;">
        <div>
          <label for="token">Código de verificación:</label>
          <input id="token" name="token" [(ngModel)]="token" required style="width:100%; padding:0.5rem; border-radius:6px; background:#fff; color:#222; border:1px solid #ccc;">
        </div>
        <div>
          <label for="newPassword">Nueva contraseña:</label>
          <input id="newPassword" name="newPassword" [(ngModel)]="newPassword" required type="password" style="width:100%; padding:0.5rem; border-radius:6px; background:#fff; color:#222; border:1px solid #ccc;">
        </div>
        <button type="submit" [disabled]="form.invalid" style="background:#1976d2; color:white; border:none; border-radius:6px; padding:0.7rem; font-size:1rem; cursor:pointer;">Restablecer</button>
      </form>
      <p style="text-align:center; color:#388e3c; margin-top:1rem;" *ngIf="mensaje">{{ mensaje }}</p>
      <p style="text-align:center; color:#d32f2f; margin-top:1rem;" *ngIf="error">{{ error }}</p>
    </div>
  `
})
export class ResetPasswordComponent {
  token = '';
  newPassword = '';
  mensaje = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  resetPassword() {
    this.mensaje = '';
    this.error = '';
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: (res) => {
        this.mensaje = 'Contraseña restablecida correctamente.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500); // Espera 1.5 segundos para mostrar el mensaje
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al restablecer la contraseña.';
      }
    });
  }
}
