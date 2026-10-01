## Context

El repositorio contiene una base funcional de React 18 con Vite y Tailwind, una API Django REST Framework, PostgreSQL y Docker Compose. `core` solo expone un endpoint de salud, no existen modelos de dominio, autenticación de API, rutas de aplicación ni pruebas. Véase `proposal.md` para la motivación y los límites funcionales.

## Goals / Non-Goals

**Goals:**

- Construir el dominio financiero sobre PostgreSQL con cálculos deterministas y aislamiento por usuario.
- Mantener una API REST como fuente de verdad para saldos y presupuesto; el frontend no duplicará reglas contables.
- Soportar una sola moneda y captura manual para mantener pequeño el primer incremento.
- Organizar backend y frontend por dominio para que las capacidades puedan evolucionar sin sobrecargar `core`.

**Non-Goals:**

- Replicar toda la contabilidad especializada de YNAB, en particular la categoría automática de pago de tarjeta.
- Sincronizar bancos, convertir monedas, conciliar estados bancarios o procesar transacciones programadas.
- Incorporar proveedores externos de identidad, recuperación de contraseña o verificación de correo.
- Crear tiempo real, colaboración entre usuarios o presupuestos compartidos.

## Decisions

### 1. Autenticación basada en sesión de Django

Se usarán usuarios y sesiones de Django con endpoints REST para registro, inicio, cierre y consulta de sesión. La cookie de sesión será `HttpOnly`; las solicitudes que cambian datos cumplirán protección CSRF y el cliente enviará credenciales. En producción se favorecerá servir frontend y API bajo el mismo sitio.

Se eligió sesión sobre JWT porque el MVP solo tiene un cliente web propio, evita administrar renovación y almacenamiento de tokens en JavaScript y aprovecha componentes ya incluidos. JWT podrá evaluarse si aparece una aplicación móvil o una API para terceros.

### 2. Dos módulos de dominio nuevos

`core` conservará salud e infraestructura. Un módulo de usuarios contendrá los endpoints de autenticación y un módulo presupuestario contendrá cuentas, categorías, asignaciones y transacciones. En el frontend se añadirán rutas y componentes por funcionalidad, con una capa de servicios que reutilice el cliente HTTP existente.

Se descarta colocar todos los modelos en `core` porque mezclaría diagnóstico, identidad y reglas financieras. También se evita crear una aplicación Django por entidad, ya que añadiría separación sin beneficio suficiente para el MVP.

### 3. Modelo monetario decimal y moneda única

Todos los importes persistidos usarán decimal de precisión fija y nunca punto flotante. El MVP tratará todas las cuentas como pertenecientes a una misma moneda de presentación configurada para la aplicación; no almacenará tipos de cambio ni sumará monedas distintas.

Esta decisión permite un saldo total significativo. Añadir selección y conversión de moneda implicaría reglas históricas de tipo de cambio fuera del alcance acordado.

### 4. Saldos y presupuesto derivados de hechos

Se persistirán saldos iniciales, transacciones y asignaciones mensuales. Los saldos actuales, la actividad mensual, el disponible y el dinero listo para asignar se calcularán en el servidor a partir de esos hechos:

- `saldo_cuenta = saldo_inicial + ingresos + transferencias_entrantes - gastos - transferencias_salientes`
- `actividad_categoria_mes = suma(ingresos categorizados) - suma(gastos de la categoria fechados en el mes)`
- `disponible_categoria_mes = disponible_mes_anterior + asignado_mes + actividad_mes`
- `listo_para_asignar_mes = saldos_iniciales_presupuestables + ingresos sin categoria acumulados - asignaciones acumuladas`

Los saldos iniciales de efectivo y banco serán presupuestables; el saldo inicial de tarjeta no creará dinero para asignar. Los valores negativos se conservarán y mostrarán. Se prefieren valores derivados sobre contadores mutables para evitar desincronización al editar o eliminar movimientos. Si el volumen futuro lo requiere, se podrán añadir resúmenes materializados sin cambiar el contrato.

### 5. Entidades y restricciones principales

- Cuenta: propietario, nombre, tipo, saldo inicial, estado archivado y fechas de auditoría.
- Grupo de categorías: propietario, nombre, orden y estado archivado.
- Categoría: grupo, nombre, orden y estado archivado; su propietario se deriva y se valida a través del grupo.
- Asignación mensual: categoría, mes normalizado al primer día e importe; será única por categoría y mes.
- Transacción: propietario, tipo, fecha, importe positivo, concepto y cuenta principal; gasto exige categoría, ingreso la acepta opcionalmente y transferencia exige una cuenta destino distinta.

Una transferencia será una sola entidad canónica con cuenta origen y destino. Los dos efectos se calcularán desde ella dentro de una transacción de base de datos, evitando que un lado quede huérfano. La alternativa de dos movimientos enlazados facilita algunos listados, pero añade sincronización y riesgo de pares inconsistentes.

### 6. Archivo en lugar de borrado estructural

Cuentas, categorías y grupos utilizados se archivarán en lugar de eliminarse. Las cuentas o categorías archivadas no aceptarán nuevos movimientos o asignaciones, pero seguirán participando en el historial. Las transacciones sí podrán eliminarse porque el contrato exige reversión explícita y sus valores se derivan nuevamente.

### 7. API agregada para el dashboard

Además de recursos CRUD, la API ofrecerá una lectura agregada por mes que devuelva cuentas, saldo total, listo para asignar y filas de presupuesto agrupadas. Esto reduce viajes del navegador y asegura que todas las pantallas consuman los mismos cálculos del servidor. Las consultas usarán agregaciones y carga anticipada para evitar una consulta por categoría.

### 8. Navegación protegida y espacio unificado de presupuesto

El frontend añadirá enrutamiento cliente, un estado de sesión y una protección de rutas. Existirán vistas para autenticación, dashboard, cuentas, presupuesto y transacciones. Categorías y presupuesto compartirán una sola vista jerárquica: cada grupo será una fila plegable, sus categorías aparecerán anidadas debajo y las columnas mostrarán asignado, actividad y disponible. Desde esa misma vista se crearán y administrarán grupos y categorías, y el importe asignado se editará directamente en la celda de cada categoría. La ruta histórica de categorías redirigirá a presupuesto para no mantener dos experiencias divergentes.

Los gastos continuarán registrándose en transacciones; la columna actividad será un resultado calculado, no un segundo formulario de gastos. Los formularios mostrarán errores de validación del servidor y los listados incluirán estados de carga, vacío y error. El dashboard dirigirá al siguiente paso útil cuando falten cuentas o categorías.

La posición seguirá persistida para conservar un orden estable, pero será un detalle interno: al crear un grupo se asignará la posición siguiente entre los grupos del usuario y, al crear una categoría, la siguiente dentro de su grupo. Los formularios no pedirán este número. Al editar se conservará la posición existente; si una categoría cambia de grupo sin una posición explícita, se añadirá al final del grupo destino. La API continuará aceptando una posición explícita para habilitar un futuro reordenamiento visual.

En la creación de un gasto, la selección de categoría consultará el resumen presupuestario correspondiente al mes de la fecha elegida y precargará el importe con su disponible positivo. El campo seguirá siendo editable y la precarga no guardará ningún movimiento por sí sola. Si el disponible es cero o negativo, el importe quedará vacío. Esta ayuda no se aplicará al editar un movimiento existente, ni a ingresos o transferencias, para no sustituir valores registrados ni introducir reglas ajenas a categorías.

Cada transacción almacenará fecha y hora por separado, una contraparte textual opcional y detalles opcionales. La contraparte representará a quién se pagó en un gasto o quién pagó en un ingreso; no será necesaria en transferencias internas porque las cuentas origen y destino ya identifican a las partes. El campo existente de concepto se conservará en base de datos como `memo`, pero la interfaz lo presentará como “Detalles” para evitar una migración destructiva. Los movimientos históricos recibirán `00:00` como hora durante la migración y conservarán intacto su concepto previo.

La celda de asignación aceptará expresiones locales limitadas a importes decimales y operadores de suma o resta. El navegador evaluará la expresión en centavos, sin `eval`, y enviará a la API únicamente el resultado decimal absoluto. El servidor conservará su contrato de asignación idempotente.

Mover dinero entre sobres será una operación explícita y atómica de la API que bloqueará las dos asignaciones del mes y aplicará importes opuestos. No se persistirá una entidad adicional de historial: las asignaciones mensuales seguirán siendo la fuente de verdad. La operación permitirá que el origen quede negativo, de acuerdo con la política existente de conservar déficits.

Un ingreso sin categoría seguirá alimentando dinero listo para asignar. Si el usuario selecciona una categoría, el ingreso se incluirá como actividad positiva del sobre y se excluirá de dinero listo para asignar, evitando contabilizar el mismo dinero dos veces.

## Risks / Trade-offs

- [Recalcular arrastres desde el inicio puede degradarse con muchos años de datos] -> Agregar índices por propietario, fecha, categoría y mes; medir antes de materializar resultados.
- [Sesiones y frontend/backend en puertos distintos complican CORS y CSRF durante desarrollo] -> Configurar explícitamente orígenes confiables, credenciales y obtención de cookie CSRF; servir bajo un mismo sitio en producción.
- [Permitir sobreasignación y sobregiro produce valores negativos] -> No ocultarlos ni corregirlos automáticamente; destacarlos claramente según las especificaciones.
- [El modelo simplificado de tarjeta no reproduce el flujo completo de YNAB] -> Documentar que la tarjeta es un pasivo ordinario y postergar la categoría de pago automática.
- [Eliminar una transacción cambia meses posteriores por el arrastre] -> Centralizar cálculos y añadir pruebas de regresión para creación, edición y eliminación entre meses.

## Migration Plan

1. Añadir dependencias frontend requeridas, módulos Django y configuración de sesión, CORS y CSRF.
2. Crear y aplicar migraciones del nuevo dominio sobre la base existente, que no contiene datos financieros que convertir.
3. Desplegar primero la API y después el frontend compatible; mientras tanto el endpoint de salud seguirá operativo.
4. Ejecutar pruebas y una verificación manual del flujo registro -> cuenta -> categoría -> ingreso -> asignación -> gasto -> mes siguiente.
5. Para rollback, revertir frontend y backend a la versión previa. Las nuevas tablas pueden conservarse para evitar pérdida de datos; su eliminación solo se hará mediante una migración separada y deliberada.
