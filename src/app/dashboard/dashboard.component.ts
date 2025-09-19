import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <nav style="width:100%; background:#1976d2; color:white; padding:1rem 0; display:flex; justify-content:center; align-items:center; gap:2rem; font-size:1.1rem;">
      <span style="font-weight:bold; letter-spacing:1px;">MiApp</span>
      <a href="#" style="color:white; text-decoration:none;">Inicio</a>
      <a routerLink="/perfil" style="color:white; text-decoration:none;">Perfil</a>
  <button (click)="goToAuditoria()" style="background:#fff; color:#1976d2; border:none; border-radius:5px; padding:0.5rem 1.2rem; font-weight:bold; cursor:pointer; transition:background 0.2s;">Auditoría</button>
      <a href="#" style="color:white; text-decoration:none;" (click)="logout()">Cerrar sesión</a>
    </nav>
    <div style="max-width: 600px; margin: 3rem auto; padding: 2rem; border-radius: 12px; background: #fff; color: #222; box-shadow: 0 2px 12px #0002; text-align:center;">
      <h2 style="color:#1976d2;">Bienvenido al Dashboard</h2>
      <p>¡Has iniciado sesión correctamente!</p>
    </div>
  `
})
export class DashboardComponent {
  goToAuditoria() {
    this.router.navigate(['/auditoria']);
  }
  constructor(private auth: AuthService, private router: Router) {}

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']) // Redirige aunque falle el backend
    });
  }
}
