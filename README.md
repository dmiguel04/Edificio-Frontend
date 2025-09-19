
# Edificiofrontend

Frontend robusto para gestión de edificio, construido con Angular 20 y SSR (Server Side Rendering). Incluye autenticación multi-paso, protección de rutas, auditoría de accesos, logout seguro y automatización de build/serve.

---

## Características principales

- **SSR (Server Side Rendering)**: Renderizado del frontend en servidor para mejor SEO y performance.
- **Autenticación avanzada**: Login multi-paso (token por email, 2FA, QR para activar 2FA), bloqueo/desbloqueo de cuenta en tiempo real.
- **Protección de rutas**: Solo usuarios autenticados pueden acceder a dashboard, perfil y auditoría (AuthGuard).
- **Logout seguro**: Blacklisting del refresh token en backend y limpieza local.
- **Auditoría**: Visualización de logs de acceso y acciones, con auto-refresh.
- **Automatización de build y serve**: Cambios en el código reinician y reconstruyen el servidor automáticamente con `npm run dev:server`.

---


## Servidor de desarrollo (SSR)

Para desarrollo SSR con recarga automática:

```bash
npm run dev:server
```

Esto observará cambios y reconstruirá/levantará el servidor SSR en `http://localhost:4000/`.

Para desarrollo clásico (SPA):

```bash
ng serve
```

Abre tu navegador en `http://localhost:4200/`.


## Estructura y módulos clave

- `src/app/services/auth.service.ts`: Lógica de login, 2FA, validación de tokens, logout seguro.
- `src/app/guards/auth.guard.ts`: Protección de rutas.
- `src/app/dashboard/dashboard.component.ts`: Dashboard principal, navegación y logout.
- `src/app/auditoria/auditoria.component.ts`: Visualización de logs de auditoría, botón volver.
- `src/app/app.routes.ts`: Definición de rutas y guards.


## Build de producción

Para compilar el proyecto:

```bash
ng build
```

Para build SSR:

```bash
npm run build:ssr
```


## Tests

Para ejecutar tests unitarios:

```bash
ng test
```


## Otros comandos útiles

- `npm run build:ssr`: Compila el frontend y el servidor SSR.
- `npm run serve:ssr`: Sirve la app SSR (requiere build previo).
- `npm run dev:server`: Build y serve SSR automáticos con nodemon.


## Recursos adicionales

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Documentación oficial Angular](https://angular.dev/)

---

### Autor y contacto

Proyecto desarrollado por dmiguel04. Para dudas o soporte, contacta al autor.
