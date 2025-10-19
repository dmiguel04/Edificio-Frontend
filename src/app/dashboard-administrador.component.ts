import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-administrador',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div style="max-width:900px;margin:2rem auto;padding:2rem;background:#fff;border-radius:8px;">
      <h1>Dashboard - Administrador</h1>
      <p>Herramientas administrativas y métricas.</p>
    </div>
  `
})
export class DashboardAdministradorComponent {}
