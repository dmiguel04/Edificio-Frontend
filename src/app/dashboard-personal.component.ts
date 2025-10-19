import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-personal',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div style="max-width:900px;margin:2rem auto;padding:2rem;background:#fff;border-radius:8px;">
      <h1>Dashboard - Personal</h1>
      <p>Herramientas y paneles para el personal.</p>
    </div>
  `
})
export class DashboardPersonalComponent {}
