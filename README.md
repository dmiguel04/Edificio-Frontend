
# Edificio Frontend

Frontend robusto para gestión de edificio, construido con Angular 20 y SSR (Server Side Rendering). Incluye autenticación multi-paso, protección de rutas, auditoría de accesos, logout ultra-optimizado y automatización de build/serve.

---

## 🚀 Características principales

- **SSR (Server Side Rendering)**: Renderizado del frontend en servidor para mejor SEO y performance.
- **Autenticación avanzada**: Login multi-paso (token por email, 2FA, QR para activar 2FA), bloqueo/desbloqueo de cuenta en tiempo real.
- **Protección de rutas**: Solo usuarios autenticados pueden acceder a dashboard, perfil y auditoría (AuthGuard).
- **Logout ultra-optimizado**: Sistema anti-broken-pipe con timeout agresivo (400ms), limpieza local inmediata, manejo inteligente de errores CORS.
- **Auditoría**: Visualización de logs de acceso y acciones, con auto-refresh.
- **Verificación de email**: Sistema robusto de verificación con códigos de 6 dígitos y reenvío automático.
- **Automatización de build y serve**: Cambios en el código reinician y reconstruyen el servidor automáticamente con `npm run dev:server`.

---

## 🛠️ Servidor de desarrollo

### Desarrollo SSR (Recomendado)
Para desarrollo SSR con recarga automática:

```bash
npm run dev:server
```

Esto observará cambios y reconstruirá/levantará el servidor SSR en `http://localhost:4000/`.

### Desarrollo SPA (Clásico)
Para desarrollo clásico sin SSR:

```bash
ng serve
```

Abre tu navegador en `http://localhost:4200/`.

### 🔧 Desarrollo con backend
Para desarrollo completo con backend Django:
1. Inicia el backend Django en `http://localhost:8000`
2. Inicia el frontend Angular en `http://localhost:4200`
3. Las peticiones CORS están configuradas automáticamente


## 📁 Estructura y módulos clave

### 🔐 Autenticación y Seguridad
- `src/app/services/auth.service.ts`: Lógica de login, 2FA, validación de tokens, logout ultra-optimizado con manejo CORS.
- `src/app/guards/auth.guard.ts`: Protección de rutas con redirección inteligente.
- `src/app/guards/guest.guard.ts`: Protección para usuarios no autenticados.
- `src/app/interceptors/auth.interceptor.ts`: Interceptor automático de tokens JWT.

### 🎯 Componentes principales
- `src/app/dashboard/dashboard.component.ts`: Dashboard principal con logout optimizado (timeout 600ms).
- `src/app/login/login.component.ts`: Login multi-paso con manejo de errores avanzado.
- `src/app/verify-email/verify-email.component.ts`: Verificación de email con códigos de 6 dígitos.
- `src/app/auditoria/auditoria.component.ts`: Visualización de logs de auditoría en tiempo real.

### 🚀 Configuración
- `src/app/app.routes.ts`: Definición de rutas protegidas y guards aplicados.
- `src/app/app.config.ts`: Configuración principal de la aplicación Angular.


## 🏗️ Build de producción

### Build SPA (Single Page Application)
```bash
ng build
```

### Build SSR (Server Side Rendering)
```bash
npm run build:ssr
```

### Servir aplicación SSR en producción
```bash
npm run serve:ssr
```

## 🧪 Testing

Para ejecutar tests unitarios:

```bash
ng test
```

Para tests end-to-end:

```bash
ng e2e
```

## 📋 Comandos útiles

### Desarrollo
- `npm run dev:server`: Build y serve SSR automáticos con nodemon
- `ng serve`: Servidor de desarrollo SPA clásico
- `ng serve --port 4201`: Servidor en puerto personalizado

### Producción
- `npm run build:ssr`: Compila el frontend y el servidor SSR
- `npm run serve:ssr`: Sirve la app SSR (requiere build previo)
- `ng build --configuration production`: Build optimizado para producción

### Utilidades
- `ng generate component nombre`: Crear nuevo componente
- `ng generate service nombre`: Crear nuevo servicio
- `ng generate guard nombre`: Crear nuevo guard


## 🔧 Características técnicas avanzadas

### Logout Ultra-Optimizado
- **Timeout agresivo**: 400ms para evitar broken pipes
- **Limpieza local instantánea**: Tokens eliminados antes de comunicar con backend
- **Manejo CORS inteligente**: Detecta y maneja errores CORS automáticamente
- **Fallback local**: Logout garantizado incluso si backend falla
- **Headers optimizados**: `Connection: close` para conexiones limpias

### Autenticación Robusta
- **Multi-factor**: Token por email + 2FA opcional con QR
- **Bloqueo inteligente**: Bloqueo temporal tras intentos fallidos
- **Verificación email**: Sistema de códigos de 6 dígitos con expiración
- **JWT seguro**: Tokens con validación de expiración automática

### Performance y SEO
- **SSR nativo**: Renderizado del servidor para mejor SEO
- **Lazy loading**: Carga diferida de componentes
- **Interceptors**: Manejo automático de tokens en todas las peticiones

## 📚 Recursos adicionales

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Documentación oficial Angular](https://angular.dev/)
- [Angular SSR Guide](https://angular.dev/guide/ssr)

---

## 👨‍💻 Autor y contacto

**Proyecto desarrollado por:** [dmiguel04](https://github.com/dmiguel04)

**Tecnologías utilizadas:**
- Angular 20 con SSR
- TypeScript
- RxJS para programación reactiva
- JWT para autenticación
- CORS optimizado para desarrollo

Para dudas, sugerencias o soporte técnico, contacta al autor.
