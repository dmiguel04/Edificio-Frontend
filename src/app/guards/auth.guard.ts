
import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private isBrowser: boolean;

  constructor(
    private auth: AuthService, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Métodos auxiliares para localStorage seguros para SSR
  private getFromStorage(key: string): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(key);
    }
    return null;
  }

  private removeFromStorage(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    }
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> {
    
    // En el servidor, siempre denegar acceso
    if (!this.isBrowser) {
      return this.router.createUrlTree(['/login']);
    }
    
    // Reusar lógica de AuthService para obtener user desde token
    if (this.auth.isLoggedIn()) {
      const user = this.auth.getUserFromToken();
      if (!user) {
        // Token inválido/dañado
        this.auth.clearTokens();
        return this.router.createUrlTree(['/login'], { queryParams: { message: 'Sesión inválida, inicia sesión nuevamente' } });
      }
      // Token válido y no expirado según isLoggedIn()
      return true;
    }
    
    // No autenticado, redirigir al login con la URL de retorno
    console.log('Usuario no autenticado, redirigiendo al login');
    return this.router.createUrlTree(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      // Si no se puede decodificar el token, considerarlo expirado
      return true;
    }
  }
}
