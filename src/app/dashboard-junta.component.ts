import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-junta',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div style="max-width:900px;margin:2rem auto;padding:2rem;background:#fff;border-radius:8px;">
      <h1>Dashboard - Junta</h1>
      <p>Panel de control para la junta.</p>
    </div>
  `
})
export class DashboardJuntaComponent {}
