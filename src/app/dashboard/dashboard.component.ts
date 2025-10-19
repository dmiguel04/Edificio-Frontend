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
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Redirigir según role si está disponible en el token
    try {
      const role = this.auth.getUserRole();
      if (role) {
        const key = role.toString().toLowerCase();
        if (key.includes('residente')) { this.router.navigate(['/dashboard/residente']); return; }
        if (key.includes('personal')) { this.router.navigate(['/dashboard/personal']); return; }
        if (key.includes('junta')) { this.router.navigate(['/dashboard/junta']); return; }
        if (key.includes('administrador') || key.includes('admin')) { this.router.navigate(['/dashboard/administrador']); return; }
      }
    } catch (e) {
      console.warn('No se pudo redirigir por role:', e);
    }
  }

  goToPerfil() {
    this.router.navigate(['/perfil']);
  }

  goToAuditoria() {
    this.router.navigate(['/auditoria']);
  }

  logout() {
    console.log('🚪 LOGOUT ULTRA-RÁPIDO ANTI-BROKEN-PIPE');
    
    // Timeout ultra-agresivo para evitar cualquier cuelgue
    const ultraTimeout = setTimeout(() => {
      console.log('⚡ Ultra-timeout activado - Redirección inmediata');
      this.router.navigate(['/login']);
    }, 600); // Solo 600ms para evitar broken pipes
    
    this.auth.logout().subscribe({
      next: (response: any) => {
        clearTimeout(ultraTimeout);
        console.log('✅ Logout completado sin broken pipes:', response);
        
        // Log del método usado
        if (response.method) {
          console.log(`🎯 Método de logout: ${response.method}`);
        }
        
        // Si hay error de backend pero logout local exitoso, es normal
        if (response.backend_error) {
          console.log('ℹ️ Backend tuvo problemas pero logout local exitoso (esperado)');
        }
        
        // Redirección inmediata
        this.router.navigate(['/login']);
      },
      error: (error) => {
        // Este bloque NO debería ejecutarse nunca con la nueva implementación
        clearTimeout(ultraTimeout);
        console.log('🚨 Error inesperado en logout ultra-optimizado:', error);
        this.router.navigate(['/login']);
      }
    });
  }
}
