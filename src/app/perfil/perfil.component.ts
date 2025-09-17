import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 400px; margin: 2rem auto; padding: 2rem; border-radius: 12px; background: #fff; color: #222; box-shadow: 0 2px 12px #0002;">
      <h2 style="color:#1976d2; text-align:center;">Perfil de usuario</h2>
      <div *ngIf="!qrUrl && !twoFAEnabled">
        <button (click)="activar2FA()" style="background:#1976d2; color:white; border:none; border-radius:6px; padding:0.7rem 1.2rem; font-size:1rem; cursor:pointer; width:100%;">Activar 2FA</button>
      </div>
      <div *ngIf="qrUrl">
        <p>Escanea este QR con tu app de autenticación:</p>
        <img [src]="qrUrl" alt="QR 2FA" style="display:block; margin:1rem auto;" />
        <input [(ngModel)]="codigo2fa" placeholder="Código 2FA" style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid #ccc; margin-bottom:1rem;" />
        <button (click)="verificar2FA()" style="background:#388e3c; color:white; border:none; border-radius:6px; padding:0.7rem 1.2rem; font-size:1rem; cursor:pointer; width:100%;">Verificar</button>
      </div>
      <p *ngIf="twoFAEnabled" style="color:green; text-align:center;">2FA activado correctamente</p>
      <p *ngIf="mensaje" style="color:#1976d2; text-align:center;">{{ mensaje }}</p>
      <p *ngIf="error" style="color:#d32f2f; text-align:center;">{{ error }}</p>
    </div>
  `
})
export class PerfilComponent {
  qrUrl: string = '';
  codigo2fa: string = '';
  twoFAEnabled: boolean = false;
  mensaje: string = '';
  error: string = '';

  constructor(private auth: AuthService) {}

  activar2FA() {
    this.mensaje = '';
    this.error = '';
    this.auth.activate2FA().subscribe({
      next: (res: any) => {
        this.qrUrl = res.qr_url;
        this.mensaje = 'Escanea el QR y verifica con tu app.';
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al activar 2FA.';
      }
    });
  }

  verificar2FA() {
    this.mensaje = '';
    this.error = '';
    this.auth.verify2FA(this.codigo2fa).subscribe({
      next: () => {
        this.twoFAEnabled = true;
        this.qrUrl = '';
        this.codigo2fa = '';
        this.mensaje = '2FA activado correctamente';
      },
      error: (err) => {
        this.error = err.error?.error || 'Código 2FA incorrecto.';
      }
    });
  }
}
