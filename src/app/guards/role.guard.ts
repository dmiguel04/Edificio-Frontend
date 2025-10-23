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
      const rawRole = user.role || user.rol || (user.roles && user.roles[0]);
      if (!rawRole) return false;
      const roleStr = rawRole.toString().toUpperCase();
      // Normalizar: permitir variantes como ADMINISTRADOR que empiezan por ADMIN
      const normalizedAllowed = allowedRoles.map(r => r.toString().toUpperCase());
      // Match if role equals allowed role or startsWith allowed role (ADMINISTRADOR -> ADMIN)
      return normalizedAllowed.some(ar => roleStr === ar || roleStr.startsWith(ar));
    } catch (e) {
      return false;
    }
  };
}
