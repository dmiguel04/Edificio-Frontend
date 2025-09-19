import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.scss']
})
export class AuditoriaComponent implements OnInit, OnDestroy {
  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object, private router: Router) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  goToDashboard() {
    // Usar router solo si está disponible (SSR safe)
    if (this.isBrowser && this.router && this.router.navigate) {
      this.router.navigate(['/dashboard']);
    }
  }
  logs: any[] = [];
  private refreshInterval: any;

  isBrowser: boolean;
  // ...

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
