# Mi Presupuesto

Aplicación web de presupuesto mensual inspirada en el método por sobres de YNAB. Permite registrar manualmente cuentas y movimientos, asignar dinero a categorías y consultar cuánto queda disponible cada mes.

## Funciones del MVP

- Registro e inicio de sesión con usuario y contraseña de al menos 6 caracteres.
- Cuentas manuales de efectivo, banco y tarjeta.
- Grupos de categorías y categorías ordenables.
- Presupuesto mensual con asignado, actividad, disponible y arrastre entre meses.
- Ingresos, gastos y transferencias entre cuentas.
- Dashboard con saldo neto y dinero listo para asignar.
- Archivo de cuentas y categorías sin perder el historial.

El MVP utiliza una sola moneda y no incluye importación bancaria, conversión de moneda, conciliación avanzada, metas, movimientos programados ni la categoría automática de pago de tarjeta de YNAB.

## Arquitectura

- Frontend: React 18, Vite y Tailwind CSS.
- Backend: Python 3.12, Django 5.1 y Django REST Framework.
- Base de datos: PostgreSQL 16.
- Entorno: Docker Compose.

La API es la fuente de verdad para saldos y cálculos presupuestarios. El frontend nunca calcula ni persiste saldos por su cuenta.

## Configuración

Todo el proyecto usa un único archivo `.env` en la carpeta raíz. Para preparar una instalación nueva:

```bash
cp .env.example .env
```

Variables principales:

| Variable | Uso |
| --- | --- |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Credenciales de PostgreSQL |
| `DJANGO_SECRET_KEY` | Firma de sesiones; debe cambiarse en producción |
| `DJANGO_DEBUG` | Activa o desactiva el modo de desarrollo |
| `DJANGO_ALLOWED_HOSTS` | Hosts aceptados por Django |
| `CORS_ALLOWED_ORIGINS` | Orígenes autorizados para peticiones del frontend |
| `CSRF_TRUSTED_ORIGINS` | Orígenes confiables para formularios y sesión |
| `SESSION_COOKIE_SECURE` | Debe ser `True` cuando se utilice HTTPS |
| `APP_CURRENCY` | Moneda única de presentación; por defecto `BOB` |
| `VITE_API_BASE_URL` | URL pública del backend para React |

No crees archivos `.env` adicionales dentro de `backend/` o `frontend/`.

## Inicio con Docker

```bash
docker compose up --build
```

Servicios:

- Frontend: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:8000/api/](http://localhost:8000/api/)
- Estado: [http://localhost:8000/api/health/](http://localhost:8000/api/health/)
- Administración Django: [http://localhost:8000/admin/](http://localhost:8000/admin/)

El backend espera a PostgreSQL, aplica migraciones y luego inicia el servidor de desarrollo.

## Flujo inicial recomendado

1. Crear un usuario desde la pantalla de registro.
2. Añadir una cuenta de efectivo o banco con su saldo actual.
3. Crear un grupo y una categoría.
4. Registrar un ingreso.
5. Asignar dinero a la categoría en el presupuesto del mes.
6. Registrar un gasto y comprobar cómo cambia la actividad y el disponible.
7. Crear otra cuenta y probar una transferencia.
8. Navegar al mes siguiente para comprobar el arrastre.

## Pruebas y verificación

Backend con PostgreSQL:

```bash
docker compose exec backend python manage.py test
docker compose exec backend python manage.py check
docker compose exec backend python manage.py makemigrations --check --dry-run
```

Frontend:

```bash
cd frontend
npm install
npm run test
npm run build
```

## Comandos de mantenimiento

```bash
# Crear un administrador
docker compose exec backend python manage.py createsuperuser

# Ver logs
docker compose logs -f backend frontend

# Detener servicios sin borrar datos
docker compose down
```

No uses `docker compose down -v` salvo que quieras eliminar de forma deliberada el volumen local de PostgreSQL.
