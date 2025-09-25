import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo agregar token si estamos en el navegador
    let authReq = req;
    
    if (this.isBrowser) {
      const token = localStorage.getItem('access');
      
      if (token) {
        authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
      }
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Solo manejar errores de autenticación en el navegador
        if (this.isBrowser) {
          if (error.status === 401) {
            // Token inválido o expirado
            console.log('Interceptor: Token inválido, limpiando y redirigiendo');
            this.authService.clearTokens();
            this.router.navigate(['/login'], {
              queryParams: { message: 'Sesión expirada, por favor inicia sesión nuevamente' }
            });
          } else if (error.status === 403) {
            // Acceso denegado
            console.error('Interceptor: Acceso denegado:', error.error);
          }
        }

        return throwError(() => error);
      })
    );
  }
}