import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * RoleGuard usable as a function guard in standalone routing.
 * Usage: { canActivate: [roleGuardFactory(['ADMIN'])] }
 */
export function roleGuardFactory(allowedRoles: string[]): CanActivateFn {
  return () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) return false;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role || (payload.roles && payload.roles[0]);
      if (!role) return false;
      return allowedRoles.map(r => r.toUpperCase()).includes(role.toString().toUpperCase());
    } catch (e) {
      return false;
    }
  };
}
