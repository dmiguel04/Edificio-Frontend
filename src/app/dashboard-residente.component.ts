import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-residente',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div style="max-width:900px;margin:2rem auto;padding:2rem;background:#fff;border-radius:8px;">
      <h1>Dashboard - Residente</h1>
      <p>Contenido específico para residentes.</p>
    </div>
  `
})
export class DashboardResidenteComponent {}
