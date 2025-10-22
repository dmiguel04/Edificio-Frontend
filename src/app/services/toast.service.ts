import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type Toast = { type: 'success' | 'error' | 'info'; message: string };

@Injectable({ providedIn: 'root' })
export class ToastService {
  private subject = new Subject<Toast>();
  toasts$ = this.subject.asObservable();

  show(message: string, type: Toast['type'] = 'info') {
    this.subject.next({ message, type });
  }
}
