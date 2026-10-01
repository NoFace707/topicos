## Why

El proyecto solo dispone de la infraestructura React, Django y PostgreSQL y de un endpoint de diagnóstico; todavía no ofrece una experiencia utilizable de presupuesto. Este cambio crea un MVP inspirado en el método de presupuesto por sobres de YNAB para que cada usuario pueda registrar su dinero, asignarlo a categorías y conocer cuánto tiene disponible.

## What Changes

- Añadir registro, inicio de sesión y cierre de sesión básicos, con contraseñas de al menos 6 caracteres y datos aislados por usuario.
- Permitir administrar cuentas manuales de efectivo, banco y tarjeta.
- Permitir organizar categorías dentro de grupos directamente en la vista de presupuesto, de modo que su relación sea visible y editable en un único flujo.
- Incorporar un presupuesto mensual con importes asignados editables en cada fila, actividad y disponible, incluyendo el arrastre del disponible entre meses.
- Permitir cálculos de suma y resta en las asignaciones y mover fondos directamente entre sobres sin alterar el dinero listo para asignar.
- Permitir registrar ingresos, gastos y transferencias entre cuentas propias.
- Permitir que un ingreso se dirija opcionalmente a un sobre como actividad positiva, en lugar de pasar por dinero listo para asignar.
- Añadir un dashboard con saldo total, dinero listo para asignar y resumen del presupuesto actual.
- Mantener toda la captura de información financiera manual; no se añadirá conexión ni importación de cuentas bancarias.
- Dejar fuera del MVP la recuperación de contraseña, la verificación de correo, las transacciones programadas, la conciliación avanzada, las metas y las reglas especiales de pago de tarjeta.

## Capabilities

### New Capabilities

- `user-authentication`: Registro, inicio y cierre de sesión básicos, validación mínima de contraseña y aislamiento de datos financieros por usuario.
- `financial-accounts`: Creación, edición, archivo y consulta de cuentas manuales de efectivo, banco y tarjeta con sus saldos.
- `category-organization`: Gestión de grupos de categorías y categorías ordenadas dentro de ellos.
- `monthly-budgeting`: Asignación mensual de dinero, cálculo de actividad y disponible, dinero listo para asignar y arrastre entre meses.
- `financial-transactions`: Registro y edición de ingresos, gastos y transferencias, con impacto coherente en cuentas y presupuesto.
- `budget-dashboard`: Resumen del saldo total, dinero listo para asignar y estado de las categorías del mes seleccionado.

### Modified Capabilities

Ninguna; el proyecto no contiene especificaciones funcionales previas.

## Impact

- Backend Django: nuevos modelos de dominio, migraciones, serializadores, permisos, autenticación y endpoints REST.
- Frontend React: navegación autenticada, formularios, una vista unificada de categorías y presupuesto, vistas de cuentas, transacciones y dashboard.
- PostgreSQL: persistencia de usuarios, cuentas, grupos, categorías, presupuestos mensuales y transacciones.
- Seguridad: las operaciones de la API deberán exigir autenticación salvo registro e inicio de sesión, y filtrar todos los recursos por propietario.
- Pruebas: cobertura de reglas presupuestarias, movimientos entre cuentas, autorización y principales flujos de interfaz.
