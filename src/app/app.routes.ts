import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardResidenteComponent } from './dashboard-residente.component';
import { DashboardPersonalComponent } from './dashboard-personal.component';
import { DashboardJuntaComponent } from './dashboard-junta.component';
import { DashboardAdministradorComponent } from './dashboard-administrador.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { PerfilComponent } from './perfil/perfil.component';
import { AuditoriaComponent } from './auditoria/auditoria.component';

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
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard] 
  },
  // Dashboards específicos por rol
  {
    path: 'dashboard/residente',
    component: DashboardResidenteComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/personal',
    component: DashboardPersonalComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/junta',
    component: DashboardJuntaComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/administrador',
    component: DashboardAdministradorComponent,
    canActivate: [AuthGuard]
  },
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

  // Redirección por defecto para rutas no encontradas
  { 
    path: '**', 
    redirectTo: ''
  }
];