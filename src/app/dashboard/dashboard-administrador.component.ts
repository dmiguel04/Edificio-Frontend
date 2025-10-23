import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../services';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard-administrador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-administrador.component.html',
  styleUrls: ['./dashboard-administrador.component.scss']
})
export class DashboardAdministradorComponent implements OnInit {
  users: any[] = [];
  loading = false;
  isAdmin = false;
  createError: string | null = null;
  createSuccess = false;

  private userService: UserService = inject(UserService);
  private toast: ToastService = inject(ToastService);
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadUsers();
    // Intent: determinar rol del usuario actual para condicionar la UI
    try {
      const tokenUser = JSON.parse(atob((localStorage.getItem('access') || '').split('.')[1] || '{}'));
      const role = (tokenUser as any).role || (tokenUser as any).roles?.[0];
      this.isAdmin = role && (role.toString().toUpperCase() === 'ADMIN' || role.toString().toUpperCase() === 'ADMINISTRADOR');
    } catch (e) {
      this.isAdmin = false;
    }
  }

  loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (resp: any) => {
        this.users = Array.isArray(resp) ? resp : resp.results || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toast.show('Error cargando usuarios', 'error');
      }
    });
  }

  assignRole(userId: number, role: string) {
    this.userService.assignRole(userId, role).subscribe({
      next: () => {
        this.toast.show('Rol asignado', 'success');
        this.loadUsers();
      },
      error: (err) => {
        if (err?.status === 403) this.toast.show('No autorizado para asignar roles', 'error');
        else this.toast.show('Error asignando rol', 'error');
      }
    });
  }

  setActive(userId: number, activo: boolean) {
    this.userService.setActive(userId, activo).subscribe({
      next: () => {
        this.toast.show('Estado actualizado', 'success');
        this.loadUsers();
      },
      error: (err) => {
        if (err?.status === 403) this.toast.show('No autorizado para cambiar estado', 'error');
        else this.toast.show('Error al cambiar estado', 'error');
      }
    });
  }

  // Devuelve un rol legible a partir del objeto usuario (soporta varias claves: role, roles, rol)
  getUserRole(u: any): string {
    if (!u) return '';
    const r = u.role || u.rol || (u.roles && u.roles[0]) || (u.roles && u.roles.length && u.roles[0]) || null;
    if (!r) return '—';
    return typeof r === 'string' ? r.toUpperCase() : (r.toString ? r.toString().toUpperCase() : '—');
  }

  onCreate(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const payload: any = {
      username: (formData.get('username') || '').toString(),
      email: (formData.get('email') || '').toString(),
      password: (formData.get('password') || '').toString(),
      role: (formData.get('role') || '').toString()
    };

    this.createError = null;
    this.createSuccess = false;

    this.userService.createUser(payload).subscribe({
      next: () => {
        this.createSuccess = true;
        this.toast.show('Usuario creado', 'success');
        this.loadUsers();
        form.reset();
      },
      error: (err) => {
        if (err?.status === 403) this.toast.show('No autorizado para crear usuarios', 'error');
        else this.toast.show(err?.error?.detail || 'Error al crear usuario', 'error');
        this.createError = err?.error?.detail || err?.message || 'Error al crear usuario';
      }
    });
  }

  // Navegación y utilidades similares al dashboard principal
  goToPerfil() {
    this.router.navigate(['/perfil']);
  }

  goToAuditoria() {
    this.router.navigate(['/auditoria']);
  }

  logout() {
    // Reutiliza el comportamiento safe del AuthService
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
