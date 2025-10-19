import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'edificiofrontend';
  darkMode = false;

  constructor(@Inject(PLATFORM_ID) private platformId: any, public router: Router) {}

  get ocultarNav() {
    return this.router.url.startsWith('/forgot-password') || this.router.url.startsWith('/reset-password');
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    if (isPlatformBrowser(this.platformId)) {
      if (this.darkMode) {
        document.body.style.background = '#181818';
        document.body.style.color = '#f1f1f1';
      } else {
        document.body.style.background = '';
        document.body.style.color = '';
      }
    }
  }
}
