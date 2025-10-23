import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * RoleGuard usable as a function guard in standalone routing.
 * Usage: { canActivate: [roleGuardFactory(['ADMIN'])] }
 */
export function roleGuardFactory(allowedRoles: string[]): CanActivateFn {
  return () => {
    try {
      const auth = inject(AuthService);
      const router = inject(Router);

      // En SSR no hay localStorage — denegar y redirigir al login
      const user = auth.getUserFromToken();
      if (!user) return false;
      const role = user.role || (user.roles && user.roles[0]);
      if (!role) return false;
      return allowedRoles.map(r => r.toUpperCase()).includes(role.toString().toUpperCase());
    } catch (e) {
      return false;
    }
  };
}
