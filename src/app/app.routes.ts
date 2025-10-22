import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardAdministradorComponent } from './dashboard/dashboard-administrador.component';
import { DashboardJuntaComponent } from './dashboard/dashboard-junta.component';
import { DashboardPersonalComponent } from './dashboard/dashboard-personal.component';
import { DashboardResidenteComponent } from './dashboard/dashboard-residente.component';
import { roleGuardFactory } from './guards/role.guard';
import { WelcomeComponent } from './welcome/welcome.component';
import { PerfilComponent } from './perfil/perfil.component';
import { AuditoriaComponent } from './auditoria/auditoria.component';
import { DebugTokenComponent } from './debug/debug-token.component';

export const routes: Routes = [
  // Rutas públicas (solo para usuarios NO autenticados)
  { 
    path: '', 
    component: WelcomeComponent, 
    canActivate: [GuestGuard] 
  },
  { 
    path: 'login', 
    component: LoginComponent, 
    canActivate: [GuestGuard] 
  },
  { 
    path: 'register', 
    component: RegisterComponent, 
    canActivate: [GuestGuard] 
  },
  { 
    path: 'verify-email', 
    component: VerifyEmailComponent, 
    canActivate: [GuestGuard] 
  },
  { 
    path: 'forgot-password', 
    component: ForgotPasswordComponent, 
    canActivate: [GuestGuard] 
  },
  { 
    path: 'reset-password', 
    component: ResetPasswordComponent, 
    canActivate: [GuestGuard] 
  },

  // Rutas protegidas (solo para usuarios autenticados)
  // Nota: ruta genérica de dashboard eliminada para forzar redirección por rol
  { path: 'dashboard/administrador', component: DashboardAdministradorComponent, canActivate: [AuthGuard, roleGuardFactory(['ADMIN'])] },
  { path: 'dashboard/junta', component: DashboardJuntaComponent, canActivate: [AuthGuard, roleGuardFactory(['JUNTA','ADMIN'])] },
  { path: 'dashboard/personal', component: DashboardPersonalComponent, canActivate: [AuthGuard] },
  { path: 'dashboard/residente', component: DashboardResidenteComponent, canActivate: [AuthGuard] },
  { 
    path: 'perfil', 
    component: PerfilComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'auditoria', 
    component: AuditoriaComponent, 
    canActivate: [AuthGuard] 
  },
  { path: 'debug/token', component: DebugTokenComponent, canActivate: [AuthGuard] },

  // Redirección por defecto para rutas no encontradas
  { 
    path: '**', 
    redirectTo: ''
  }
];