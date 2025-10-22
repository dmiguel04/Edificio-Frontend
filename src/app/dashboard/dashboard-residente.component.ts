import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-residente',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-shell">
      <h2>Panel Residente</h2>
      <p>Interfaz para residentes.</p>
    </div>
  `
})
export class DashboardResidenteComponent {}
