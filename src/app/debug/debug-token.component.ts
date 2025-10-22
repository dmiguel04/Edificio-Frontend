import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../services';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-debug-token',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="max-width:900px;margin:2rem auto;padding:1rem;background:#fff;border-radius:8px;">
      <h2>Debug Token</h2>
      <section>
        <h3>Token payload (decoded)</h3>
        <pre>{{ tokenPayload | json }}</pre>
      </section>
      <section style="margin-top:1rem;">
        <h3>/api/usuarios/me/ response</h3>
        <div *ngIf="meLoading">Cargando /me/ ...</div>
        <pre *ngIf="!meLoading">{{ meResponse | json }}</pre>
      </section>
    </div>
  `
})
export class DebugTokenComponent implements OnInit {
  tokenPayload: any = null;
  meResponse: any = null;
  meLoading = false;

  constructor(private auth: AuthService, private userService: UserService) {}

  ngOnInit(): void {
    this.tokenPayload = this.auth.getUserFromToken() || null;
    this.meLoading = true;
    this.userService.getCurrentUser().subscribe({
      next: (me) => { this.meResponse = me; this.meLoading = false; },
      error: (err) => { this.meResponse = { error: err?.error || err?.message || err }; this.meLoading = false; }
    });
  }
}
