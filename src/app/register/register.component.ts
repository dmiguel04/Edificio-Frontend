import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  persona = {
    nombre: '',
    apellido: '',
    ci: '',
    email: '',
    sexo: '',
    telefono: '',
    fecha_nacimiento: ''
  };
  username = '';
  password = '';
  mensaje = '';
  error = '';
  mostrarPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  registrar() {
    this.mensaje = '';
    this.error = '';
    const body = {
      persona: this.persona,
      username: this.username,
      password: this.password
    };
    this.http.post('http://localhost:8000/api/usuarios/register/', body).subscribe({
      next: (res: any) => {
        this.mensaje = 'Usuario registrado correctamente';
        this.error = '';
        // Redirigir o limpiar formulario si lo deseas
      },
      error: (err: HttpErrorResponse) => {
        if (err.error) {
          if (typeof err.error === 'string') {
            this.error = err.error;
          } else if (typeof err.error === 'object') {
            // Muestra el primer mensaje de error del backend
            const firstKey = Object.keys(err.error)[0];
            this.error = Array.isArray(err.error[firstKey])
              ? err.error[firstKey][0]
              : err.error[firstKey];
          } else {
            this.error = 'Error en registro';
          }
        } else {
          this.error = 'Error en registro';
        }
      }
    });
  }
}