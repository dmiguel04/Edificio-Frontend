import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="auditoria-container">
      <h2>Auditoría de accesos y acciones</h2>
      <table *ngIf="logs.length > 0" class="auditoria-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Acción</th>
            <th>IP</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let log of logs">
            <td>{{ log.fecha | date:'short' }}</td>
            <td>{{ log.username }}</td>
            <td>{{ log.evento }}</td>
            <td>{{ log.ip }}</td>
            <td>{{ log.detalle }}</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="logs.length === 0" class="no-logs">No hay registros de auditoría.</div>
    </div>
  `,
  styleUrls: ['./auditoria.component.scss']
})
export class AuditoriaComponent implements OnInit, OnDestroy {
  logs: any[] = [];
  private refreshInterval: any;

  isBrowser: boolean;
  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.cargarAuditoria();
      this.refreshInterval = setInterval(() => this.cargarAuditoria(), 3000);
    }
  }

  ngOnDestroy() {
    if (this.isBrowser && this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  cargarAuditoria() {
    this.http.get<any[]>('http://localhost:8000/api/usuarios/auditoria/').subscribe({
      next: (data: any) => {
        this.logs = Array.isArray(data) ? data : (data.results || []);
      },
      error: () => this.logs = []
    });
  }
}
