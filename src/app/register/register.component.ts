import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  // Variables para los campos del formulario
  nombre = '';
  apellido = '';
  ci = '';
  email = '';
  sexo = '';
  telefono = '';
  fecha_nacimiento = '';
  username = '';
  password = '';
  mensaje = '';
  mostrarPassword = false;

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    const data = {
      persona: {
        nombre: this.nombre,
        apellido: this.apellido,
        ci: this.ci,
        email: this.email,
        sexo: this.sexo,
        telefono: this.telefono,
        fecha_nacimiento: this.fecha_nacimiento
      },
      username: this.username,
      password: this.password
    };

    this.auth.register(data).subscribe({
      next: (res) => {
        this.mensaje = 'Registro exitoso';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: (err) => {
        this.mensaje = err.error?.message || 'Error en registro';
      }
    });
  }
}
