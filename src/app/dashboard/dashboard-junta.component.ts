import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../services';

@Component({
  selector: 'app-dashboard-junta',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-shell">
      <h2>Panel Junta</h2>
      <p>Aquí puede gestionar creación de usuarios tipo Personal y Residente.</p>
    </div>
  `
})
export class DashboardJuntaComponent implements OnInit {
  private userService: UserService = inject(UserService);
  constructor() {}
  ngOnInit(): void {}
}
