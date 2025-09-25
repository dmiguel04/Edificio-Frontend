# Sistema de Protección de Rutas - Edificio Frontend

## 📋 Descripción General

Se ha implementado un sistema robusto de protección de rutas que garantiza que solo los usuarios autenticados puedan acceder a las páginas protegidas, y que los usuarios ya autenticados no puedan acceder a páginas de autenticación.

## 🛡️ Componentes del Sistema

### 1. **AuthGuard** (`src/app/guards/auth.guard.ts`)
- **Propósito**: Protege rutas que requieren autenticación
- **Funcionalidad**:
  - Verifica si el usuario está logueado
  - Valida que el token JWT no haya expirado
  - Redirige al login si no está autenticado o el token expiró
  - Preserva la URL de destino para redirección después del login

### 2. **GuestGuard** (`src/app/guards/guest.guard.ts`)
- **Propósito**: Previene acceso a páginas de auth cuando ya está logueado
- **Funcionalidad**:
  - Permite acceso solo a usuarios NO autenticados
  - Redirige al dashboard si el usuario ya está logueado

### 3. **AuthInterceptor** (`src/app/interceptors/auth.interceptor.ts`)
- **Propósito**: Maneja automáticamente tokens y errores de autenticación
- **Funcionalidad**:
  - Agrega automáticamente el token Bearer a las peticiones HTTP
  - Maneja errores 401 (no autorizado) y 403 (prohibido)
  - Limpia tokens y redirige al login en caso de error de autenticación

## 🚦 Configuración de Rutas

### **Rutas Públicas** (Solo para usuarios NO autenticados)
```typescript
// Protegidas por GuestGuard
{ path: '', component: WelcomeComponent, canActivate: [GuestGuard] }
{ path: 'login', component: LoginComponent, canActivate: [GuestGuard] }
{ path: 'register', component: RegisterComponent, canActivate: [GuestGuard] }
{ path: 'verify-email', component: VerifyEmailComponent, canActivate: [GuestGuard] }
{ path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [GuestGuard] }
{ path: 'reset-password', component: ResetPasswordComponent, canActivate: [GuestGuard] }
```

### **Rutas Protegidas** (Solo para usuarios autenticados)
```typescript
// Protegidas por AuthGuard
{ path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] }
{ path: 'perfil', component: PerfilComponent, canActivate: [AuthGuard] }
{ path: 'auditoria', component: AuditoriaComponent, canActivate: [AuthGuard] }
```

## 🔧 Funcionalidades Mejoradas

### **AuthService Mejorado**
- `isLoggedIn()`: Verifica autenticación y validez del token
- `clearTokens()`: Limpia tokens del localStorage
- `getUserFromToken()`: Extrae información del usuario del JWT

### **Sistema de Redirección Inteligente**
- **Login con URL de retorno**: Después del login exitoso, redirige a la página originalmente solicitada
- **Mensajes informativos**: Muestra mensajes de sesión expirada u otros estados

### **Validación de Token JWT**
- Decodifica y verifica la expiración del token
- Limpia automáticamente tokens expirados
- Previene acceso con tokens inválidos

## 🔄 Flujo de Autenticación

### **Usuario NO Autenticado**
1. Intenta acceder a ruta protegida (ej: `/dashboard`)
2. `AuthGuard` detecta que no está autenticado
3. Redirige a `/login?returnUrl=/dashboard`
4. Usuario se loguea exitosamente
5. Redirige automáticamente a `/dashboard`

### **Usuario YA Autenticado**
1. Intenta acceder a ruta de auth (ej: `/login`)
2. `GuestGuard` detecta que ya está autenticado
3. Redirige automáticamente a `/dashboard`

### **Token Expirado**
1. Usuario navega por la aplicación
2. `AuthGuard` o `AuthInterceptor` detecta token expirado
3. Limpia tokens automáticamente
4. Redirige a login con mensaje informativo

## 🛠️ Configuración en app.config.ts

```typescript
providers: [
  // ... otros providers
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }
]
```

## 🔒 Seguridad Implementada

### **Prevención de Acceso No Autorizado**
- ✅ Todas las rutas protegidas requieren autenticación válida
- ✅ Tokens expirados son detectados y manejados automáticamente
- ✅ Redirecciones automáticas previenen acceso no autorizado

### **Experiencia de Usuario Mejorada**
- ✅ Preservación de URL de destino después del login
- ✅ Mensajes informativos sobre estado de sesión
- ✅ Limpieza automática de datos de sesión inválidos

### **Manejo Robusto de Errores**
- ✅ Interceptor maneja errores HTTP de autenticación
- ✅ Limpieza automática en caso de tokens inválidos
- ✅ Logging de eventos de seguridad para debugging

## 📝 Notas de Uso

### **Para Agregar Nuevas Rutas Protegidas**
```typescript
{ 
  path: 'nueva-ruta', 
  component: NuevoComponent, 
  canActivate: [AuthGuard] 
}
```

### **Para Agregar Nuevas Rutas Públicas (solo no autenticados)**
```typescript
{ 
  path: 'nueva-publica', 
  component: NuevoPublicoComponent, 
  canActivate: [GuestGuard] 
}
```

### **Para Rutas Completamente Públicas (acceso libre)**
```typescript
{ 
  path: 'publica-libre', 
  component: PublicaLibreComponent 
  // Sin canActivate
}
```

## 🚨 Consideraciones de Seguridad

1. **Validación del Token**: Se verifica la expiración del JWT localmente
2. **Limpieza Automática**: Tokens inválidos se eliminan automáticamente
3. **Interceptor HTTP**: Maneja errores de autenticación en peticiones API
4. **Redirecciones Seguras**: Previene loops de redirección infinitos
5. **Estado Consistente**: Mantiene sincronizado el estado de autenticación

Este sistema garantiza una experiencia de usuario fluida mientras mantiene la seguridad de la aplicación.