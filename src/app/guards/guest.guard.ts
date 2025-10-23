import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { UserService } from '../services/user.service';
import { map, catchError, timeout } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  private isBrowser: boolean;

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> {
    
    // SSR: permitir rutas de invitado en servidor
    if (!this.isBrowser) {
      return true;
    }

    // Si no está autenticado, permitir acceso a páginas de invitado
    if (!this.auth.isLoggedIn()) return true;

    // Si hay token, verificar con backend /me/ (timeout para evitar bloqueos)
    return this.userService.getCurrentUser().pipe(
      timeout(3000),
      map((user: any) => {
        // Si la API confirma el usuario, primero verificar que esté "completamente" autenticado
        // (email verificado, cuenta activa y sin requerir verificación adicional como 2FA).

        // Comprobaciones comunes que indican que el usuario NO está listo para acceso directo:
        const active = (user?.is_active ?? user?.active ?? true);
        const emailVerifiedFlags = ['email_verified','is_email_verified','verified','is_verified','email_confirmed'];
        let emailVerifiedPresent = false;
        let emailVerified = true;
        for (const f of emailVerifiedFlags) {
          if (f in user) {
            emailVerifiedPresent = true;
            if (!user[f]) emailVerified = false;
          }
        }
        const requires2faFlags = ['require_2fa','requires_2fa','two_factor_enabled','2fa_enabled'];
        let requires2fa = false;
        for (const f of requires2faFlags) {
          if (f in user && !!user[f]) requires2fa = true;
        }

      // Si la cuenta está inactiva, o el email está presente y NO verificado, o requiere 2FA -> no redirigir
      if (!active || (emailVerifiedPresent && !emailVerified) || requires2fa) {
        console.log('GuestGuard: usuario no completamente verificado (activo/email/2fa), permitiendo ruta de invitado');
        this.auth.clearTokens();
        return true;
      }

      // Redirigir por rol si todo OK
      const role = user?.role || (user?.roles && user.roles[0]);
      if (role) {
        const r = role.toString().toUpperCase();
        if (r === 'ADMIN' || r === 'ADMINISTRADOR') return this.router.createUrlTree(['/dashboard/administrador']);
        if (r === 'JUNTA') return this.router.createUrlTree(['/dashboard/junta']);
        if (r === 'PERSONAL') return this.router.createUrlTree(['/dashboard/personal']);
        if (r === 'RESIDENTE') return this.router.createUrlTree(['/dashboard/residente']);
      }

      // Si no hay role, redirigir a raíz
      return this.router.createUrlTree(['/']);
    }),
    catchError((err) => {
      // Si la verificación falla (token inválido/expirado/timeout), borrar tokens y permitir la ruta
      console.warn('GuestGuard: token inválido o /me/ falló o timeout, permitiendo acceso a ruta de invitado', err);
      this.auth.clearTokens();
      return of(true);
    })
    );
  }
}