import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toasts" class="toast" [class]="t.type">{{ t.message }}</div>
    </div>
  `,
  styles: [`
    .toast-container { position: fixed; right: 1rem; top: 1rem; z-index: 9999; }
    .toast { margin-bottom: 0.5rem; padding: 0.6rem 0.9rem; border-radius: 6px; color: white; box-shadow: 0 2px 6px rgba(0,0,0,.2);} 
    .success { background: #4caf50; }
    .error { background: #f44336; }
    .info { background: #2196f3; }
  `]
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];
  constructor(private toast: ToastService) {}
  ngOnInit() {
    this.toast.toasts$.subscribe(t => {
      this.toasts.push(t);
      setTimeout(() => {
        this.toasts.shift();
      }, 4000);
    });
  }
}
