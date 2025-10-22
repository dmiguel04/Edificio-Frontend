import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-personal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-shell">
      <h2>Panel Personal</h2>
      <p>Interfaz para el personal del edificio.</p>
    </div>
  `
})
export class DashboardPersonalComponent {}
