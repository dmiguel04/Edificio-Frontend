import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services';

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
export class DashboardComponent implements OnInit {
  private userService = inject(UserService);
  constructor(private auth: AuthService, private router: Router) {}

  userRole: string | null = null;

  ngOnInit(): void {
    // First: check token synchronously and redirect immediately if it contains role
    this.fallbackToToken();

    // Then: attempt to get current user from backend to reconcile and update role if needed
    this.userService.getCurrentUser().subscribe({
      next: (me: any) => {
        console.log('Dashboard ngOnInit: /me response ->', me);
        if (me && me.role) {
          this.userRole = me.role.toString().toUpperCase();
          console.log('Dashboard ngOnInit: detected role from /me ->', this.userRole);
          this.redirectByRole(this.userRole);
        } else if (me && me.roles) {
          this.userRole = Array.isArray(me.roles) ? me.roles[0].toString().toUpperCase() : me.roles.toString().toUpperCase();
          console.log('Dashboard ngOnInit: detected roles array from /me ->', this.userRole);
          this.redirectByRole(this.userRole);
        } else {
          this.fallbackToToken();
        }
      },
      error: () => this.fallbackToToken()
    });
  }

  private fallbackToToken() {
    const user = this.auth.getUserFromToken();
    console.log('Dashboard fallbackToToken: token user ->', user);
    if (user && (user as any).role) {
      this.userRole = (user as any).role.toString().toUpperCase();
      console.log('Dashboard fallbackToToken: detected role from token ->', this.userRole);
      this.redirectByRole(this.userRole);
    }
  }

  private redirectByRole(role: string | null) {
    if (!role) return;
    if (role === 'ADMIN' || role === 'ADMINISTRADOR') {
      this.router.navigate(['/dashboard/administrador']);
    } else if (role === 'JUNTA') {
      this.router.navigate(['/dashboard/junta']);
    } else if (role === 'PERSONAL') {
      this.router.navigate(['/dashboard/personal']);
    } else if (role === 'RESIDENTE') {
      this.router.navigate(['/dashboard/residente']);
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
