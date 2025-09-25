import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  private isBrowser: boolean;

  constructor(
    private auth: AuthService, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> {
    
    // En el servidor, siempre permitir acceso a rutas de invitado
    if (!this.isBrowser) {
      return true;
    }
    
    // Si el usuario NO está logueado, permitir acceso
    if (!this.auth.isLoggedIn()) {
      return true;
    }
    
    // Si está logueado, redirigir al dashboard
    console.log('Usuario ya autenticado, redirigiendo al dashboard');
    return this.router.createUrlTree(['/dashboard']);
  }
}