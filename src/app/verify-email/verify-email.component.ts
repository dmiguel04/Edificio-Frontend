import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  verifyForm: FormGroup;
  email: string = '';
  isLoading: boolean = false;
  message: string = '';
  error: string = '';
  resendLoading: boolean = false;
  resendCooldown: number = 0;
  resendInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.verifyForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  // platform id for SSR checks
  constructorPlatformIdInjected: any;

  ngAfterContentInit() {
    // noop placeholder to satisfy lifecycle ordering when PLATFORM_ID is injected via constructor below
  }

  ngOnInit() {
    // Obtener el email de los parámetros de la URL
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.router.navigate(['/register']);
      }
    });

    // Agregar event listener para paste en todo el componente (sólo en navegador)
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const inputs = document.querySelectorAll('.digit-input') as NodeListOf<HTMLInputElement>;
        inputs.forEach((input, index) => {
          input.addEventListener('paste', (e) => this.onPaste(e, index));
        });
      }, 100);
    }
  }

  ngOnDestroy() {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  onSubmit() {
    if (this.verifyForm.valid) {
      this.isLoading = true;
      this.error = '';
      this.message = '';

      const codigo = this.verifyForm.get('codigo')?.value;

      this.authService.verificarEmail(this.email, codigo).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.message = response.message;
          
          // Mostrar mensaje exitoso y redirigir después de 3 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          this.error = error.error?.error || 'Error al verificar el código';
          
          // Si el código expiró, limpiar el formulario
          if (error.error?.error === 'Código expirado') {
            this.verifyForm.reset();
          }
        }
      });
    }
  }

  reenviarCodigo() {
    if (this.resendCooldown > 0) return;
    
    this.resendLoading = true;
    this.error = '';
    this.message = '';

    this.authService.reenviarVerificacion(this.email).subscribe({
      next: (response) => {
        this.resendLoading = false;
        this.message = response.message;
        
        // Iniciar cooldown de 60 segundos
        this.startResendCooldown();
        
        // Limpiar el código anterior
        this.verifyForm.get('codigo')?.setValue('');
      },
      error: (error) => {
        this.resendLoading = false;
        this.error = error.error?.error || 'Error al reenviar el código';
      }
    });
  }

  private startResendCooldown() {
    this.resendCooldown = 60;
    this.resendInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  // Método para manejar input de cada dígito
  onDigitInput(event: any, index: number, nextInput: any) {
    const value = event.target.value.replace(/\D/g, ''); // Solo números
    event.target.value = value;
    
    // Actualizar el valor del FormControl
    this.updateCodigoValue();
    
    // Mover al siguiente input si hay un valor y existe el siguiente input
    if (value && nextInput && isPlatformBrowser(this.platformId)) {
      nextInput.focus();
    }
  }

  // Método para manejar teclas especiales
  onKeyDown(event: any, index: number, prevInput: any, nextInput: any) {
    // Permitir backspace para ir al input anterior
    if (event.key === 'Backspace' && !event.target.value && prevInput && isPlatformBrowser(this.platformId)) {
      prevInput.focus();
    }
    
    // Permitir solo números y teclas de control
    if (!/^\d$/.test(event.key) && 
        !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }
  }

  // Actualizar el valor del FormControl con todos los dígitos
  updateCodigoValue() {
    let inputs: NodeListOf<HTMLInputElement> | undefined;
    if (isPlatformBrowser(this.platformId)) {
      inputs = document.querySelectorAll('.digit-input') as NodeListOf<HTMLInputElement>;
    }
    let codigo = '';
    if (inputs) {
      inputs.forEach(input => {
        codigo += input.value || '';
      });
    }
    this.verifyForm.get('codigo')?.setValue(codigo);
  }

  // Método para manejar pegado de código completo
  onPaste(event: ClipboardEvent, startIndex: number) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').substring(0, 6); // Solo números, máximo 6
    
    if (digits.length > 0 && isPlatformBrowser(this.platformId)) {
      const inputs = document.querySelectorAll('.digit-input') as NodeListOf<HTMLInputElement>;
      
      // Llenar los inputs con los dígitos pegados
      for (let i = 0; i < digits.length && (startIndex + i) < inputs.length; i++) {
        inputs[startIndex + i].value = digits[i];
      }
      
      // Enfocar el siguiente input disponible o el último usado
      const nextIndex = Math.min(startIndex + digits.length, inputs.length - 1);
      inputs[nextIndex].focus();
      
      // Actualizar el FormControl
      this.updateCodigoValue();
    }
  }

  // Método para formatear el input y solo permitir números (mantenido para compatibilidad)
  onCodigoInput(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Solo números
    if (value.length > 6) {
      value = value.substring(0, 6); // Máximo 6 dígitos
    }
    this.verifyForm.get('codigo')?.setValue(value);
  }

  // Método para ir al login
  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Método para ir al registro
  goToRegister() {
    this.router.navigate(['/register']);
  }
}