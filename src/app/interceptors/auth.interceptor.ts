import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
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

    // Intentar manejar 401 automáticamente: intentar refresh y reintentar la petición original
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!this.isBrowser) return throwError(() => error);

        if (error.status === 401) {
          // Intentar refresh token
          return from(this.authService.attemptTokenRefresh().toPromise()).pipe(
            switchMap((refreshResp: any) => {
              if (refreshResp && (refreshResp.access || refreshResp.access_token || refreshResp.token)) {
                // Hay un nuevo access, reintentar la petición original con nuevo token
                const newToken = localStorage.getItem('access');
                const retryReq = req.clone({ headers: req.headers.set('Authorization', `Bearer ${newToken}`) });
                return next.handle(retryReq);
              }
              // No se pudo refrescar: limpiar y redirigir
              this.authService.clearTokens();
              this.router.navigate(['/login'], { queryParams: { message: 'Sesión expirada, por favor inicia sesión nuevamente' } });
              return throwError(() => error);
            })
          );
        }

        if (error.status === 403) {
          console.error('Interceptor: Acceso denegado:', error.error);
        }

        return throwError(() => error);
      })
    );
  }
}